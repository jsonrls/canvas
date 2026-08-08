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
    <div
      className={`viewer-collaboration-control viewer-collaboration-control--${enabled ? "enabled" : "disabled"}`}
    >
      <div className="viewer-collaboration-control__heading">
        <span className="viewer-collaboration-control__icon">
          {enabled ? (
            <PencilLine aria-hidden="true" size={16} />
          ) : (
            <LockKeyhole aria-hidden="true" size={16} />
          )}
        </span>
        <div>
          <strong>Viewer editing {enabled ? "on" : "off"}</strong>
          <small>
            {enabled
              ? "Viewers can type, draw, and annotate this workspace"
              : "Viewers can open the workspace but cannot make changes"}
          </small>
        </div>
        <button
          aria-checked={enabled}
          aria-label={`Turn viewer editing ${enabled ? "off" : "on"}`}
          className="viewer-collaboration-switch"
          disabled={isPending}
          onClick={toggle}
          role="switch"
          title={`Turn viewer editing ${enabled ? "off" : "on"}`}
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
        <strong>{enabled ? "You can edit" : "View-only access"}</strong>
        <small>
          {enabled
            ? "The room owner allows viewers to type, draw, and annotate"
            : "The room owner has not enabled editing for viewers"}
        </small>
      </div>
    </div>
  );
}
