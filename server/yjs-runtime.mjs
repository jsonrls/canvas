import { createHmac, randomUUID } from "node:crypto";
import { createRequire } from "node:module";

import { createClient } from "@supabase/supabase-js";

import { parseDocumentName } from "./document-name.mjs";

const require = createRequire(import.meta.url);
const Y = require("yjs");
const awarenessProtocol = require("y-protocols/awareness");
const decoding = require("lib0/decoding");
const {
  docs,
  getYDoc,
  setContentInitializor,
  setPersistence,
  setupWSConnection,
} = require("y-websocket/bin/utils");

const supabaseUrl =
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const allowedOrigin = process.env.YJS_ALLOWED_ORIGIN;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required by the Yjs server.",
  );
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    detectSessionInUrl: false,
    persistSession: false,
  },
});

const instanceId = randomUUID();
const loadOrigin = Symbol("supabase-persistence-load");
const documentIds = new Map();
const persistTimers = new Map();
const lastEditors = new Map();
const documentRelays = new Map();
const presenceRelays = new Map();
const presenceRooms = new Map();
const activePresentations = new Map();
const presentationTimeouts = new Map();
const PRESENTATION_WORKSPACES = new Set(["notes", "pdf", "whiteboard"]);
const MESSAGE_SYNC = 0;
const MESSAGE_AWARENESS = 1;
const SYNC_STEP_ONE = 0;
const RELAY_CHUNK_CHARACTERS = 96_000;
const MAX_RELAY_CHUNKS = 128;
const RELAY_ASSEMBLY_TIMEOUT_MS = 15_000;
const PRESENTATION_TIMEOUT_MS = 5_000;

function headerValue(request, name) {
  if (typeof request.headers?.get === "function") {
    return request.headers.get(name) ?? undefined;
  }

  const value = request.headers?.[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
}

function requestUrl(request) {
  return new URL(request.url ?? "/", "http://localhost");
}

function relativeCollaborationPath(url) {
  const marker = "/api/collaboration/";
  const markerIndex = url.pathname.indexOf(marker);

  return markerIndex >= 0
    ? url.pathname.slice(markerIndex + marker.length)
    : url.pathname.replace(/^\/+/, "");
}

function relayName(scope, identifier) {
  const digest = createHmac("sha256", serviceRoleKey)
    .update(`${scope}:${identifier}`)
    .digest("hex");
  return `qollab:${scope}:${digest}`;
}

function waitForSubscription(channel, label) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error(`${label} relay subscription timed out.`)),
      10_000,
    );

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        clearTimeout(timeout);
        resolve();
        return;
      }

      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        clearTimeout(timeout);
        reject(new Error(`${label} relay could not subscribe.`));
      }
    });
  });
}

async function sendBroadcast(channel, event, payload) {
  const result = await channel.send({ event, payload, type: "broadcast" });

  if (result !== "ok") {
    throw new Error(`Supabase Realtime broadcast failed: ${result}.`);
  }
}

function toUint8Array(data) {
  if (data instanceof ArrayBuffer) return new Uint8Array(data);
  if (Array.isArray(data)) return new Uint8Array(Buffer.concat(data));
  return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
}

function normalizeRelayChunk(payload) {
  if (
    !payload ||
    typeof payload !== "object" ||
    typeof payload.source !== "string" ||
    typeof payload.updateId !== "string" ||
    typeof payload.chunk !== "string" ||
    payload.chunk.length > RELAY_CHUNK_CHARACTERS ||
    !Number.isInteger(payload.index) ||
    !Number.isInteger(payload.total) ||
    payload.index < 0 ||
    payload.total < 1 ||
    payload.total > MAX_RELAY_CHUNKS ||
    payload.index >= payload.total
  ) {
    return null;
  }

  return payload;
}

function receiveRelayChunk(relay, event, rawPayload) {
  const payload = normalizeRelayChunk(rawPayload);

  if (!payload || payload.source === instanceId) return;

  const partialKey = `${event}:${payload.source}:${payload.updateId}`;
  let partial = relay.partials.get(partialKey);

  if (!partial) {
    partial = {
      chunks: new Array(payload.total),
      timer: setTimeout(() => {
        relay.partials.delete(partialKey);
      }, RELAY_ASSEMBLY_TIMEOUT_MS),
      userId: typeof payload.userId === "string" ? payload.userId : undefined,
    };
    relay.partials.set(partialKey, partial);
  }

  if (partial.chunks.length !== payload.total) return;
  partial.chunks[payload.index] = payload.chunk;

  if (partial.chunks.some((chunk) => typeof chunk !== "string")) return;

  clearTimeout(partial.timer);
  relay.partials.delete(partialKey);
  const update = Buffer.from(partial.chunks.join(""), "base64");
  const origin = {
    boardprepUserId: partial.userId,
    qollabRealtime: true,
  };

  if (event === "yjs-update") {
    Y.applyUpdate(relay.document, update, origin);
    return;
  }

  awarenessProtocol.applyAwarenessUpdate(
    relay.document.awareness,
    update,
    origin,
  );
}

