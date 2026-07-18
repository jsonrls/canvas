import { spawn } from "node:child_process";
import { createServer as createTcpServer } from "node:net";
import { setTimeout as delay } from "node:timers/promises";

import { createClient } from "@supabase/supabase-js";
import WebSocket from "ws";
import { WebsocketProvider } from "y-websocket";
import * as Y from "yjs";

const host = "127.0.0.1";
const supabaseUrl =
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY are required.",
  );
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    detectSessionInUrl: false,
    persistSession: false,
  },
});
const createdUserIds = [];
let roomDatabaseId = null;
let activeServer = null;

function createUserClient(accessToken) {
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

async function waitFor(check, description, timeoutMs = 12_000) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if (await check()) {
      return;
    }

    await delay(60);
  }

  throw new Error(`Timed out while ${description}.`);
}

async function findAvailablePort() {
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

async function createVerifiedUser(label) {
  const email = `boardprep-${label}-${Date.now()}-${crypto.randomUUID().slice(0, 8)}@example.com`;
  const password = `Verify-${crypto.randomUUID()}-A1!`;
  const displayName = `Verification ${label}`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    password,
    user_metadata: { display_name: displayName },
  });

  if (error || !data.user) {
    throw new Error("Could not create a temporary verification user.");
  }

  createdUserIds.push(data.user.id);
  const transport = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
  const { data: sessionData, error: sessionError } =
    await transport.auth.signInWithPassword({ email, password });

  if (sessionError || !sessionData.session) {
    throw new Error("Could not sign in a temporary verification user.");
  }

  const client = createUserClient(sessionData.session.access_token);
  const { data: profile, error: profileError } = await client
    .from("profiles")
    .select("id, display_name")
    .eq("id", data.user.id)
    .single();

  if (profileError || profile?.display_name !== displayName) {
    throw new Error("Signup did not provision the expected user profile.");
  }

  return {
    accessToken: sessionData.session.access_token,
    client,
    displayName,
    id: data.user.id,
  };
}

