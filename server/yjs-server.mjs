import { createServer } from "node:http";

import { WebSocketServer } from "ws";
import { shutdownCollaboration } from "./collaboration-shutdown.mjs";

import {
  attachDocumentConnection,
  attachPresenceConnection,
  authorizeCollaborationRequest,
  flushCollaborationDocuments,
  prepareCollaborationConnection,
  stopCollaborationUpdates,
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

let isShuttingDown = false;
const upgrades = new Set();
const upgradeSockets = new Set();

const server = createServer((request, response) => {
  if (isShuttingDown) {
    response.writeHead(503);
    response.end();
    return;
  }
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
  if (isShuttingDown) {
    rejectUpgrade(socket, 503, "Service Unavailable");
    return;
  }
  upgradeSockets.add(socket);
  const upgrade = authorizeCollaborationRequest(request)
    .then(async (authorization) => {
      if (isShuttingDown || socket.destroyed) return;
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

      if (isShuttingDown || socket.destroyed) return;
      websocketServer.handleUpgrade(request, socket, head, (websocket) => {
        if (authorization.channel === "presence") {
          attachPresenceConnection(websocket, authorization);
          return;
        }

        attachDocumentConnection(websocket, request, authorization);
      });
    })
    .catch(() => {
      if (!socket.destroyed)
        rejectUpgrade(socket, 500, "Internal Server Error");
    })
    .finally(() => {
      upgrades.delete(upgrade);
      upgradeSockets.delete(socket);
    });
  upgrades.add(upgrade);
});

server.listen(port, host, () => {
  console.log(
    JSON.stringify({
      event: "collaboration_listening",
      message: "Qollab Yjs server listening",
      port,
    }),
  );
});

async function shutdown() {
  if (isShuttingDown) return;
  isShuttingDown = true;
  const exitCode = await shutdownCollaboration({
    stopAccepting: () => {
      server.close();
      stopCollaborationUpdates();
      upgradeSockets.forEach((socket) => socket.destroy());
    },
    drain: async () => {
      // Termination stops further protocol writes before the final flush.
      await Promise.all(
        [...websocketServer.clients].map(
          (client) =>
            new Promise((resolve) => {
              if (client.readyState === 3) {
                resolve();
                return;
              }
              client.once("close", resolve);
              client.terminate();
            }),
        ),
      );
      await Promise.all([...upgrades]);
    },
    flush: flushCollaborationDocuments,
    log: (record) => console.log(JSON.stringify(record)),
  });
  process.exit(exitCode);
}

process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());
