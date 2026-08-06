"use client";

import { LockKeyhole, PencilLine } from "lucide-react";
import { useState, useTransition } from "react";

import { updateViewerCollaborationAction } from "@/app/rooms/[roomId]/actions";

interface ViewerCollaborationToggleProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  roomSlug: string;
}

export function ViewerCollaborationToggle({
  enabled,
  onEnabledChange,
  roomSlug,
}: ViewerCollaborationToggleProps): React.ReactElement {
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const toggle = (): void => {
    const nextEnabled = !enabled;
    setError("");
    onEnabledChange(nextEnabled);

    startTransition(async () => {
      const result = await updateViewerCollaborationAction(
        roomSlug,
        nextEnabled,
      );
      onEnabledChange(result.enabled);

      if (result.error) {
        setError(result.error);
      }
    });
  };

  return (
    <div className="viewer-collaboration-control">
      <div className="viewer-collaboration-control__heading">
        <span className="viewer-collaboration-control__icon">
          {enabled ? (
            <PencilLine aria-hidden="true" size={16} />
          ) : (
            <LockKeyhole aria-hidden="true" size={16} />
          )}
        </span>
        <div>
          <strong>Viewer collaboration</strong>
          <small>
            {enabled
              ? "Viewers can type, draw, and annotate"
              : "Viewers have read-only access"}
          </small>
        </div>
        <button
          aria-checked={enabled}
          aria-label={`${enabled ? "Disable" : "Enable"} viewer collaboration`}
          className="viewer-collaboration-switch"
          disabled={isPending}
          onClick={toggle}
          role="switch"
          type="button"
        >
          <span />
        </button>
      </div>
      {error ? (
        <p className="viewer-collaboration-control__error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

interface ViewerCollaborationStatusProps {
  enabled: boolean;
}

export function ViewerCollaborationStatus({
  enabled,
}: ViewerCollaborationStatusProps): React.ReactElement {
  return (
    <div
      className={`viewer-collaboration-status${enabled ? " viewer-collaboration-status--enabled" : ""}`}
    >
      {enabled ? (
        <PencilLine aria-hidden="true" size={14} />
      ) : (
        <LockKeyhole aria-hidden="true" size={14} />
      )}
      <div>
        <strong>{enabled ? "Collaboration enabled" : "Read-only mode"}</strong>
        <small>
          {enabled
            ? "You can type, draw, and annotate"
            : "A facilitator can enable editing"}
        </small>
      </div>
    </div>
  );
}
