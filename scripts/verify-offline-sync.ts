import assert from "node:assert/strict";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { randomUUID } from "node:crypto";
import { createServer as createTcpServer } from "node:net";
import { setTimeout as delay } from "node:timers/promises";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import "fake-indexeddb/auto";
import WebSocket from "ws";
import { WebsocketProvider } from "y-websocket";
import * as Y from "yjs";

import {
  buildOfflineDocumentKey,
  clearOfflineDocumentsForUser,
  createOfflineDocument,
  registerOfflineDocument,
} from "../src/lib/collaboration/offline-document";

const host = "127.0.0.1";
const documentName = "notes";
const firstUserId = "11111111-1111-4111-8111-111111111111";
const secondUserId = "22222222-2222-4222-8222-222222222222";
const localRoomId = "offline-local-verification";
function requireEnvironmentValue(
  value: string | undefined,
  name: string,
): string {
  if (!value) {
    throw new Error(`${name} is required for offline sync verification.`);
  }

  return value;
}

const supabaseUrl = requireEnvironmentValue(
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL,
  "SUPABASE_URL",
);
const serviceRoleKey = requireEnvironmentValue(
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  "SUPABASE_SERVICE_ROLE_KEY",
);

class MemoryStorage implements Storage {
  readonly #values = new Map<string, string>();

  get length(): number {
    return this.#values.size;
  }

  clear(): void {
    this.#values.clear();
  }

  getItem(key: string): string | null {
    return this.#values.get(key) ?? null;
  }

  key(index: number): string | null {
    return [...this.#values.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.#values.delete(key);
  }

  setItem(key: string, value: string): void {
    this.#values.set(key, value);
  }
}

const browserStorage = new MemoryStorage();
Object.defineProperty(globalThis, "window", {
  configurable: true,
  value: { localStorage: browserStorage },
});

async function waitFor(
  check: () => boolean | Promise<boolean>,
  description: string,
  timeoutMs = 12_000,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if (await check()) {
      return;
    }

    await delay(60);
  }

  throw new Error(`Timed out while ${description}.`);
}