async function publishRelayUpdate(documentName, event, update, userId) {
  const relay = documentRelays.get(documentName);
  if (!relay) return;

  await relay.ready;
  const encoded = Buffer.from(update).toString("base64");
  const total = Math.max(1, Math.ceil(encoded.length / RELAY_CHUNK_CHARACTERS));

  if (total > MAX_RELAY_CHUNKS) {
    throw new Error("A collaboration update exceeded the relay size limit.");
  }

  const updateId = randomUUID();

  for (let index = 0; index < total; index += 1) {
    await sendBroadcast(relay.channel, event, {
      chunk: encoded.slice(
        index * RELAY_CHUNK_CHARACTERS,
        (index + 1) * RELAY_CHUNK_CHARACTERS,
      ),
      index,
      source: instanceId,
      total,
      updateId,
      userId,
    });
  }
}

function ensureDocumentRelay(documentName, document) {
  const existing = documentRelays.get(documentName);
  if (existing) return existing.ready;

  const channel = supabase.channel(relayName("document", documentName), {
    config: { broadcast: { ack: true, self: false } },
  });
  const relay = { channel, document, partials: new Map(), ready: null };

  channel
    .on("broadcast", { event: "yjs-update" }, ({ payload }) => {
      receiveRelayChunk(relay, "yjs-update", payload);
    })
    .on("broadcast", { event: "awareness-update" }, ({ payload }) => {
      receiveRelayChunk(relay, "awareness-update", payload);
    });

  relay.ready = waitForSubscription(channel, "Document");
  documentRelays.set(documentName, relay);
  return relay.ready;
}

async function releaseDocumentRelay(documentName) {
  const relay = documentRelays.get(documentName);
  if (!relay) return;

  documentRelays.delete(documentName);
  relay.partials.forEach((partial) => clearTimeout(partial.timer));
  relay.partials.clear();
  await supabase.removeChannel(relay.channel);
}

async function findDocument(documentName) {
  const parsed = parseDocumentName(documentName);

  if (!parsed) throw new Error("Collaborative document name is invalid.");

  const { data: room, error: roomError } = await supabase
    .from("rooms")
    .select("id, viewer_can_collaborate")
    .eq("slug", parsed.roomSlug)
    .single();

  if (roomError || !room) throw new Error("Room document not found.");

  let documentQuery;

  if (parsed.isBreakout) {
    const { data: breakout, error: breakoutError } = await supabase
      .from("breakout_rooms")
      .select("id")
      .eq("room_id", room.id)
      .eq("code", parsed.breakoutCode)
      .single();

    if (breakoutError || !breakout) {
      throw new Error("Breakout document not found.");
    }

    documentQuery = supabase
      .from("breakout_documents")
      .select("id, yjs_state")
      .eq("breakout_room_id", breakout.id)
      .eq("kind", parsed.kind)
      .single();
  } else {
    documentQuery = supabase
      .from("documents")
      .select("id, yjs_state")
      .eq("room_id", room.id)
      .eq("kind", parsed.kind)
      .single();
  }

  const { data: document, error: documentError } = await documentQuery;

  if (documentError || !document) {
    throw new Error("Room document not found.");
  }

  return {
    ...document,
    table: parsed.isBreakout ? "breakout_documents" : "documents",
  };
}

async function persistDocument(documentName, document) {
  const storedDocument = documentIds.get(documentName);

  if (!storedDocument) {
    throw new Error("Cannot persist an uninitialized room document.");
  }

  const now = new Date().toISOString();
  const changes = {
    updated_at: now,
    yjs_state: Buffer.from(Y.encodeStateAsUpdate(document)).toString("base64"),
    yjs_state_updated_at: now,
  };
  const updatedBy = lastEditors.get(documentName);
  if (updatedBy) changes.updated_by = updatedBy;

  const { error } = await supabase
    .from(storedDocument.table)
    .update(changes)
    .eq("id", storedDocument.id);

  if (error) {
    throw new Error("Supabase rejected a collaborative document write.");
  }
}

