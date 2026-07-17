import { clearDocument, IndexeddbPersistence } from "y-indexeddb";
import type * as Y from "yjs";

const USER_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ROOM_ID_PATTERN = /^[a-z0-9-]{1,64}$/;
const REGISTRY_VERSION = "v1";
const INITIALIZATION_TIMEOUT_MS = 4_000;
const HEALTH_CHECK_KEY = "boardprep-health-check";
const STORAGE_PROBE_NAME = "boardprep:offline-storage-probe:v1";

export interface OfflineCleanupResult {
  cleared: number;
  failed: number;
  registryAvailable: boolean;
}

export type OfflineDocumentResult =
  | {
      key: string;
      persistence: IndexeddbPersistence;
      status: "saved";
    }
  | {
      key: string;
      persistence: null;
      status: "unavailable";
    };

function assertUserId(userId: string): void {
  if (!USER_ID_PATTERN.test(userId)) {
    throw new Error("Invalid offline document user identifier.");
  }
}

function getRegistryKey(userId: string): string {
  assertUserId(userId);
  return `boardprep:offline-documents:${REGISTRY_VERSION}:${userId}`;
}

function getLocalStorage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

function isDocumentKeyForUser(key: string, userId: string): boolean {
  return (
    key.startsWith(`boardprep:${userId}:`) &&
    key.endsWith(":notes") &&
    key.length <= 160
  );
}

function readRegisteredDocumentKeys(
  storage: Storage,
  userId: string,
): string[] {
  try {
    const serialized = storage.getItem(getRegistryKey(userId));

    if (!serialized) {
      return [];
    }

    const parsed: unknown = JSON.parse(serialized);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (key): key is string =>
        typeof key === "string" && isDocumentKeyForUser(key, userId),
    );
  } catch {
    return [];
  }
}

function writeRegisteredDocumentKeys(
  storage: Storage,
  userId: string,
  keys: string[],
): boolean {
  try {
    const registryKey = getRegistryKey(userId);

    if (keys.length === 0) {
      storage.removeItem(registryKey);
    } else {
      storage.setItem(registryKey, JSON.stringify(keys));
    }

    return true;
  } catch {
    return false;
  }
}

async function verifyIndexedDbAvailability(): Promise<void> {
  if (typeof indexedDB === "undefined") {
    throw new Error("IndexedDB is unavailable.");
  }

  await new Promise<void>((resolve, reject) => {
    let request: IDBOpenDBRequest;

    try {
      request = indexedDB.open(STORAGE_PROBE_NAME);
    } catch {
      reject(new Error("IndexedDB could not be opened."));
      return;
    }

    request.onerror = () => reject(new Error("IndexedDB could not be opened."));
    request.onsuccess = () => {
      request.result.close();
      resolve();
    };
  });
}

async function waitForPersistence(
  persistence: IndexeddbPersistence,
): Promise<void> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_resolve, reject) => {
    timeoutId = setTimeout(
      () => reject(new Error("Offline storage initialization timed out.")),
      INITIALIZATION_TIMEOUT_MS,
    );
  });
  const databaseFailure = persistence
    .get(HEALTH_CHECK_KEY)
    .then(() => persistence.whenSynced);

  try {
    await Promise.race([persistence.whenSynced, databaseFailure, timeout]);
  } finally {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  }
}

export function buildOfflineDocumentKey(
  userId: string,
  roomId: string,
): string {
  assertUserId(userId);

  if (!ROOM_ID_PATTERN.test(roomId)) {
    throw new Error("Invalid offline document room identifier.");
  }

  return `boardprep:${userId}:${roomId}:notes`;
}

export function registerOfflineDocument(userId: string, key: string): boolean {
  assertUserId(userId);

  if (!isDocumentKeyForUser(key, userId)) {
    throw new Error("Invalid offline document key.");
  }

  const storage = getLocalStorage();

  if (!storage) {
    return false;
  }

  const registeredKeys = new Set(readRegisteredDocumentKeys(storage, userId));
  registeredKeys.add(key);

  return writeRegisteredDocumentKeys(storage, userId, [...registeredKeys]);
}

export async function createOfflineDocument(
  userId: string,
  roomId: string,
  document: Y.Doc,
): Promise<OfflineDocumentResult> {
  const key = buildOfflineDocumentKey(userId, roomId);

  try {
    await verifyIndexedDbAvailability();
  } catch {
    return { key, persistence: null, status: "unavailable" };
  }

  const persistence = new IndexeddbPersistence(key, document);

  try {
    await waitForPersistence(persistence);

    if (!registerOfflineDocument(userId, key)) {
      await persistence.clearData();
      return { key, persistence: null, status: "unavailable" };
    }

    return { key, persistence, status: "saved" };
  } catch {
    await persistence.destroy().catch(() => undefined);
    return { key, persistence: null, status: "unavailable" };
  }
}

export async function clearOfflineDocumentsForUser(
  userId: string,
): Promise<OfflineCleanupResult> {
  assertUserId(userId);
  const storage = getLocalStorage();

  if (!storage) {
    return { cleared: 0, failed: 0, registryAvailable: false };
  }

  const keys = readRegisteredDocumentKeys(storage, userId);
  const results = await Promise.allSettled(
    keys.map(async (key) => {
      await clearDocument(key);
      return key;
    }),
  );
  const failedKeys = results.flatMap((result, index) => {
    const key = keys[index];
    return result.status === "rejected" && key ? [key] : [];
  });

  writeRegisteredDocumentKeys(storage, userId, failedKeys);

  return {
    cleared: keys.length - failedKeys.length,
    failed: failedKeys.length,
    registryAvailable: true,
  };
}