async function findAvailablePort(): Promise<number> {
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

async function startServer(
  port: number,
): Promise<ChildProcessWithoutNullStreams> {
  const serverEntry = new URL("../server/yjs-server.mjs", import.meta.url);
  const child = spawn(process.execPath, [serverEntry.pathname], {
    env: {
      ...process.env,
      YJS_HOST: host,
      YJS_PORT: String(port),
    },
    stdio: ["pipe", "pipe", "pipe"],
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
    `starting the offline verification server. Output: ${output}`,
  );

  if (output.includes("Yjs was already imported")) {
    child.kill("SIGTERM");
    throw new Error("The offline verifier loaded duplicate Yjs instances.");
  }

  return child;
}

async function stopServer(
  child: ChildProcessWithoutNullStreams | null,
): Promise<void> {
  if (!child || child.exitCode !== null) {
    return;
  }

  const exited = new Promise<void>((resolve) => {
    child.once("exit", () => resolve());
  });
  child.kill("SIGTERM");
  await Promise.race([exited, delay(4_000)]);

  if (child.exitCode === null) {
    child.kill("SIGKILL");
  }
}

function createUserClient(accessToken: string): SupabaseClient {
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

async function verifyLocalPersistence(): Promise<void> {
  const expectedKey = `boardprep:${firstUserId}:${localRoomId}:notes`;
  assert.equal(buildOfflineDocumentKey(firstUserId, localRoomId), expectedKey);
  assert.equal(
    buildOfflineDocumentKey(firstUserId, localRoomId, "pdf"),
    `boardprep:${firstUserId}:${localRoomId}:pdf`,
  );
  assert.equal(
    buildOfflineDocumentKey(firstUserId, localRoomId, "whiteboard"),
    `boardprep:${firstUserId}:${localRoomId}:whiteboard`,
  );
  assert.throws(() => buildOfflineDocumentKey("invalid", localRoomId));
  assert.throws(() => buildOfflineDocumentKey(firstUserId, "Invalid Room"));
  assert.throws(() => registerOfflineDocument(firstUserId, "wrong-key"));

  const firstDocument = new Y.Doc();
  const firstPersistence = await createOfflineDocument(
    firstUserId,
    localRoomId,
    firstDocument,
  );
  assert.equal(firstPersistence.status, "saved");
  firstDocument.getText(documentName).insert(0, "Persisted offline notes");
  await delay(80);
  await firstPersistence.persistence.destroy();
  firstDocument.destroy();

  const restoredDocument = new Y.Doc();
  const restoredPersistence = await createOfflineDocument(
    firstUserId,
    localRoomId,
    restoredDocument,
  );
  assert.equal(restoredPersistence.status, "saved");
  assert.equal(
    restoredDocument.getText(documentName).toString(),
    "Persisted offline notes",
  );

  const otherAccountDocument = new Y.Doc();
  const otherAccountPersistence = await createOfflineDocument(
    secondUserId,
    localRoomId,
    otherAccountDocument,
  );
  assert.equal(otherAccountPersistence.status, "saved");
  assert.equal(otherAccountDocument.getText(documentName).toString(), "");
  otherAccountDocument.getText(documentName).insert(0, "Other account notes");

  const otherRoomDocument = new Y.Doc();
  const otherRoomPersistence = await createOfflineDocument(
    firstUserId,
    "different-room",
    otherRoomDocument,
  );
  assert.equal(otherRoomPersistence.status, "saved");
  assert.equal(otherRoomDocument.getText(documentName).toString(), "");

  const pdfDocument = new Y.Doc();
  const pdfPersistence = await createOfflineDocument(
    firstUserId,
    localRoomId,
    pdfDocument,
    "pdf",
  );
  const whiteboardDocument = new Y.Doc();
  const whiteboardPersistence = await createOfflineDocument(
    firstUserId,
    localRoomId,
    whiteboardDocument,
    "whiteboard",
  );
  assert.equal(pdfPersistence.status, "saved");
  assert.equal(whiteboardPersistence.status, "saved");
  pdfDocument.getMap("annotations").set("pdf-only", true);
  assert.equal(whiteboardDocument.getMap("annotations").size, 0);
  whiteboardDocument.getMap("elements").set("board-only", true);
  assert.equal(pdfDocument.getMap("elements").size, 0);
  await delay(80);

  await restoredPersistence.persistence.destroy();
  restoredDocument.destroy();
  await otherAccountPersistence.persistence.destroy();
  otherAccountDocument.destroy();
  await otherRoomPersistence.persistence.destroy();
  otherRoomDocument.destroy();
  await pdfPersistence.persistence.destroy();
  pdfDocument.destroy();
  await whiteboardPersistence.persistence.destroy();
  whiteboardDocument.destroy();

  const cleanup = await clearOfflineDocumentsForUser(firstUserId);
  assert.equal(cleanup.registryAvailable, true);
  assert.equal(cleanup.failed, 0);
  assert.equal(cleanup.cleared, 4);

  const clearedDocument = new Y.Doc();
  const clearedPersistence = await createOfflineDocument(
    firstUserId,
    localRoomId,
    clearedDocument,
  );
  assert.equal(clearedDocument.getText(documentName).toString(), "");
  await clearedPersistence.persistence?.destroy();
  clearedDocument.destroy();

  const retainedDocument = new Y.Doc();
  const retainedPersistence = await createOfflineDocument(
    secondUserId,
    localRoomId,
    retainedDocument,
  );
  assert.equal(
    retainedDocument.getText(documentName).toString(),
    "Other account notes",
  );
  await retainedPersistence.persistence?.destroy();
  retainedDocument.destroy();
  await clearOfflineDocumentsForUser(firstUserId);
  await clearOfflineDocumentsForUser(secondUserId);

  const indexedDbDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    "indexedDB",
  );
  Object.defineProperty(globalThis, "indexedDB", {
    configurable: true,
    value: {
      open: () => {
        throw new Error("IndexedDB disabled for verification.");
      },
    },
  });

  try {
    const fallbackDocument = new Y.Doc();
    const fallback = await createOfflineDocument(
      firstUserId,
      "storage-unavailable",
      fallbackDocument,
    );
    assert.equal(fallback.status, "unavailable");
    fallbackDocument.getText(documentName).insert(0, "Memory still works");
    assert.equal(
      fallbackDocument.getText(documentName).toString(),
      "Memory still works",
    );
    fallbackDocument.destroy();
  } finally {
    if (indexedDbDescriptor) {
      Object.defineProperty(globalThis, "indexedDB", indexedDbDescriptor);
    }
  }
}

async function verifyAuthenticatedReconnect(): Promise<void> {
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
  const email = `boardprep-offline-${Date.now()}-${randomUUID().slice(0, 8)}@example.com`;
  const password = `Verify-${randomUUID()}-A1!`;
  const providers: WebsocketProvider[] = [];
  const documents: Y.Doc[] = [];
  let server: ChildProcessWithoutNullStreams | null = null;
  let roomDatabaseId: string | null = null;
  let userId: string | null = null;

  try {
    const { data: userData, error: userError } =
      await admin.auth.admin.createUser({
        email,
        email_confirm: true,
        password,
        user_metadata: { display_name: "Offline verification" },
      });

    if (userError || !userData.user) {
      throw new Error("Could not create the offline verification user.");
    }

    userId = userData.user.id;
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
      throw new Error("Could not sign in the offline verification user.");
    }

    const userClient = createUserClient(sessionData.session.access_token);
    const { data: createdRooms, error: roomError } = await userClient.rpc(
      "create_study_room",
      {
        input_is_public: true,
        input_name: "Offline sync verification",
      },
    );
    const room = createdRooms?.[0];

    if (
      roomError ||
      typeof room?.room_id !== "string" ||
      typeof room.room_slug !== "string"
    ) {
      throw new Error("Could not create the offline verification room.");
    }

    roomDatabaseId = room.room_id;
    const roomSlug = room.room_slug;
    const { data: documentRows, error: documentError } = await userClient
      .from("documents")
      .select("id, kind")
      .eq("room_id", room.room_id);

    if (documentError || documentRows?.length !== 3) {
      throw new Error(
        "Atomic room creation did not initialize all collaborative documents.",
      );
    }

    const documentIds = new Map(
      documentRows.map((document) => [document.kind, document.id]),
    );
    const notesDocumentId = documentIds.get("notes");

    if (!notesDocumentId) {
      throw new Error("The notes verification document is missing.");
    }

    const port = await findAvailablePort();
    const serverUrl = `ws://${host}:${port}`;
    server = await startServer(port);
    const localDocument = new Y.Doc();
    const observerDocument = new Y.Doc();
    documents.push(localDocument, observerDocument);
    const localPersistence = await createOfflineDocument(
      userId,
      roomSlug,
      localDocument,
    );
    assert.equal(localPersistence.status, "saved");

    const createProvider = (
      document: Y.Doc,
      remoteDocumentName = roomSlug,
    ): WebsocketProvider =>
      new WebsocketProvider(serverUrl, remoteDocumentName, document, {
        WebSocketPolyfill: WebSocket as unknown as typeof globalThis.WebSocket,
        disableBc: true,
        maxBackoffTime: 1_000,
        params: { access_token: sessionData.session.access_token },
      });
    const firstProvider = createProvider(localDocument);
    const observerProvider = createProvider(observerDocument);
    providers.push(firstProvider, observerProvider);
    await waitFor(
      () => firstProvider.synced && observerProvider.synced,
      "synchronizing the initial offline verification clients",
    );

    localDocument.getText(documentName).insert(0, "Shared baseline");
    await waitFor(
      () =>
        observerDocument.getText(documentName).toString() === "Shared baseline",
      "replicating the baseline before disconnection",
    );

    firstProvider.destroy();
    providers.splice(providers.indexOf(firstProvider), 1);
    localDocument
      .getText(documentName)
      .insert(localDocument.getText(documentName).length, " + offline edit");
    observerDocument.getText(documentName).insert(0, "remote edit + ");
    await delay(80);

    const reconnectProvider = createProvider(localDocument);
    providers.push(reconnectProvider);
    await waitFor(
      () => reconnectProvider.synced,
      "reconnecting the locally persisted document",
    );
    await waitFor(() => {
      const localText = localDocument.getText(documentName).toString();
      const observerText = observerDocument.getText(documentName).toString();
      return (
        localText === observerText &&
        localText.includes("remote edit + ") &&
        localText.includes(" + offline edit")
      );
    }, "merging concurrent offline and remote edits");
    await waitFor(async () => {
      const { data } = await admin
        .from("documents")
        .select("yjs_state")
        .eq("id", notesDocumentId)
        .single();
      return typeof data?.yjs_state === "string" && data.yjs_state.length > 0;
    }, "persisting the merged offline state in Supabase");

    for (const kind of ["pdf", "whiteboard"] as const) {
      const left = new Y.Doc();
      const right = new Y.Doc();
      documents.push(left, right);
      const remoteName = `${roomSlug}--${kind}`;
      const leftProvider = createProvider(left, remoteName);
      const rightProvider = createProvider(right, remoteName);
      providers.push(leftProvider, rightProvider);
      await waitFor(
        () => leftProvider.synced && rightProvider.synced,
        `synchronizing the ${kind} verification clients`,
      );

      left.getMap("objects").set(`${kind}-left`, { source: "left" });
      right.getMap("objects").set(`${kind}-right`, { source: "right" });
      await waitFor(
        () =>
          left.getMap("objects").size === 2 &&
          right.getMap("objects").size === 2,
        `merging independent ${kind} objects`,
      );

      const documentId = documentIds.get(kind);
      await waitFor(async () => {
        const { data } = await admin
          .from("documents")
          .select("yjs_state")
          .eq("id", documentId)
          .single();
        return typeof data?.yjs_state === "string" && data.yjs_state.length > 0;
      }, `persisting the ${kind} state in Supabase`);
    }

    await localPersistence.persistence.destroy();
    await clearOfflineDocumentsForUser(userId);
  } finally {
    providers.forEach((provider) => provider.destroy());
    documents.forEach((document) => document.destroy());
    await stopServer(server);

    if (roomDatabaseId) {
      await admin.from("rooms").delete().eq("id", roomDatabaseId);
    }

    if (userId) {
      await admin.auth.admin.deleteUser(userId);
    }
  }
}

async function main(): Promise<void> {
  await verifyLocalPersistence();
  await verifyAuthenticatedReconnect();
  console.log(
    "Offline-sync verification passed: account/room/tool isolation, recovery, cleanup, storage fallback, authenticated reconnection, independent notes/PDF/whiteboard CRDT merges, and durable persistence.",
  );
}

void main().catch((error: unknown) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Offline sync verification failed.",
  );
  process.exitCode = 1;
});
