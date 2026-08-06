import { createServer } from "node:http";

import { WebSocketServer } from "ws";

import {
  attachDocumentConnection,
  attachPresenceConnection,
  authorizeCollaborationRequest,
  flushCollaborationDocuments,
  prepareCollaborationConnection,
} from "./yjs-runtime.mjs";

const host = process.env.YJS_HOST ?? process.env.HOST ?? "127.0.0.1";
const port = Number.parseInt(
  process.env.YJS_PORT ?? process.env.PORT ?? "1234",
  10,
);

if (!Number.isInteger(port) || port < 1 || port > 65_535) {
  throw new Error("YJS_PORT must be a valid TCP port.");
}

function rejectUpgrade(socket, statusCode, statusText) {
  socket.write(
    `HTTP/1.1 ${statusCode} ${statusText}\r\nConnection: close\r\nContent-Length: 0\r\n\r\n`,
  );
  socket.destroy();
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
const websocketServer = new WebSocketServer({
  maxPayload: 8 * 1024 * 1024,
  noServer: true,
});

server.on("upgrade", (request, socket, head) => {
  void authorizeCollaborationRequest(request)
    .then(async (authorization) => {
      if ("error" in authorization) {
        rejectUpgrade(socket, authorization.status, authorization.error);
        return;
      }

      try {
        await prepareCollaborationConnection(authorization);
      } catch {
        rejectUpgrade(socket, 503, "Service Unavailable");
        return;
      }

      websocketServer.handleUpgrade(request, socket, head, (websocket) => {
        if (authorization.channel === "presence") {
          attachPresenceConnection(websocket, authorization);
          return;
        }

        attachDocumentConnection(websocket, request, authorization);
      });
    })
    .catch(() => rejectUpgrade(socket, 500, "Internal Server Error"));
});

server.listen(port, host, () => {
  console.log(`Qollab Yjs server listening on ws://${host}:${port}.`);
});

let isShuttingDown = false;

async function shutdown() {
  if (isShuttingDown) return;
  isShuttingDown = true;

  websocketServer.clients.forEach((client) => client.close(1001));
  await flushCollaborationDocuments();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 3_000).unref();
}

process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());
