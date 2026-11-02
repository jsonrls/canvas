import {
  CollaboratorNamesPayload,
  LASER_IDLE_TIMEOUT_MS,
  LASER_TRAIL_LENGTH,
} from "@/components/collaboration/whiteboard/types";
import {
  type WhiteboardCamera,
  type WhiteboardPoint,
} from "@/lib/whiteboard/model";
import { useCallback, useEffect, useRef, useState } from "react";

export function useWhiteboardPresence({
  currentUser,
  setAwarenessField,
  camera,
  roomId,
}: {
  currentUser: { displayName: string; id: string };
  setAwarenessField: (field: string, value: unknown) => void;
  camera: WhiteboardCamera;
  roomId: string;
}) {
  const [collaboratorNames, setCollaboratorNames] = useState<
    Record<string, string>
  >({
    [currentUser.id]: currentUser.displayName || "Study partner",
  });

  const [laserEnabled, setLaserEnabled] = useState(false);

  const laserIdleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const laserTrailRef = useRef<WhiteboardPoint[]>([]);

  const clearLaser = useCallback((): void => {
    if (laserIdleTimerRef.current) {
      clearTimeout(laserIdleTimerRef.current);
      laserIdleTimerRef.current = null;
    }
    laserTrailRef.current = [];
    setAwarenessField("laser", null);
  }, [setAwarenessField]);

  const publishLaser = useCallback(
    (point: WhiteboardPoint): void => {
      const previous = laserTrailRef.current.at(-1);
      const minimumDistance = 3 / camera.zoom;
      if (
        previous &&
        Math.hypot(point.x - previous.x, point.y - previous.y) < minimumDistance
      ) {
        return;
      }

      laserTrailRef.current = [...laserTrailRef.current, point].slice(
        -LASER_TRAIL_LENGTH,
      );
      setAwarenessField("laser", {
        x: point.x,
        y: point.y,
        trail: laserTrailRef.current,
      });

      if (laserIdleTimerRef.current) clearTimeout(laserIdleTimerRef.current);
      laserIdleTimerRef.current = setTimeout(clearLaser, LASER_IDLE_TIMEOUT_MS);
    },
    [camera.zoom, clearLaser, setAwarenessField],
  );

  useEffect(() => {
    const abortController = new AbortController();

    const loadCollaboratorNames = async (): Promise<void> => {
      const response = await fetch(
        `/api/rooms/${encodeURIComponent(roomId)}/collaborator-names`,
        {
          cache: "no-store",
          credentials: "same-origin",
          signal: abortController.signal,
        },
      );

      if (!response.ok) return;

      const payload = (await response.json()) as CollaboratorNamesPayload;

      if (!Array.isArray(payload.collaborators)) return;

      const names: Record<string, string> = {};

      for (const collaborator of payload.collaborators) {
        if (
          collaborator &&
          typeof collaborator === "object" &&
          "id" in collaborator &&
          "name" in collaborator &&
          typeof collaborator.id === "string" &&
          typeof collaborator.name === "string" &&
          collaborator.name.trim()
        ) {
          names[collaborator.id] = collaborator.name.trim();
        }
      }

      setCollaboratorNames((current) => ({ ...current, ...names }));
    };

    void loadCollaboratorNames().catch(() => {
      // Stored author names remain available if profile resolution is offline.
    });

    return () => abortController.abort();
  }, [roomId]);

  useEffect(() => {
    if (!laserEnabled) clearLaser();
    return () => {
      if (laserIdleTimerRef.current) clearTimeout(laserIdleTimerRef.current);
    };
  }, [clearLaser, laserEnabled]);
  return {
    collaboratorNames,
    laserEnabled,
    setLaserEnabled,
    clearLaser,
    publishLaser,
  };
}
