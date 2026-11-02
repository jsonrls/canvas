import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import "fake-indexeddb/auto";
import * as Y from "yjs";
import type { WebsocketProvider } from "y-websocket";
import { createProviderLifecycle } from "../src/lib/collaboration/provider-lifecycle";
import {
  createOfflineDocument,
  clearOfflineDocumentsForUser,
} from "../src/lib/collaboration/offline-document";

async function main(): Promise<void> {
  const events = new EventTarget();
  const storage = new Map<string, string>();
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: Object.assign(events, {
      localStorage: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => storage.set(key, value),
        removeItem: (key: string) => storage.delete(key),
      },
    }),
  });
  const network = { onLine: true };
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: network,
  });

  class Provider extends EventEmitter {
    awareness = new EventEmitter();
    params: Record<string, string> = {};
    shouldConnect = false;
    connects = 0;
    disconnects = 0;
    doc = new Y.Doc();
    connect() {
      this.connects++;
      this.shouldConnect = true;
    }
    disconnect() {
      this.disconnects++;
      this.shouldConnect = false;
    }
  }
  function deferred<T>() {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>((done) => {
      resolve = done;
    });
    return { promise, resolve };
  }
  const turns = async () => {
    for (let i = 0; i < 10; i++) await Promise.resolve();
  };
  let fetches = 0;
  let signal: AbortSignal | null | undefined;
  let token = deferred<Response>();
  globalThis.fetch = async (_input, options) => {
    fetches++;
    signal = options?.signal;
    return token.promise;
  };
  const provider = new Provider();
  let offline = 0;
  let failures = 0;
  let awareness = 0;
  const lifecycle = createProviderLifecycle({
    provider: provider as unknown as WebsocketProvider,
    authentication: "access-token",
    onStatus() {},
    onSync() {},
    onConnecting() {},
    onAwareness() {
      awareness++;
    },
    onOffline() {
      offline++;
    },
    onError() {
      failures++;
    },
  });
  const first = lifecycle.reconnect();
  const duplicate = lifecycle.reconnect();
  assert.equal(
    first,
    duplicate,
    "Manual retries share authentication in flight",
  );
  await turns();
  assert.equal(fetches, 1);
  token.resolve(Response.json({ accessToken: "test-token" }));
  await first;
  assert.equal(provider.connects, 1);
  const originalDocument = provider.doc;
  network.onLine = false;
  events.dispatchEvent(new Event("offline"));
  provider.doc.getText("notes").insert(0, "offline edit");
  assert.equal(offline, 1);
  token = deferred<Response>();
  network.onLine = true;
  events.dispatchEvent(new Event("online"));
  const recovery = lifecycle.reconnect();
  await turns();
  assert.equal(fetches, 2);
  token.resolve(Response.json({ accessToken: "fresh-token" }));
  await recovery;
  assert.equal(provider.connects, 2);
  assert.equal(provider.doc, originalDocument);
  assert.equal(provider.doc.getText("notes").toString(), "offline edit");
  assert.equal(provider.params.access_token, "fresh-token");
  provider.awareness.emit("change");
  assert.equal(awareness, 1);

  token = deferred<Response>();
  const aborted = lifecycle.reconnect();
  await turns();
  lifecycle.dispose();
  assert.equal(signal?.aborted, true);
  token.resolve(Response.json({ accessToken: "late-token" }));
  await aborted;
  assert.equal(
    provider.connects,
    2,
    "Disposed authentication cannot reconnect",
  );
  assert.equal(provider.params.access_token, "fresh-token");
  assert.equal(provider.eventNames().length, 0);
  assert.equal(provider.awareness.listenerCount("change"), 0);
  events.dispatchEvent(new Event("online"));
  await turns();
  assert.equal(fetches, 3);
  assert.equal(failures, 0);
  provider.doc.destroy();

  // Session-cookie/viewer recovery needs no token and has no edit permission gate.
  const viewer = new Provider();
  const viewing = createProviderLifecycle({
    provider: viewer as unknown as WebsocketProvider,
    authentication: "session-cookie",
    onStatus() {},
    onSync() {},
    onConnecting() {},
    onAwareness() {},
    onOffline() {},
    onError() {},
  });
  await viewing.reconnect();
  network.onLine = false;
  events.dispatchEvent(new Event("offline"));
  network.onLine = true;
  events.dispatchEvent(new Event("online"));
  await viewing.reconnect();
  assert.equal(viewer.connects, 2);
  assert.equal(fetches, 3);
  viewing.dispose();
  viewer.doc.destroy();

  const delayedProvider = new Provider();
  const initialization = deferred<void>();
  const delayed = createProviderLifecycle({
    provider: delayedProvider as unknown as WebsocketProvider,
    authentication: "access-token",
    ready: initialization.promise,
    onStatus() {},
    onSync() {},
    onConnecting() {},
    onAwareness() {},
    onOffline() {},
    onError() {},
  });
  const waiting = delayed.reconnect();
  delayed.dispose();
  initialization.resolve();
  await waiting;
  assert.equal(delayedProvider.connects, 0);
  assert.equal(
    fetches,
    3,
    "Disposal during local initialization never fetches a token",
  );
  delayedProvider.doc.destroy();

  const realSetTimeout = globalThis.setTimeout;
  const realClearTimeout = globalThis.clearTimeout;
  let clock = 0;
  let timerId = 0;
  const timers = new Map<number, { at: number; callback: () => void }>();
  globalThis.setTimeout = ((callback: () => void, delay: number) => {
    const id = ++timerId;
    timers.set(id, { at: clock + delay, callback });
    return id;
  }) as unknown as typeof setTimeout;
  globalThis.clearTimeout = ((id: number) => {
    timers.delete(id);
  }) as unknown as typeof clearTimeout;
  const advanceTime = (milliseconds: number): void => {
    clock += milliseconds;
    for (const [id, timer] of timers) {
      if (timer.at <= clock) {
        timers.delete(id);
        timer.callback();
      }
    }
  };
  const retryProvider = new Provider();
  let retryFetches = 0;
  globalThis.fetch = async () => {
    retryFetches++;
    return retryFetches === 1
      ? new Response(null, { status: 503 })
      : Response.json({ accessToken: "refreshed" });
  };
  const retry = createProviderLifecycle({
    provider: retryProvider as unknown as WebsocketProvider,
    authentication: "access-token",
    onStatus() {},
    onSync() {},
    onConnecting() {},
    onAwareness() {},
    onOffline() {},
    onError() {},
  });
  await retry.reconnect();
  assert.equal(retryProvider.connects, 0);
  advanceTime(1_000);
  await retry.reconnect();
  assert.equal(
    retryProvider.connects,
    1,
    "Failed authentication retries automatically",
  );
  retryProvider.emit("sync", true);
  retryProvider.emit("connection-close");
  assert.equal(
    retryProvider.shouldConnect,
    false,
    "Old credentials do not auto-reconnect",
  );
  advanceTime(1_000);
  await retry.reconnect();
  assert.equal(retryFetches, 3, "Dropped sockets refresh authentication");
  retry.dispose();
  advanceTime(30_000);
  await turns();
  assert.equal(retryFetches, 3, "Disposal clears scheduled retries");
  globalThis.setTimeout = realSetTimeout;
  globalThis.clearTimeout = realClearTimeout;
  retryProvider.doc.destroy();

  const user = "11111111-1111-4111-8111-111111111111";
  const document = new Y.Doc();
  const controller = new AbortController();
  const opening = createOfflineDocument(
    user,
    "late-room",
    document,
    "notes",
    controller.signal,
  );
  controller.abort();
  document.destroy();
  assert.equal((await opening).status, "unavailable");
  assert.equal(
    storage.size,
    0,
    "Late initialization never registers storage after disposal",
  );

  const stored = new Y.Doc();
  const local = await createOfflineDocument(user, "saved-room", stored);
  assert.equal(local.status, "saved");
  stored.getText("notes").insert(0, "durable offline content");
  await local.persistence?.destroy();
  stored.destroy();
  const reopened = new Y.Doc();
  const reloaded = await createOfflineDocument(user, "saved-room", reopened);
  assert.equal(reopened.getText("notes").toString(), "durable offline content");
  await reloaded.persistence?.destroy();
  reopened.destroy();
  const cleared = await clearOfflineDocumentsForUser(user);
  assert.equal(cleared.failed, 0);
  assert.equal(cleared.cleared, 1);
  console.log(
    "PASS: same-doc offline recovery, viewer recovery, deduplicated auth, aborted fetch, listener cleanup, cancelled IndexedDB, durable reload and signout cleanup",
  );
}
void main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
