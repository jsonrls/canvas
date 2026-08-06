export type CollaborationAuthentication = "access-token" | "session-cookie";

export interface CollaborationWebSocketEndpoint {
  authentication: CollaborationAuthentication;
  url: string;
}

export function getCollaborationWebSocketEndpoint(): CollaborationWebSocketEndpoint {
  const configuredUrl = process.env.NEXT_PUBLIC_YJS_WS_URL?.trim();

  if (configuredUrl) {
    return { authentication: "access-token", url: configuredUrl };
  }

  if (process.env.NODE_ENV === "production" && typeof window !== "undefined") {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";

    return {
      authentication: "session-cookie",
      url: `${protocol}//${window.location.host}/api/collaboration`,
    };
  }

  return {
    authentication: "access-token",
    url: "ws://localhost:1234",
  };
}
