"use client";

import { ButtonControl } from "@/components/ui/button";
import { ImagePlus, Trash2, Upload } from "@/components/ui/icons";
import { useEffect, useId, useRef, useState } from "react";

import { compressRoomIcon } from "@/lib/room-banners/compression";
import { ROOM_ICON_ACCEPTED_SOURCE_TYPES } from "@/lib/room-banners/constants";

import styles from "./room-banner.module.css";

interface RoomIconFieldProps {
  compact?: boolean;
  initialIconUrl?: string | null;
  inputId: string;
}

function roomIconStyle(url: string): React.CSSProperties {
  return {
    "--room-icon-image": `url(${JSON.stringify(url)})`,
  } as React.CSSProperties;
}

export function RoomIconField({
  compact = false,
  initialIconUrl = null,
  inputId,
}: RoomIconFieldProps): React.ReactElement {
  const descriptionId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const localPreviewUrlRef = useRef<string | null>(null);
  const preparationIdRef = useRef(0);
  const [compressed, setCompressed] = useState(false);
  const [isRemoved, setIsRemoved] = useState(false);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [message, setMessage] = useState(
    "JPEG, PNG, or WebP · square crop · up to 15 MB",
  );
  const [messageType, setMessageType] = useState<"hint" | "error">("hint");
  const previewUrl = isRemoved ? null : (localPreviewUrl ?? initialIconUrl);

  useEffect(() => {
    return () => {
      if (localPreviewUrlRef.current) {
        URL.revokeObjectURL(localPreviewUrlRef.current);
      }
    };
  }, []);

  const replaceLocalPreview = (file: File | null): void => {
    if (localPreviewUrlRef.current) {
      URL.revokeObjectURL(localPreviewUrlRef.current);
    }

    const nextUrl = file ? URL.createObjectURL(file) : null;
    localPreviewUrlRef.current = nextUrl;
    setLocalPreviewUrl(nextUrl);
  };

  const clearSelection = (): void => {
    preparationIdRef.current += 1;
    const input = inputRef.current;

    if (input) {
      input.value = "";
      input.setCustomValidity("");
    }

    replaceLocalPreview(null);
    setCompressed(false);
    setIsRemoved(Boolean(initialIconUrl));
    setMessage(
      initialIconUrl
        ? "The current room icon will be removed when you save."
        : "JPEG, PNG, or WebP · square crop · up to 15 MB",
    );
    setMessageType("hint");
  };

  const prepareImage = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ): Promise<void> => {
    const input = event.currentTarget;
    const source = input.files?.[0];
    const preparationId = preparationIdRef.current + 1;

    preparationIdRef.current = preparationId;

    replaceLocalPreview(null);
    setCompressed(false);
    setIsRemoved(false);

    if (!source) {
      setMessage("JPEG, PNG, or WebP · square crop · up to 15 MB");
      setMessageType("hint");
      input.setCustomValidity("");
      return;
    }

    input.setCustomValidity("Wait for the room icon to finish compressing.");
    setMessage("Cropping and compressing your room icon…");
    setMessageType("hint");

    try {
      const compressedFile = await compressRoomIcon(source);

      if (preparationId !== preparationIdRef.current) {
        return;
      }

      const transfer = new DataTransfer();
      transfer.items.add(compressedFile);
      input.files = transfer.files;
      input.setCustomValidity("");
      replaceLocalPreview(compressedFile);
      setCompressed(true);
      setMessage("JPEG, PNG, or WebP · square crop · up to 15 MB");
      setMessageType("hint");
    } catch (error) {
      if (preparationId !== preparationIdRef.current) {
        return;
      }

      input.value = "";
      input.setCustomValidity("");
      setMessage(
        error instanceof Error
          ? error.message
          : "That room icon could not be prepared.",
      );
      setMessageType("error");
    }
  };

  return (
    <div
      className={`${styles.field}${compact ? ` ${styles.fieldCompact}` : ""}`}
    >
      <div className={styles.labelRow}>
        <span>Room icon or logo</span>
        <span className={styles.optional}>Optional</span>
      </div>

      <div
        aria-label={previewUrl ? "Selected room icon preview" : undefined}
        className={`${styles.preview}${previewUrl ? ` ${styles.previewHasImage}` : ""}`}
        role={previewUrl ? "img" : undefined}
        style={previewUrl ? roomIconStyle(previewUrl) : undefined}
      >
        {previewUrl ? null : (
          <div className={styles.placeholder}>
            <ImagePlus aria-hidden="true" size={22} />
            <strong>1:1</strong>
          </div>
        )}
      </div>

      <input
        accept={ROOM_ICON_ACCEPTED_SOURCE_TYPES.join(",")}
        aria-describedby={descriptionId}
        aria-label="Room icon or logo"
        hidden
        className={styles.fileInput}
        id={inputId}
        name="room_icon"
        onChange={(event) => void prepareImage(event)}
        ref={inputRef}
        type="file"
      />
      <input
        name="room_icon_compressed"
        type="hidden"
        value={compressed ? "true" : "false"}
      />
      <input
        name="remove_room_icon"
        type="hidden"
        value={isRemoved ? "true" : "false"}
      />

      <div className={styles.actions}>
        <ButtonControl
          variant="secondary"
          aria-describedby={descriptionId}
          onClick={() => inputRef.current?.click()}
          className={styles.pickButton}
        >
          <Upload aria-hidden="true" size={15} />
          {previewUrl ? "Replace icon" : "Choose icon"}
        </ButtonControl>
        {previewUrl ? (
          <ButtonControl
            variant="danger-ghost"
            className={styles.removeButton}
            onClick={clearSelection}
            type="button"
          >
            <Trash2 aria-hidden="true" size={14} />
            {initialIconUrl ? "Remove icon" : "Clear"}
          </ButtonControl>
        ) : null}
      </div>

      <p
        className={`${styles.message} ${styles[`message${messageType[0].toUpperCase()}${messageType.slice(1)}`]}`}
        id={descriptionId}
        role={messageType === "error" ? "alert" : "status"}
      >
        {message}
      </p>
    </div>
  );
}

export function getRoomIconStyle(url: string): React.CSSProperties {
  return roomIconStyle(url);
}
