import type { IncomingMessage } from "node:http";

import type { WebSocket } from "ws";

export interface CollaborationError {
  error: string;
  status: number;
}

export interface DocumentAuthorization {
  documentName: string;
  readOnly: boolean;
  userId: string;
}

export interface PresenceAuthorization {
  channel: "presence";
  role: "editor" | "owner" | "viewer";
  roomSlug: string;
  userId: string;
}

export type CollaborationAuthorization =
  | CollaborationError
  | DocumentAuthorization
  | PresenceAuthorization;

export function authorizeCollaborationRequest(
  request: Request | IncomingMessage,
  accessToken?: string,
): Promise<CollaborationAuthorization>;
export function prepareCollaborationConnection(
  authorization: DocumentAuthorization | PresenceAuthorization,
): Promise<void>;
export function attachDocumentConnection(
  websocket: WebSocket,
  request: Request | IncomingMessage,
  authorization: DocumentAuthorization,
): void;
export function attachPresenceConnection(
  websocket: WebSocket,
  authorization: PresenceAuthorization,
): void;
export function flushCollaborationDocuments(): Promise<void>;
export const docs: Map<string, { destroy(): void }>;