function schedulePersist(documentName, document, origin) {
  if (origin?.boardprepUserId) {
    lastEditors.set(documentName, origin.boardprepUserId);
  }

  const existingTimer = persistTimers.get(documentName);
  if (existingTimer) clearTimeout(existingTimer);

  persistTimers.set(
    documentName,
    setTimeout(() => {
      persistTimers.delete(documentName);
      void persistDocument(documentName, document).catch(() => {
        console.error(
          `Failed to persist collaborative document ${documentName}.`,
        );
      });
    }, 750),
  );
}

setContentInitializor(async (document) => {
  const stored = await findDocument(document.name);
  documentIds.set(document.name, { id: stored.id, table: stored.table });

  if (stored.yjs_state) {
    Y.applyUpdate(
      document,
      Buffer.from(stored.yjs_state, "base64"),
      loadOrigin,
    );
  }
});

setPersistence({
  provider: supabase,
  bindState: (documentName, document) => {
    void ensureDocumentRelay(documentName, document).catch(() => {
      console.error(`Failed to subscribe to document relay ${documentName}.`);
    });

    document.on("update", (update, origin) => {
      if (origin !== loadOrigin) {
        schedulePersist(documentName, document, origin);
      }

      if (origin !== loadOrigin && !origin?.qollabRealtime) {
        void publishRelayUpdate(
          documentName,
          "yjs-update",
          update,
          origin?.boardprepUserId,
        ).catch(() => {
          console.error(
            `Failed to relay collaborative update ${documentName}.`,
          );
        });
      }
    });
  },
  writeState: async (documentName, document) => {
    const timer = persistTimers.get(documentName);
    if (timer) clearTimeout(timer);
    persistTimers.delete(documentName);

    await persistDocument(documentName, document);
    await releaseDocumentRelay(documentName);
    documentIds.delete(documentName);
    lastEditors.delete(documentName);
  },
});