async function startServer(port) {
  const serverEntry = new URL("../server/yjs-server.mjs", import.meta.url);
  const child = spawn(process.execPath, [serverEntry.pathname], {
    env: {
      ...process.env,
      YJS_HOST: host,
      YJS_PORT: String(port),
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";

  child.stdout.on("data", (chunk) => {
    output += chunk.toString();
  });
  child.stderr.on("data", (chunk) => {
    output += chunk.toString();
  });

  await waitFor(
    () => output.includes("BoardPrep Yjs server listening"),
    `starting the durable Yjs server. Output: ${output}`,
  );

  if (output.includes("Yjs was already imported")) {
    child.kill("SIGTERM");
    throw new Error("The durable server loaded duplicate Yjs instances.");
  }

  activeServer = child;
  return child;
}

async function stopServer(child) {
  if (!child || child.exitCode !== null) {
    return;
  }

  const exited = new Promise((resolve) => child.once("exit", resolve));
  child.kill("SIGTERM");
  await Promise.race([exited, delay(4_000)]);

  if (child.exitCode === null) {
    child.kill("SIGKILL");
  }

  if (activeServer === child) {
    activeServer = null;
  }
}

async function expectUpgradeRejection(url, expectedStatus) {
  await new Promise((resolve, reject) => {
    const socket = new WebSocket(url);
    const timeout = setTimeout(
      () => reject(new Error(`Expected WebSocket HTTP ${expectedStatus}.`)),
      5_000,
    );

    socket.once("open", () => {
      clearTimeout(timeout);
      socket.close();
      reject(new Error("Unauthorized WebSocket unexpectedly opened."));
    });
    socket.once("unexpected-response", (_request, response) => {
      clearTimeout(timeout);
      response.resume();

      if (response.statusCode !== expectedStatus) {
        reject(
          new Error(
            `Expected WebSocket HTTP ${expectedStatus}, received ${response.statusCode}.`,
          ),
        );
        return;
      }

      resolve();
    });
    socket.once("error", () => {});
  });
}

let roomSlug = null;
const documentName = "notes";
const documents = [];
const providers = [];

try {
  const [owner, outsider] = await Promise.all([
    createVerifiedUser("owner"),
    createVerifiedUser("outsider"),
  ]);
  const { data: hiddenProfiles, error: hiddenProfilesError } =
    await owner.client.from("profiles").select("id").eq("id", outsider.id);

  if (hiddenProfilesError || hiddenProfiles.length !== 0) {
    throw new Error("Profile RLS exposed a user without a shared room.");
  }

  const updatedOwnerDisplayName = `${owner.displayName} Updated`;
  const { data: updatedOwnProfile, error: updatedOwnProfileError } =
    await owner.client
      .from("profiles")
      .update({ display_name: updatedOwnerDisplayName })
      .eq("id", owner.id)
      .select("display_name, updated_at")
      .single();

  if (
    updatedOwnProfileError ||
    updatedOwnProfile?.display_name !== updatedOwnerDisplayName ||
    typeof updatedOwnProfile.updated_at !== "string"
  ) {
    throw new Error("A user could not update their own profile.");
  }

  owner.displayName = updatedOwnerDisplayName;

  const { data: createdRooms, error: roomError } = await owner.client.rpc(
    "create_study_room",
    {
      input_is_public: true,
      input_name: "Version history verification",
    },
  );
  const room = createdRooms?.[0];

  if (roomError || !room) {
    throw new Error("Owner could not create an atomic RLS-protected room.");
  }

  roomDatabaseId = room.room_id;
  roomSlug = room.room_slug;

  const { data: documentRow, error: documentError } = await owner.client
    .from("documents")
    .select("id")
    .eq("room_id", room.room_id)
    .eq("kind", "notes")
    .single();

  if (documentError || !documentRow) {
    throw new Error(
      "Atomic room creation did not provision the notes document.",
    );
  }

  const { data: outsiderDocuments, error: outsiderReadError } =
    await outsider.client
      .from("documents")
      .select("id")
      .eq("room_id", room.room_id);

  if (outsiderReadError || outsiderDocuments.length !== 0) {
    throw new Error("RLS exposed a room document to a non-member.");
  }

  const { error: escalationError } = await outsider.client
    .from("room_members")
    .insert({ role: "owner", room_id: room.room_id, user_id: outsider.id });

  if (!escalationError) {
    throw new Error("A public-room joiner escalated to owner.");
  }

  const { error: viewerMembershipError } = await admin
    .from("room_members")
    .insert({ role: "viewer", room_id: room.room_id, user_id: outsider.id });

  if (viewerMembershipError) {
    throw new Error("Could not establish the temporary viewer membership.");
  }

  const { data: sharedProfile, error: sharedProfileError } =
    await outsider.client
      .from("profiles")
      .select("display_name")
      .eq("id", owner.id)
      .single();

  if (sharedProfileError || sharedProfile?.display_name !== owner.displayName) {
    throw new Error("A room member could not view a collaborator profile.");
  }

  const { data: foreignProfileUpdates, error: foreignProfileUpdateError } =
    await outsider.client
      .from("profiles")
      .update({ display_name: "Unauthorized rename" })
      .eq("id", owner.id)
      .select("id");

  if (!foreignProfileUpdateError && foreignProfileUpdates.length > 0) {
    throw new Error("A collaborator modified another user's profile.");
  }

  const { data: viewerDocuments, error: viewerReadError } =
    await outsider.client
      .from("documents")
      .select("id")
      .eq("room_id", room.room_id)
      .eq("kind", "notes");

  if (viewerReadError || viewerDocuments.length !== 1) {
    throw new Error("A viewer could not read the shared document.");
  }

  const { data: viewerWrites, error: viewerWriteError } = await outsider.client
    .from("documents")
    .update({ title: "Viewer mutation" })
    .eq("id", documentRow.id)
    .select("id");

  if (!viewerWriteError && viewerWrites.length > 0) {
    throw new Error("A viewer modified the shared document.");
  }

  const port = await findAvailablePort();
  const serverUrl = `ws://${host}:${port}`;
  let child = await startServer(port);
  await expectUpgradeRejection(`${serverUrl}/${roomSlug}`, 401);
  await expectUpgradeRejection(
    `${serverUrl}/${roomSlug}?access_token=${encodeURIComponent(outsider.accessToken)}`,
    403,
  );

  documents.push(new Y.Doc(), new Y.Doc());
  providers.push(
    ...documents.map(
      (document) =>
        new WebsocketProvider(serverUrl, roomSlug, document, {
          WebSocketPolyfill: WebSocket,
          disableBc: true,
          maxBackoffTime: 1_000,
          params: { access_token: owner.accessToken },
        }),
    ),
  );
  await waitFor(
    () => providers.every((provider) => provider.synced),
    "synchronizing authenticated Yjs clients",
  );

  const expectedText = "Durable BoardPrep version history verified.";
  documents[0].getText(documentName).insert(0, expectedText);
  await waitFor(
    () => documents[1].getText(documentName).toString() === expectedText,
    "replicating an authenticated edit",
  );
  await waitFor(async () => {
    const { data } = await admin
      .from("documents")
      .select("yjs_state")
      .eq("id", documentRow.id)
      .single();
    return typeof data?.yjs_state === "string" && data.yjs_state.length > 0;
  }, "persisting the Yjs state in Supabase");

  providers.splice(0).forEach((provider) => provider.destroy());
  documents.splice(0).forEach((document) => document.destroy());
  await stopServer(child);

  child = await startServer(port);
  const restoredDocument = new Y.Doc();
  const restoredProvider = new WebsocketProvider(
    serverUrl,
    roomSlug,
    restoredDocument,
    {
      WebSocketPolyfill: WebSocket,
      disableBc: true,
      maxBackoffTime: 1_000,
      params: { access_token: owner.accessToken },
    },
  );
  documents.push(restoredDocument);
  providers.push(restoredProvider);
  await waitFor(
    () => restoredProvider.synced,
    "synchronizing after the server restart",
  );
  await waitFor(
    () => restoredDocument.getText(documentName).toString() === expectedText,
    "loading the persisted document after restart",
  );

  const yjsState = Buffer.from(
    Y.encodeStateAsUpdate(restoredDocument),
  ).toString("base64");
  const { data: version, error: versionError } = await owner.client
    .from("document_versions")
    .insert({
      content: {
        content: [
          {
            content: [{ text: expectedText, type: "text" }],
            type: "paragraph",
          },
        ],
        type: "doc",
      },
      created_by: owner.id,
      document_id: documentRow.id,
      label: "Verified checkpoint",
      yjs_state: yjsState,
    })
    .select("id")
    .single();

  if (versionError || !version) {
    throw new Error("An authenticated member could not create a version.");
  }

  const { data: outsiderVersions, error: outsiderVersionError } =
    await outsider.client
      .from("document_versions")
      .select("id")
      .eq("document_id", documentRow.id);

  if (outsiderVersionError || outsiderVersions.length !== 1) {
    throw new Error("A viewer could not read version history.");
  }

  const { error: viewerVersionError } = await outsider.client
    .from("document_versions")
    .insert({
      content: { content: [], type: "doc" },
      created_by: outsider.id,
      document_id: documentRow.id,
      label: "Viewer write attempt",
      yjs_state: yjsState,
    });

  if (!viewerVersionError) {
    throw new Error("A viewer created a document version.");
  }

  const { error: immutableUpdateError } = await owner.client
    .from("document_versions")
    .update({ label: "Mutated" })
    .eq("id", version.id);

  if (!immutableUpdateError) {
    throw new Error("An authenticated member mutated an immutable version.");
  }

  console.log(
    "Version-history verification passed: profile provisioning, privacy, self-update, RLS, read-only viewers, role escalation denial, WebSocket auth, restart persistence, snapshots, and immutability.",
  );
} finally {
  providers.forEach((provider) => provider.destroy());
  documents.forEach((document) => document.destroy());
  await stopServer(activeServer);

  if (roomDatabaseId) {
    await admin.from("rooms").delete().eq("id", roomDatabaseId);
  }

  for (const userId of createdUserIds) {
    await admin.auth.admin.deleteUser(userId);
  }
}
