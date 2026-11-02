"use client";

import { ButtonControl } from "@/components/ui/button";
import { AppIcon } from "@/components/ui/icons";
import {
  LockKeyhole as LockKeyholeData,
  PencilLine as PencilLineData,
} from "lucide";
import { useState, useTransition } from "react";

import { updateViewerCollaborationAction } from "@/app/rooms/[roomId]/actions";
import { LoadingIndicator } from "@/components/ui/LoadingScreen";
import { useToast } from "@/components/ui/toast";

interface ViewerCollaborationToggleProps {
  compact?: boolean;
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  roomSlug: string;
}

export function ViewerCollaborationToggle({
  compact = false,
  enabled,
  onEnabledChange,
  roomSlug,
}: ViewerCollaborationToggleProps): React.ReactElement {
  const { success } = useToast();
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
        return;
      }

      success(`Viewer editing turned ${result.enabled ? "on" : "off"}.`);
    });
  };

  return (
    <div
      className={`viewer-collaboration-control viewer-collaboration-control--${enabled ? "enabled" : "disabled"}${compact ? " viewer-collaboration-control--compact" : ""}`}
    >
      <div className="viewer-collaboration-control__heading">
        <span className="viewer-collaboration-control__icon">
          {isPending ? (
            <LoadingIndicator size="icon" />
          ) : (
            <AppIcon
              iconData={enabled ? PencilLineData : LockKeyholeData}
              aria-hidden="true"
              size={16}
            />
          )}
        </span>
        <div>
          <strong>
            {compact
              ? "Viewer editing"
              : `Viewer editing ${enabled ? "on" : "off"}`}
          </strong>
          <small>
            {compact
              ? enabled
                ? "Allowed in this room"
                : "View-only in this room"
              : enabled
                ? "Viewers can type, draw, and annotate this workspace"
                : "Viewers can open the workspace but cannot make changes"}
          </small>
        </div>
        <ButtonControl
          variant="custom"
          aria-busy={isPending}
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
        </ButtonControl>
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
  compact?: boolean;
  enabled: boolean;
}

export function ViewerCollaborationStatus({
  compact = false,
  enabled,
}: ViewerCollaborationStatusProps): React.ReactElement {
  return (
    <div
      className={`viewer-collaboration-status${enabled ? " viewer-collaboration-status--enabled" : ""}${compact ? " viewer-collaboration-status--compact" : ""}`}
    >
      {
        <AppIcon
          iconData={enabled ? PencilLineData : LockKeyholeData}
          aria-hidden="true"
          size={14}
        />
      }
      <div>
        <strong>
          {compact
            ? "Your room access"
            : enabled
              ? "You can edit"
              : "View-only access"}
        </strong>
        <small>
          {compact
            ? enabled
              ? "Editing is enabled"
              : "Viewing only"
            : enabled
              ? "The room owner allows viewers to type, draw, and annotate"
              : "The room owner has not enabled editing for viewers"}
        </small>
      </div>
    </div>
  );
}