export async function authorizeCollaborationRequest(request, accessToken) {
  const url = requestUrl(request);
  const origin = headerValue(request, "origin");

  if (allowedOrigin && origin !== allowedOrigin) {
    return { error: "Forbidden", status: 403 };
  }

  if (
    !allowedOrigin &&
    url.pathname.startsWith("/api/collaboration/") &&
    origin &&
    origin !== url.origin
  ) {
    return { error: "Forbidden", status: 403 };
  }

  let relativePath;
  try {
    relativePath = decodeURIComponent(relativeCollaborationPath(url));
  } catch {
    return { error: "Unauthorized", status: 401 };
  }

  const isPresenceRequest = relativePath.startsWith("presence/");
  const requestedName = relativePath.slice(
    isPresenceRequest ? "presence/".length : 0,
  );
  const parsed = parseDocumentName(requestedName);
  const token = accessToken ?? url.searchParams.get("access_token");

  if (
    !parsed ||
    !token ||
    (isPresenceRequest &&
      (parsed.kind !== "notes" || parsed.roomSlug !== requestedName))
  ) {
    return { error: "Unauthorized", status: 401 };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(token);

  if (userError || !user) return { error: "Unauthorized", status: 401 };

  const { data: room, error: roomError } = await supabase
    .from("rooms")
    .select("id, viewer_can_collaborate")
    .eq("slug", parsed.roomSlug)
    .single();

  if (roomError || !room) return { error: "Forbidden", status: 403 };

  const { data: membership, error: membershipError } = await supabase
    .from("room_members")
    .select("role")
    .eq("room_id", room.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (membershipError || !membership) {
    return { error: "Forbidden", status: 403 };
  }

  if (parsed.isBreakout) {
    const { data: breakout, error: breakoutError } = await supabase
      .from("breakout_rooms")
      .select("id")
      .eq("room_id", room.id)
      .eq("code", parsed.breakoutCode)
      .maybeSingle();

    if (breakoutError || !breakout) {
      return { error: "Forbidden", status: 403 };
    }

    if (membership.role === "viewer") {
      const { data: breakoutMembership, error: breakoutMembershipError } =
        await supabase
          .from("breakout_room_members")
          .select("breakout_room_id")
          .eq("breakout_room_id", breakout.id)
          .eq("user_id", user.id)
          .maybeSingle();

      if (breakoutMembershipError || !breakoutMembership) {
        return { error: "Forbidden", status: 403 };
      }
    }
  }

  if (isPresenceRequest) {
    return {
      channel: "presence",
      role: membership.role,
      roomSlug: parsed.roomSlug,
      userId: user.id,
    };
  }

  return {
    documentName: requestedName,
    readOnly: membership.role === "viewer" && !room.viewer_can_collaborate,
    userId: user.id,
  };
}

function isReadOnlyMessageAllowed(data) {
  try {
    const decoder = decoding.createDecoder(toUint8Array(data));
    const messageType = decoding.readVarUint(decoder);
    if (messageType !== MESSAGE_SYNC) return true;
    return decoding.readVarUint(decoder) === SYNC_STEP_ONE;
  } catch {
    return false;
  }
}

function relayAwarenessMessage(documentName, data, userId) {
  try {
    const decoder = decoding.createDecoder(toUint8Array(data));
    if (decoding.readVarUint(decoder) !== MESSAGE_AWARENESS) return;
    const update = decoding.readVarUint8Array(decoder);

    void publishRelayUpdate(
      documentName,
      "awareness-update",
      update,
      userId,
    ).catch(() => {
      console.error(`Failed to relay awareness update ${documentName}.`);
    });
  } catch {
    // Ignore malformed awareness messages; the protocol handler also rejects them.
  }
}

export async function prepareCollaborationConnection(authorization) {
  if (authorization.channel === "presence") {
    await ensurePresenceRelay(authorization.roomSlug);
    return;
  }

  const document = getYDoc(authorization.documentName);

  try {
    await document.whenInitialized;
    await ensureDocumentRelay(authorization.documentName, document);
  } catch (error) {
    docs.delete(authorization.documentName);
    await releaseDocumentRelay(authorization.documentName);
    document.destroy();
    throw error;
  }
}

export function attachDocumentConnection(websocket, request, authorization) {
  websocket.boardprepUserId = authorization.userId;

  if (!authorization.readOnly) {
    setupWSConnection(websocket, request, {
      docName: authorization.documentName,
      gc: true,
    });
  } else {
    const addListener = websocket.on;
    websocket.on = function addReadOnlyListener(eventName, listener) {
      if (eventName !== "message") {
        return addListener.call(this, eventName, listener);
      }

      return addListener.call(this, eventName, (data, isBinary) => {
        if (isReadOnlyMessageAllowed(data)) listener(data, isBinary);
      });
    };
    setupWSConnection(websocket, request, {
      docName: authorization.documentName,
      gc: true,
    });
    websocket.on = addListener;
  }

  websocket.on("message", (data) => {
    relayAwarenessMessage(
      authorization.documentName,
      data,
      authorization.userId,
    );
  });
}

function normalizePresentationState(value) {
  if (
    !value ||
    typeof value !== "object" ||
    typeof value.presenterId !== "string" ||
    typeof value.presenterName !== "string" ||
    typeof value.updatedAt !== "string" ||
    !PRESENTATION_WORKSPACES.has(value.workspace)
  ) {
    return null;
  }

  return {
    ...(value.cursor &&
    typeof value.cursor === "object" &&
    Number.isFinite(value.cursor.x) &&
    value.cursor.x >= 0 &&
    value.cursor.x <= 1 &&
    Number.isFinite(value.cursor.y) &&
    value.cursor.y >= 0 &&
    value.cursor.y <= 1
      ? { cursor: { x: value.cursor.x, y: value.cursor.y } }
      : {}),
    ...(value.workspace === "notes" &&
    Number.isFinite(value.scrollY) &&
    value.scrollY >= 0 &&
    value.scrollY <= 1
      ? { scrollY: value.scrollY }
      : {}),
    presenterId: value.presenterId,
    presenterName: value.presenterName.trim().slice(0, 80) || "Presenter",
    updatedAt: value.updatedAt,
    workspace: value.workspace,
  };
}

function broadcastPresentationLocally(roomSlug) {
  const message = JSON.stringify({
    presentation: activePresentations.get(roomSlug)?.state ?? null,
    type: "presentation",
  });

  for (const client of presenceRooms.get(roomSlug) ?? []) {
    if (client.readyState === 1) client.send(message);
  }
}

function schedulePresentationExpiry(roomSlug, state) {
  const existing = presentationTimeouts.get(roomSlug);
  if (existing) clearTimeout(existing);

  presentationTimeouts.set(
    roomSlug,
    setTimeout(() => {
      const current = activePresentations.get(roomSlug)?.state;
      if (current?.updatedAt !== state.updatedAt) return;
      activePresentations.delete(roomSlug);
      presentationTimeouts.delete(roomSlug);
      broadcastPresentationLocally(roomSlug);
    }, PRESENTATION_TIMEOUT_MS),
  );
}

async function publishPresentation(roomSlug, payload) {
  const relay = presenceRelays.get(roomSlug);
  if (!relay) return;
  await relay.ready;
  await sendBroadcast(relay.channel, "presentation", {
    ...payload,
    source: instanceId,
  });
}

function ensurePresenceRelay(roomSlug) {
  const existing = presenceRelays.get(roomSlug);
  if (existing) return existing.ready;

  const channel = supabase.channel(relayName("presence", roomSlug), {
    config: { broadcast: { ack: true, self: false } },
  });
  const relay = { channel, ready: null };

  channel.on("broadcast", { event: "presentation" }, ({ payload }) => {
    if (!payload || payload.source === instanceId) return;

    if (payload.action === "stop") {
      const current = activePresentations.get(roomSlug)?.state;
      if (!current || current.presenterId !== payload.presenterId) return;
      activePresentations.delete(roomSlug);
      broadcastPresentationLocally(roomSlug);
      return;
    }

    const state = normalizePresentationState(payload.state);
    if (!state) return;
    const current = activePresentations.get(roomSlug)?.state;
    if (current && current.updatedAt > state.updatedAt) return;

    activePresentations.set(roomSlug, {
      socket: null,
      source: payload.source,
      state,
    });
    schedulePresentationExpiry(roomSlug, state);
    broadcastPresentationLocally(roomSlug);
  });

  relay.ready = waitForSubscription(channel, "Presence");
  presenceRelays.set(roomSlug, relay);
  return relay.ready;
}

async function releasePresenceRelay(roomSlug) {
  const relay = presenceRelays.get(roomSlug);
  if (!relay) return;

  presenceRelays.delete(roomSlug);
  activePresentations.delete(roomSlug);
  const timeout = presentationTimeouts.get(roomSlug);
  if (timeout) clearTimeout(timeout);
  presentationTimeouts.delete(roomSlug);
  await supabase.removeChannel(relay.channel);
}

export function attachPresenceConnection(websocket, authorization) {
  const { role, roomSlug, userId } = authorization;
  const clients = presenceRooms.get(roomSlug) ?? new Set();
  clients.add(websocket);
  presenceRooms.set(roomSlug, clients);

  websocket.send(
    JSON.stringify({
      presentation: activePresentations.get(roomSlug)?.state ?? null,
      type: "presentation",
    }),
  );

  websocket.on("message", (data) => {
    const bytes = toUint8Array(data);
    if (!["owner", "editor"].includes(role) || bytes.byteLength > 4_096) return;

    try {
      const payload = JSON.parse(Buffer.from(bytes).toString("utf8"));

      if (payload?.type === "presentation-stop") {
        if (activePresentations.get(roomSlug)?.state.presenterId === userId) {
          activePresentations.delete(roomSlug);
          broadcastPresentationLocally(roomSlug);
          void publishPresentation(roomSlug, {
            action: "stop",
            presenterId: userId,
          }).catch(() => {
            console.error(`Failed to relay presentation stop ${roomSlug}.`);
          });
        }
        return;
      }

      if (payload?.type !== "presentation-update") return;

      const state = normalizePresentationState({
        ...payload,
        presenterId: userId,
        updatedAt: new Date().toISOString(),
      });
      if (!state) return;

      activePresentations.set(roomSlug, {
        socket: websocket,
        source: instanceId,
        state,
      });
      schedulePresentationExpiry(roomSlug, state);
      broadcastPresentationLocally(roomSlug);
      void publishPresentation(roomSlug, { action: "update", state }).catch(
        () => {
          console.error(`Failed to relay presentation update ${roomSlug}.`);
        },
      );
    } catch {
      // Ignore malformed ephemeral presence messages.
    }
  });

  websocket.on("close", () => {
    clients.delete(websocket);
    if (clients.size === 0) presenceRooms.delete(roomSlug);

    if (activePresentations.get(roomSlug)?.socket === websocket) {
      activePresentations.delete(roomSlug);
      broadcastPresentationLocally(roomSlug);
      void publishPresentation(roomSlug, {
        action: "stop",
        presenterId: userId,
      }).catch(() => {
        console.error(`Failed to relay presentation close ${roomSlug}.`);
      });
    }

    if (clients.size === 0) {
      void releasePresenceRelay(roomSlug);
    }
  });
}

export async function flushCollaborationDocuments() {
  await Promise.allSettled(
    Array.from(docs.entries()).map(([documentName, document]) =>
      persistDocument(documentName, document),
    ),
  );
}

export { docs };
