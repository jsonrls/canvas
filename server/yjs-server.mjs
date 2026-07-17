import { createRequire } from "node:module";
import { createServer } from "node:http";

import { createClient } from "@supabase/supabase-js";
import { WebSocketServer } from "ws";

const require = createRequire(import.meta.url);
const Y = require("yjs");
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
const roomPattern = /^[a-z0-9-]{1,64}$/;
const loadOrigin = Symbol("supabase-persistence-load");
const documentIds = new Map();
const persistTimers = new Map();
const lastEditors = new Map();

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

async function findDocument(roomSlug) {
  const { data: room, error: roomError } = await supabase
    .from("rooms")
    .select("id")
    .eq("slug", roomSlug)
    .single();

  if (roomError || !room) {
    throw new Error("Room document not found.");
  }

  const { data: document, error: documentError } = await supabase
    .from("documents")
    .select("id, yjs_state")
    .eq("room_id", room.id)
    .eq("kind", "notes")
    .single();

  if (documentError || !document) {
    throw new Error("Room document not found.");
  }

  return document;
}

async function persistDocument(roomSlug, document) {
  const documentId = documentIds.get(roomSlug);

  if (!documentId) {
    throw new Error("Cannot persist an uninitialized room document.");
  }

  const state = Buffer.from(Y.encodeStateAsUpdate(document)).toString("base64");
  const updatedBy = lastEditors.get(roomSlug);
  const changes = {
    updated_at: new Date().toISOString(),
    yjs_state: state,
    yjs_state_updated_at: new Date().toISOString(),
  };

  if (updatedBy) {
    changes.updated_by = updatedBy;
  }

  const { error } = await supabase
    .from("documents")
    .update(changes)
    .eq("id", documentId);

  if (error) {
    throw new Error("Supabase rejected a collaborative document write.");
  }
}

function schedulePersist(roomSlug, document, origin) {
  if (origin?.boardprepUserId) {
    lastEditors.set(roomSlug, origin.boardprepUserId);
  }

  const existingTimer = persistTimers.get(roomSlug);

  if (existingTimer) {
    clearTimeout(existingTimer);
  }

  persistTimers.set(
    roomSlug,
    setTimeout(() => {
      persistTimers.delete(roomSlug);
      void persistDocument(roomSlug, document).catch(() => {
        console.error(`Failed to persist collaborative room ${roomSlug}.`);
      });
    }, 750),
  );
}

setContentInitializor(async (document) => {
  const stored = await findDocument(document.name);
  documentIds.set(document.name, stored.id);

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
  bindState: (roomSlug, document) => {
    document.on("update", (_update, origin) => {
      if (origin !== loadOrigin) {
        schedulePersist(roomSlug, document, origin);
      }
    });
  },
  writeState: async (roomSlug, document) => {
    const timer = persistTimers.get(roomSlug);

    if (timer) {
      clearTimeout(timer);
      persistTimers.delete(roomSlug);
    }

    await persistDocument(roomSlug, document);
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
  const roomSlug = decodeURIComponent(requestUrl.pathname.slice(1));
  const token = requestUrl.searchParams.get("access_token");

  if (!roomPattern.test(roomSlug) || !token) {
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
    .select("id")
    .eq("slug", roomSlug)
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

  if (
    membershipError ||
    !membership ||
    !["owner", "editor"].includes(membership.role)
  ) {
    return { error: "Forbidden", status: 403 };
  }

  return { roomSlug, userId: user.id };
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
      if (!("roomSlug" in authorization)) {
        rejectUpgrade(socket, authorization.status, authorization.error);
        return;
      }

      const document = getYDoc(authorization.roomSlug);

      try {
        await document.whenInitialized;
      } catch {
        docs.delete(authorization.roomSlug);
        document.destroy();
        rejectUpgrade(socket, 503, "Service Unavailable");
        return;
      }

      websocketServer.handleUpgrade(request, socket, head, (websocket) => {
        websocket.boardprepUserId = authorization.userId;
        setupWSConnection(websocket, request, {
          docName: authorization.roomSlug,
          gc: true,
        });
      });
    })
    .catch(() => rejectUpgrade(socket, 500, "Internal Server Error"));
});

server.listen(port, host, () => {
  console.log(`BoardPrep Yjs server listening on ws://${host}:${port}.`);
});

let isShuttingDown = false;

async function shutdown() {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  websocketServer.clients.forEach((client) => client.close(1001));
  await Promise.allSettled(
    Array.from(docs.entries()).map(([roomSlug, document]) =>
      persistDocument(roomSlug, document),
    ),
  );
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 3_000).unref();
}

process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());
