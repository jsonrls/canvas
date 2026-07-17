import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

import WebSocket from "ws";
import { WebsocketProvider } from "y-websocket";
import * as Y from "yjs";

const host = "127.0.0.1";
const port = process.env.YJS_TEST_PORT ?? "1234";
const serverUrl = `ws://${host}:${port}`;
const serverEntry = new URL(
  "../node_modules/y-websocket/bin/server.cjs",
  import.meta.url,
);
const roomName = `verification-${Date.now()}`;

const server = spawn(process.execPath, [serverEntry.pathname], {
  env: {
    ...process.env,
    HOST: host,
    PORT: port,
  },
  stdio: ["ignore", "pipe", "pipe"],
});

let serverOutput = "";
server.stdout.on("data", (chunk) => {
  serverOutput += chunk.toString();
});
server.stderr.on("data", (chunk) => {
  serverOutput += chunk.toString();
});

async function waitFor(check, description, timeoutMs = 8000) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if (check()) {
      return;
    }

    await delay(40);
  }

  throw new Error(`Timed out while ${description}.`);
}

const documents = [new Y.Doc(), new Y.Doc()];
const providers = [];

try {
  await waitFor(
    () => serverOutput.includes("running at"),
    `starting the Yjs WebSocket server. Output: ${serverOutput}`,
  );

  providers.push(
    ...documents.map(
      (document) =>
        new WebsocketProvider(serverUrl, roomName, document, {
          WebSocketPolyfill: WebSocket,
          disableBc: true,
          maxBackoffTime: 1000,
        }),
    ),
  );

  await waitFor(
    () => providers.every((provider) => provider.synced),
    "waiting for both Yjs clients to synchronize",
  );

  const expectedText = "BoardPrep collaborative sync verified.";
  documents[0].getText("notes").insert(0, expectedText);

  await waitFor(
    () => documents[1].getText("notes").toString() === expectedText,
    "replicating an edit between two clients",
  );

  console.log(`Yjs verification passed at ${serverUrl} for room ${roomName}.`);
} finally {
  providers.forEach((provider) => provider.destroy());
  documents.forEach((document) => document.destroy());
  server.kill("SIGTERM");
}
