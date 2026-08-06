import { randomUUID } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";

import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import WebSocket from "ws";
import { WebsocketProvider } from "y-websocket";
import * as Y from "yjs";

const deploymentUrl = new URL(
  process.env.QOLLAB_DEPLOYMENT_URL ?? "https://qollab-five.vercel.app",
);
const supabaseUrl =
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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
    await delay(100);
  }

  throw new Error(`Timed out while ${description}.`);
}

async function expectUnauthorizedUpgrade(websocketUrl) {
  await new Promise((resolve, reject) => {
    const socket = new WebSocket(websocketUrl, {
      headers: { Origin: deploymentUrl.origin },
    });
    const timeout = setTimeout(
      () => reject(new Error("Unauthorized WebSocket check timed out.")),
      10_000,
    );

    socket.once("unexpected-response", (_request, response) => {
      clearTimeout(timeout);
      const statusCode = response.statusCode;
      response.destroy();
      socket.terminate();
      if (statusCode === 401) resolve();
      else reject(new Error(`Expected 401, received ${statusCode}.`));
    });
    socket.once("open", () => {
      clearTimeout(timeout);
      socket.close();
      reject(new Error("An unauthenticated WebSocket was accepted."));
    });
    socket.once("error", () => {
      // `unexpected-response` carries the status assertion.
    });
  });
}

const email = `qollab-vercel-${Date.now()}-${randomUUID().slice(0, 8)}@example.com`;
const password = `Verify-${randomUUID()}-A1!`;
const cookieJar = new Map();
const document = new Y.Doc();
let provider = null;
let roomId = null;
let userId = null;

try {
  const healthResponse = await fetch(
    new URL("/api/collaboration/health", deploymentUrl),
    { cache: "no-store" },
  );
  const health = await healthResponse.json();
  if (
    !healthResponse.ok ||
    health?.status !== "ok" ||
    health.runtime !== "vercel-function"
  ) {
    throw new Error("The deployed collaboration health route failed.");
  }

  const websocketBase = new URL("/api/collaboration", deploymentUrl);
  websocketBase.protocol = websocketBase.protocol === "https:" ? "wss:" : "ws:";
  await expectUnauthorizedUpgrade(`${websocketBase}/unauthorized-check`);

  const { data: userData, error: userError } =
    await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      password,
      user_metadata: { display_name: "Vercel verifier" },
    });
  if (userError || !userData.user) {
    throw new Error("Could not create the Vercel verification user.");
  }
  userId = userData.user.id;

  const authClient = createServerClient(supabaseUrl, serviceRoleKey, {
    cookies: {
      getAll: () => Array.from(cookieJar.values()),
      setAll: (cookies) => {
        cookies.forEach((cookie) => cookieJar.set(cookie.name, cookie));
      },
    },
  });
  const { data: sessionData, error: sessionError } =
    await authClient.auth.signInWithPassword({ email, password });
  if (sessionError || !sessionData.session) {
    throw new Error("Could not authenticate the Vercel verification user.");
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
    { input_is_public: false, input_name: "Vercel deployment check" },
  );
  const room = rooms?.[0];
  if (
    roomError ||
    typeof room?.room_id !== "string" ||
    typeof room.room_slug !== "string"
  ) {
    throw new Error("Could not create the Vercel verification room.");
  }
  roomId = room.room_id;

  const cookieHeader = Array.from(cookieJar.values())
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");
  class CookieWebSocket extends WebSocket {
    constructor(address, protocols) {
      super(address, protocols, {
        headers: { Cookie: cookieHeader, Origin: deploymentUrl.origin },
      });
    }
  }

  provider = new WebsocketProvider(
    websocketBase.toString().replace(/\/$/, ""),
    room.room_slug,
    document,
    {
      WebSocketPolyfill: CookieWebSocket,
      disableBc: true,
      maxBackoffTime: 1_000,
    },
  );
  await waitFor(() => provider.synced, "opening the deployed WebSocket route");

  const expected = `Vercel persisted ${randomUUID()}`;
  document.getText("notes").insert(0, expected);
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
  }, "persisting an edit from the deployed WebSocket Function");

  console.log(
    `Vercel deployment verification passed at ${deploymentUrl.origin}.`,
  );
} finally {
  provider?.destroy();
  document.destroy();
  if (roomId) await admin.from("rooms").delete().eq("id", roomId);
  if (userId) await admin.auth.admin.deleteUser(userId);
}
