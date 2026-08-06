import { createRequire } from "node:module";
import { createServer } from "node:http";

import { createClient } from "@supabase/supabase-js";
import { WebSocketServer } from "ws";

import { parseDocumentName } from "./document-name.mjs";

const require = createRequire(import.meta.url);
const Y = require("yjs");
const decoding = require("lib0/decoding");
const {
  docs,
  getYDoc,
  setContentInitializor,
  setPersistence,
  setupWSConnection,
} = require("y-websocket/bin/utils");

const host = process.env.YJS_HOST ?? process.env.HOST ?? "127.0.0.1";
const port = Number.parseInt(
  process.env.YJS_PORT ?? process.env.PORT ?? "1234",
  10,
);
const supabaseUrl =
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const allowedOrigin = process.env.YJS_ALLOWED_ORIGIN;
const loadOrigin = Symbol("supabase-persistence-load");
const documentIds = new Map();
const persistTimers = new Map();
const lastEditors = new Map();
const presenceRooms = new Map();
const activePresentations = new Map();
const PRESENTATION_WORKSPACES = new Set(["notes", "pdf", "whiteboard"]);
const MESSAGE_SYNC = 0;
const SYNC_STEP_ONE = 0;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required by the Yjs server.",
  );
}

if (!Number.isInteger(port) || port < 1 || port > 65_535) {
  throw new Error("YJS_PORT must be a valid TCP port.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    detectSessionInUrl: false,
    persistSession: false,
  },
});

async function findDocument(documentName) {
  const parsed = parseDocumentName(documentName);

  if (!parsed) {
    throw new Error("Collaborative document name is invalid.");
  }

  const { data: room, error: roomError } = await supabase
    .from("rooms")
    .select("id, viewer_can_collaborate")
    .eq("slug", parsed.roomSlug)
    .single();

  if (roomError || !room) {
    throw new Error("Room document not found.");
  }

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

  const state = Buffer.from(Y.encodeStateAsUpdate(document)).toString("base64");
  const updatedBy = lastEditors.get(documentName);
  const changes = {
    updated_at: new Date().toISOString(),
    yjs_state: state,
    yjs_state_updated_at: new Date().toISOString(),
  };

  if (updatedBy) {
    changes.updated_by = updatedBy;
  }

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

  if (existingTimer) {
    clearTimeout(existingTimer);
  }

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
    document.on("update", (_update, origin) => {
      if (origin !== loadOrigin) {
        schedulePersist(documentName, document, origin);
      }
    });
  },
  writeState: async (documentName, document) => {
    const timer = persistTimers.get(documentName);

    if (timer) {
      clearTimeout(timer);
      persistTimers.delete(documentName);
    }

    await persistDocument(documentName, document);
  },
});

function rejectUpgrade(socket, statusCode, statusText) {
  socket.write(
    `HTTP/1.1 ${statusCode} ${statusText}\r\nConnection: close\r\nContent-Length: 0\r\n\r\n`,
  );
  socket.destroy();
}

async function authorizeUpgrade(request) {
  if (allowedOrigin && request.headers.origin !== allowedOrigin) {
    return { error: "Forbidden", status: 403 };
  }

  const requestUrl = new URL(request.url ?? "/", "http://localhost");
  const isPresenceRequest = requestUrl.pathname.startsWith("/presence/");
  const requestedName = decodeURIComponent(
    requestUrl.pathname.slice(isPresenceRequest ? "/presence/".length : 1),
  );
  const parsed = parseDocumentName(requestedName);
  const token = requestUrl.searchParams.get("access_token");

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

  if (userError || !user) {
    return { error: "Unauthorized", status: 401 };
  }

  const { data: room, error: roomError } = await supabase
    .from("rooms")
    .select("id, viewer_can_collaborate")
    .eq("slug", parsed.roomSlug)
    .single();

  if (roomError || !room) {
    return { error: "Forbidden", status: 403 };
  }

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
    const decoder = decoding.createDecoder(new Uint8Array(data));
    const messageType = decoding.readVarUint(decoder);

    if (messageType !== MESSAGE_SYNC) return true;

    return decoding.readVarUint(decoder) === SYNC_STEP_ONE;
  } catch {
    return false;
  }
}

