import { spawn } from "node:child_process";
import { createServer as createTcpServer } from "node:net";
import { randomUUID } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";

import { createClient } from "@supabase/supabase-js";
import WebSocket from "ws";
import { WebsocketProvider } from "y-websocket";
import * as Y from "yjs";

const supabaseUrl =
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const host = "127.0.0.1";

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Supabase server credentials are required.");
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    detectSessionInUrl: false,
    persistSession: false,
  },
});

async function waitFor(check, description, timeoutMs = 20_000) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if (await check()) return;
    await delay(75);
  }

  throw new Error(`Timed out while ${description}.`);
}

async function availablePort() {
  return new Promise((resolve, reject) => {
    const probe = createTcpServer();
    probe.once("error", reject);
    probe.listen(0, host, () => {
      const address = probe.address();
      const port = typeof address === "object" && address ? address.port : 0;
      probe.close((error) => (error ? reject(error) : resolve(port)));
    });
  });
}

async function startServer(port) {
  const entry = new URL("../server/yjs-server.mjs", import.meta.url);
  const child = spawn(process.execPath, [entry.pathname], {
    env: { ...process.env, YJS_HOST: host, YJS_PORT: String(port) },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  child.stdout.on("data", (chunk) => (output += chunk.toString()));
  child.stderr.on("data", (chunk) => (output += chunk.toString()));
  await waitFor(
    () => output.includes("Qollab Yjs server listening"),
    `starting server ${port}. Output: ${output}`,
  );
  return child;
}

async function stopServer(child) {
  if (!child || child.exitCode !== null) return;
  const exited = new Promise((resolve) => child.once("exit", resolve));
  child.kill("SIGTERM");
  await Promise.race([exited, delay(4_000)]);
  if (child.exitCode === null) child.kill("SIGKILL");
}

const email = `qollab-serverless-${Date.now()}-${randomUUID().slice(0, 8)}@example.com`;
const password = `Verify-${randomUUID()}-A1!`;
const documents = [new Y.Doc(), new Y.Doc()];
const providers = [];
const servers = [];
let roomId = null;
let userId = null;

try {
  const { data: userData, error: userError } =
    await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      password,
      user_metadata: { display_name: "Serverless verifier" },
    });
  if (userError || !userData.user) {
    throw new Error("Could not create the serverless verification user.");
  }
  userId = userData.user.id;

  const { data: sessionData, error: sessionError } =
    await admin.auth.signInWithPassword({ email, password });
  if (sessionError || !sessionData.session) {
    throw new Error("Could not authenticate the verification user.");
  }

  const accessToken = sessionData.session.access_token;
  const userClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
  const { data: rooms, error: roomError } = await userClient.rpc(
    "create_study_room",
    { input_is_public: false, input_name: "Serverless collaboration check" },
  );
  const room = rooms?.[0];
  if (
    roomError ||
    typeof room?.room_id !== "string" ||
    typeof room.room_slug !== "string"
  ) {
    throw new Error("Could not create the serverless verification room.");
  }
  roomId = room.room_id;

  const firstPort = await availablePort();
  servers.push(await startServer(firstPort));
  const secondPort = await availablePort();
  servers.push(await startServer(secondPort));
  const ports = [firstPort, secondPort];
  providers.push(
    ...documents.map(
      (document, index) =>
        new WebsocketProvider(
          `ws://${host}:${ports[index]}`,
          room.room_slug,
          document,
          {
            WebSocketPolyfill: WebSocket,
            disableBc: true,
            maxBackoffTime: 1_000,
            params: { access_token: accessToken },
          },
        ),
    ),
  );

  await waitFor(
    () => providers.every((provider) => provider.synced),
    "synchronizing clients on separate server instances",
  );

  documents[0].getText("notes").insert(0, "Shared through instance A.");
  await waitFor(
    () =>
      documents[1].getText("notes").toString() === "Shared through instance A.",
    "relaying an edit from instance A to instance B",
  );

  documents[0].getText("notes").insert(0, "A ");
  documents[1].getText("notes").insert(0, "B ");
  await waitFor(
    () =>
      documents[0].getText("notes").toString() ===
        documents[1].getText("notes").toString() &&
      documents[0].getText("notes").toString().includes("A ") &&
      documents[0].getText("notes").toString().includes("B "),
    "merging concurrent edits across server instances",
  );

  const expected = documents[0].getText("notes").toString();
  await waitFor(async () => {
    const { data } = await admin
      .from("documents")
      .select("yjs_state")
      .eq("room_id", roomId)
      .eq("kind", "notes")
      .single();
    if (!data?.yjs_state) return false;

    const persisted = new Y.Doc();
    try {
      Y.applyUpdate(persisted, Buffer.from(data.yjs_state, "base64"));
      return persisted.getText("notes").toString() === expected;
    } finally {
      persisted.destroy();
    }
  }, "persisting the cross-instance merge");

  console.log(
    "Serverless collaboration verification passed across two isolated Yjs server processes.",
  );
} finally {
  providers.forEach((provider) => provider.destroy());
  documents.forEach((document) => document.destroy());
  await Promise.all(servers.map(stopServer));
  if (roomId) await admin.from("rooms").delete().eq("id", roomId);
  if (userId) await admin.auth.admin.deleteUser(userId);
}
