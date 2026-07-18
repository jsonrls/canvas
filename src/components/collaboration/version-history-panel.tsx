"use client";

import {
  History,
  LoaderCircle,
  RefreshCw,
  RotateCcw,
  Save,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { RefObject } from "react";
import { useState, useTransition } from "react";

import {
  createVersionAction,
  restoreVersionAction,
} from "@/app/rooms/[roomId]/actions";
import type { RichTextEditorHandle } from "@/components/collaboration/rich-text-editor";
import type { VersionSummary } from "@/lib/version-history/types";

interface VersionHistoryPanelProps {
  currentUserId: string;
  editorRef: RefObject<RichTextEditorHandle | null>;
  initialVersions: VersionSummary[];
  remoteActionsAvailable: boolean;
  roomId: string;
}

function formatTimestamp(timestamp: string): string {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    timeZone: "UTC",
    timeZoneName: "short",
    year: "numeric",
  }).format(new Date(timestamp));
}

export function VersionHistoryPanel({
  currentUserId,
  editorRef,
  initialVersions,
  remoteActionsAvailable,
  roomId,
}: VersionHistoryPanelProps): React.ReactElement {
  const router = useRouter();
  const [label, setLabel] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const saveVersion = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();

    if (!remoteActionsAvailable) {
      setMessage("Reconnect before saving a durable checkpoint.");
      return;
    }

    const snapshot = editorRef.current?.captureSnapshot();

    if (!snapshot) {
      setMessage("Wait for the shared document to finish opening.");
      return;
    }

    startTransition(async () => {
      const result = await createVersionAction(roomId, label, snapshot);

      if (result.data === null) {
        setMessage(result.error);
        return;
      }

      setLabel("");
      setMessage(`Saved “${result.data.label}”.`);
      router.refresh();
    });
  };

  const restoreVersion = (version: VersionSummary): void => {
    if (!remoteActionsAvailable) {
      setMessage("Reconnect before restoring a durable checkpoint.");
      return;
    }

    const shouldRestore = window.confirm(
      `Restore “${version.label}”? BoardPrep will first save the current notes as a safety version.`,
    );

    if (!shouldRestore) {
      return;
    }

    const snapshot = editorRef.current?.captureSnapshot();

    if (!snapshot) {
      setMessage("Wait for the shared document to finish opening.");
      return;
    }

    startTransition(async () => {
      const result = await restoreVersionAction(roomId, version.id, snapshot);

      if (result.data === null) {
        setMessage(result.error);
        return;
      }

      try {
        const restored = editorRef.current?.restoreContent(result.data.content);

        if (!restored) {
          setMessage("The editor is reconnecting. Try restoring again.");
          return;
        }

        setMessage(`Restored “${result.data.label}” into the live notes.`);
        router.refresh();
      } catch {
        setMessage("That version is not compatible with this editor.");
      }
    });
  };

  return (
    <aside
      className="study-rail history-rail"
      id="version-history-sidebar"
      aria-labelledby="history-title"
    >
      <div className="study-rail-heading">
        <div>
          <p className="sidebar-label">Durable checkpoints</p>
          <h2 id="history-title">Version history</h2>
        </div>
        <History aria-hidden="true" size={18} />
      </div>

      <form className="version-form" onSubmit={saveVersion}>
        <label htmlFor="version-label">Name this version</label>
        <div>
          <input
            id="version-label"
            value={label}
            maxLength={80}
            onChange={(event) => setLabel(event.target.value)}
            placeholder="After beta blockers"
            required
            disabled={!remoteActionsAvailable || isPending}
          />
          <button
            type="submit"
            disabled={!remoteActionsAvailable || isPending}
            aria-label="Save version"
          >
            {isPending ? (
              <LoaderCircle className="spin" aria-hidden="true" size={16} />
            ) : (
              <Save aria-hidden="true" size={16} />
            )}
          </button>
        </div>
      </form>

      {!remoteActionsAvailable ? (
        <p className="version-offline-notice">
          Notes keep saving on this device. Checkpoints return with live sync.
        </p>
      ) : null}

      <div className="version-list-heading">
        <span>Recent versions</span>
        <button
          type="button"
          onClick={() => router.refresh()}
          disabled={!remoteActionsAvailable || isPending}
        >
          <RefreshCw aria-hidden="true" size={14} />
          Refresh
        </button>
      </div>

      {initialVersions.length > 0 ? (
        <ol className="version-list">
          {initialVersions.map((version) => (
            <li key={version.id}>
              <div>
                <strong>{version.label}</strong>
                <small>{formatTimestamp(version.createdAt)}</small>
                <small>
                  {version.createdBy === currentUserId
                    ? "Saved by you"
                    : `Saved by ${version.createdByName}`}
                </small>
              </div>
              <button
                type="button"
                disabled={!remoteActionsAvailable || isPending}
                onClick={() => restoreVersion(version)}
                aria-label={`Restore ${version.label}`}
              >
                <RotateCcw aria-hidden="true" size={14} />
                Restore
              </button>
            </li>
          ))}
        </ol>
      ) : (
        <div className="version-empty">
          <Save aria-hidden="true" size={18} />
          <p>No saved versions yet. Name a checkpoint when the notes matter.</p>
        </div>
      )}

      <p className="version-message" aria-live="polite">
        {message}
      </p>
    </aside>
  );
}