function setupDocumentConnection(websocket, request, authorization) {
  websocket.boardprepUserId = authorization.userId;

  if (!authorization.readOnly) {
    setupWSConnection(websocket, request, {
      docName: authorization.documentName,
      gc: true,
    });
    return;
  }

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

function broadcastPresentation(roomSlug) {
  const message = JSON.stringify({
    presentation: activePresentations.get(roomSlug)?.state ?? null,
    type: "presentation",
  });

  for (const client of presenceRooms.get(roomSlug) ?? []) {
    if (client.readyState === 1) client.send(message);
  }
}

function handlePresenceConnection(websocket, authorization) {
  const { role, roomSlug, userId } = authorization;
  const clients = presenceRooms.get(roomSlug) ?? new Set();
  clients.add(websocket);
  presenceRooms.set(roomSlug, clients);

  const current = activePresentations.get(roomSlug)?.state ?? null;
  websocket.send(
    JSON.stringify({ presentation: current, type: "presentation" }),
  );

  websocket.on("message", (data) => {
    if (!["owner", "editor"].includes(role) || data.length > 4_096) return;

    try {
      const payload = JSON.parse(data.toString());

      if (payload?.type === "presentation-stop") {
        if (activePresentations.get(roomSlug)?.state.presenterId === userId) {
          activePresentations.delete(roomSlug);
          broadcastPresentation(roomSlug);
        }
        return;
      }

      if (
        payload?.type !== "presentation-update" ||
        !PRESENTATION_WORKSPACES.has(payload.workspace) ||
        typeof payload.presenterName !== "string"
      ) {
        return;
      }

      const state = {
        ...(payload.cursor &&
        typeof payload.cursor === "object" &&
        Number.isFinite(payload.cursor.x) &&
        payload.cursor.x >= 0 &&
        payload.cursor.x <= 1 &&
        Number.isFinite(payload.cursor.y) &&
        payload.cursor.y >= 0 &&
        payload.cursor.y <= 1
          ? { cursor: { x: payload.cursor.x, y: payload.cursor.y } }
          : {}),
        ...(payload.workspace === "notes" &&
        Number.isFinite(payload.scrollY) &&
        payload.scrollY >= 0 &&
        payload.scrollY <= 1
          ? { scrollY: payload.scrollY }
          : {}),
        presenterId: userId,
        presenterName: payload.presenterName.trim().slice(0, 80) || "Presenter",
        updatedAt: new Date().toISOString(),
        workspace: payload.workspace,
      };
      activePresentations.set(roomSlug, { socket: websocket, state });
      broadcastPresentation(roomSlug);
    } catch {
      // Ignore malformed ephemeral presence messages.
    }
  });

  websocket.on("close", () => {
    clients.delete(websocket);
    if (clients.size === 0) presenceRooms.delete(roomSlug);

    if (activePresentations.get(roomSlug)?.socket === websocket) {
      activePresentations.delete(roomSlug);
      broadcastPresentation(roomSlug);
    }
  });
}

const server = createServer((request, response) => {
  if (request.method === "GET" && request.url === "/health") {
    response.writeHead(200, {
      "Cache-Control": "no-store",
      "Content-Type": "application/json",
    });
    response.end(JSON.stringify({ status: "ok" }));
    return;
  }

  response.writeHead(404, { "Content-Type": "text/plain" });
  response.end("Not found");
});
const websocketServer = new WebSocketServer({ noServer: true });

server.on("upgrade", (request, socket, head) => {
  void authorizeUpgrade(request)
    .then(async (authorization) => {
      if (
        !("documentName" in authorization) &&
        authorization.channel !== "presence"
      ) {
        rejectUpgrade(socket, authorization.status, authorization.error);
        return;
      }

      if (authorization.channel === "presence") {
        websocketServer.handleUpgrade(request, socket, head, (websocket) => {
          handlePresenceConnection(websocket, authorization);
        });
        return;
      }

      const document = getYDoc(authorization.documentName);

      try {
        await document.whenInitialized;
      } catch {
        docs.delete(authorization.documentName);
        document.destroy();
        rejectUpgrade(socket, 503, "Service Unavailable");
        return;
      }

      websocketServer.handleUpgrade(request, socket, head, (websocket) => {
        setupDocumentConnection(websocket, request, authorization);
      });
    })
    .catch(() => rejectUpgrade(socket, 500, "Internal Server Error"));
});

server.listen(port, host, () => {
  console.log(`Qollab Yjs server listening on ws://${host}:${port}.`);
});

let isShuttingDown = false;

async function shutdown() {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  websocketServer.clients.forEach((client) => client.close(1001));
  await Promise.allSettled(
    Array.from(docs.entries()).map(([documentName, document]) =>
      persistDocument(documentName, document),
    ),
  );
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 3_000).unref();
}

process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());
