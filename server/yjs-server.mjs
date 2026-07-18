import { createRequire } from "node:module";
import { createServer } from "node:http";

import { createClient } from "@supabase/supabase-js";
import { WebSocketServer } from "ws";

import { parseDocumentName } from "./document-name.mjs";

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

async function findDocument(documentName) {
  const parsed = parseDocumentName(documentName);

  if (!parsed) {
    throw new Error("Collaborative document name is invalid.");
  }

  const { data: room, error: roomError } = await supabase
    .from("rooms")
    .select("id")
    .eq("slug", parsed.roomSlug)
    .single();

  if (roomError || !room) {
    throw new Error("Room document not found.");
  }

  const { data: document, error: documentError } = await supabase
    .from("documents")
    .select("id, yjs_state")
    .eq("room_id", room.id)
    .eq("kind", parsed.kind)
    .single();

  if (documentError || !document) {
    throw new Error("Room document not found.");
  }

  return document;
}

async function persistDocument(documentName, document) {
  const documentId = documentIds.get(documentName);

  if (!documentId) {
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
    .from("documents")
    .update(changes)
    .eq("id", documentId);

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
  const documentName = decodeURIComponent(requestUrl.pathname.slice(1));
  const parsed = parseDocumentName(documentName);
  const token = requestUrl.searchParams.get("access_token");

  if (!parsed || !token) {
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

  if (
    membershipError ||
    !membership ||
    !["owner", "editor"].includes(membership.role)
  ) {
    return { error: "Forbidden", status: 403 };
  }

  return { documentName, userId: user.id };
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
      if (!("documentName" in authorization)) {
        rejectUpgrade(socket, authorization.status, authorization.error);
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
        websocket.boardprepUserId = authorization.userId;
        setupWSConnection(websocket, request, {
          docName: authorization.documentName,
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
    Array.from(docs.entries()).map(([documentName, document]) =>
      persistDocument(documentName, document),
    ),
  );
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 3_000).unref();
}

process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());
