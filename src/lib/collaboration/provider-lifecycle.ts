import type { WebsocketProvider } from "y-websocket";
import type { CollaborationAuthentication } from "./websocket-endpoint";

export interface ProviderLifecycle {
  reconnect(): Promise<void>;
  dispose(): void;
}

interface ProviderLifecycleOptions {
  provider: WebsocketProvider;
  authentication: CollaborationAuthentication;
  ready?: Promise<unknown>;
  onStatus(event: {
    status: "connected" | "connecting" | "disconnected";
  }): void;
  onSync(synced: boolean): void;
  onAwareness(): void;
  onOffline(): void;
  onConnecting(): void;
  onError(): void;
}

// One owner for authentication and network recovery; reconnect never replaces the doc.
export function createProviderLifecycle({
  provider,
  authentication,
  ready = Promise.resolve(),
  onStatus,
  onSync,
  onAwareness,
  onOffline,
  onConnecting,
  onError,
}: ProviderLifecycleOptions): ProviderLifecycle {
  let disposed = false;
  let request: AbortController | null = null;
  let pending: Promise<void> | null = null;
  let retryTimer: ReturnType<typeof setTimeout> | undefined;
  let retryDelay = 1_000;
  let disconnecting = false;
  const disconnect = (): void => {
    disconnecting = true;
    try {
      provider.disconnect();
    } finally {
      disconnecting = false;
    }
  };

  const scheduleRetry = (): void => {
    if (disposed || !navigator.onLine || retryTimer !== undefined) return;
    retryTimer = setTimeout(() => {
      retryTimer = undefined;
      void reconnect();
    }, retryDelay);
    retryDelay = Math.min(10_000, retryDelay * 2);
  };

  const reconnect = (): Promise<void> => {
    if (disposed) return Promise.resolve();
    if (pending) return pending;
    clearTimeout(retryTimer);
    retryTimer = undefined;
    const controller = new AbortController();
    request = controller;
    pending = (async () => {
      await ready;
      if (disposed || controller.signal.aborted) return;
      if (!navigator.onLine) {
        onOffline();
        return;
      }
      disconnect();
      onConnecting();
      if (authentication === "access-token") {
        const response = await fetch("/api/auth/access-token", {
          cache: "no-store",
          credentials: "same-origin",
          signal: controller.signal,
        });
        if (!response.ok)
          throw new Error("Collaboration authentication failed.");
        const payload = (await response.json()) as { accessToken?: unknown };
        if (typeof payload.accessToken !== "string" || !payload.accessToken) {
          throw new Error("Invalid collaboration authentication response.");
        }
        if (disposed || controller.signal.aborted) return;
        provider.params = { access_token: payload.accessToken };
      }
      if (!disposed && !controller.signal.aborted && navigator.onLine)
        provider.connect();
    })()
      .catch(() => {
        if (!disposed && !controller.signal.aborted) {
          onError();
          scheduleRetry();
        }
      })
      .finally(() => {
        pending = null;
        if (request === controller) request = null;
        // An online event may arrive before an aborted fetch settles.
        if (!disposed && controller.signal.aborted && navigator.onLine)
          void reconnect();
      });
    return pending;
  };
  const offline = (): void => {
    request?.abort();
    clearTimeout(retryTimer);
    retryTimer = undefined;
    disconnect();
    onOffline();
  };
  const online = (): void => {
    void reconnect();
  };
  const closed = (): void => {
    if (disconnecting || disposed) return;
    // Disable y-websocket's token-blind reconnect; our retry refreshes auth.
    provider.shouldConnect = false;
    scheduleRetry();
  };
  const synced = (value: boolean): void => {
    if (value) {
      retryDelay = 1_000;
      clearTimeout(retryTimer);
      retryTimer = undefined;
    }
    onSync(value);
  };
  provider.on("status", onStatus);
  provider.on("sync", synced);
  provider.on("connection-error", onError);
  provider.on("connection-close", closed);
  provider.awareness.on("change", onAwareness);
  window.addEventListener("online", online);
  window.addEventListener("offline", offline);

  return {
    reconnect,
    dispose() {
      if (disposed) return;
      disposed = true;
      request?.abort();
      clearTimeout(retryTimer);
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offline);
      provider.off("status", onStatus);
      provider.off("sync", synced);
      provider.off("connection-error", onError);
      provider.off("connection-close", closed);
      provider.awareness.off("change", onAwareness);
      disconnect();
    },
  };
}
