"use client";

import { Button } from "@/components/ui/button";
import { Heading } from "@astryxdesign/core/Heading";
import { IconButton } from "@/components/ui/button";
import { HStack, VStack } from "@astryxdesign/core/Layout";
import { List } from "@astryxdesign/core/List";
import { Text } from "@astryxdesign/core/Text";
import { TextInput } from "@astryxdesign/core/TextInput";
import { ResponsiveContextPanel } from "@/components/shell/responsive-context-panel";
import { RefreshCw, RotateCcw, Save, X } from "@/components/ui/icons";
import { useRouter } from "next/navigation";
import type { RefObject } from "react";
import { useState, useTransition } from "react";

import {
  createVersionAction,
  restoreVersionAction,
} from "@/app/rooms/[roomId]/actions";
import type { RichTextEditorHandle } from "@/components/collaboration/rich-text-editor";
import { useToast } from "@/components/ui/toast";
import type { VersionSummary } from "@/lib/version-history/types";

interface VersionHistoryPanelProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
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
  isOpen,
  onOpenChange,
  currentUserId,
  editorRef,
  initialVersions,
  remoteActionsAvailable,
  roomId,
}: VersionHistoryPanelProps): React.ReactElement {
  const router = useRouter();
  const { success } = useToast();
  const [label, setLabel] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isRefreshing, startRefreshTransition] = useTransition();
  const isBusy = isPending || isRefreshing;

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
      setMessage("");
      const result = await createVersionAction(roomId, label, snapshot);

      if (result.data === null) {
        setMessage(result.error);
        return;
      }

      setLabel("");
      success(`Saved “${result.data.label}”.`);
      router.refresh();
    });
  };

  const restoreVersion = (version: VersionSummary): void => {
    if (!remoteActionsAvailable) {
      setMessage("Reconnect before restoring a durable checkpoint.");
      return;
    }

    const shouldRestore = window.confirm(
      `Restore “${version.label}”? Qollab will first save the current notes as a safety version.`,
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
      setMessage("");
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

        success(`Restored “${result.data.label}” into the live notes.`);
        router.refresh();
      } catch {
        setMessage("That version is not compatible with this editor.");
      }
    });
  };

  const refreshVersions = (): void => {
    startRefreshTransition(() => {
      router.refresh();
    });
  };

  const content = (
    <VStack
      as="aside"
      id="version-history-sidebar"
      aria-labelledby="history-title"
      aria-busy={isBusy}
      className="h-full min-h-0 bg-surface"
      gap={0}
    >
      <HStack
        gap={2}
        padding={4}
        hAlign="between"
        vAlign="center"
        className="shrink-0 border-b border-border"
      >
        <Heading level={2} id="history-title">
          Version history
        </Heading>
        {onOpenChange ? (
          <IconButton
            label="Close version history"
            tooltip="Close version history"
            icon={<X aria-hidden="true" />}
            variant="ghost"
            className="min-h-11 min-w-11"
            onClick={() => onOpenChange(false)}
          />
        ) : null}
      </HStack>
      <VStack gap={5} padding={4} className="min-h-0 flex-1 overflow-y-auto">
        <Text as="p" color="secondary">
          Save a checkpoint before your next round of edits.
        </Text>
        <form onSubmit={saveVersion}>
          <VStack gap={3}>
            <TextInput
              label="Name this version"
              id="version-label"
              value={label}
              onChange={setLabel}
              placeholder="After reviewing the chapter"
              isRequired
              isDisabled={!remoteActionsAvailable || isBusy}
              width="100%"
              {...{ maxLength: 80, required: true }}
            />
            <Button
              type="submit"
              label={isPending ? "Saving…" : "Save version"}
              icon={<Save aria-hidden="true" />}
              variant="primary"
              isDisabled={!remoteActionsAvailable || isBusy}
              isLoading={isPending}
              className="min-h-11 text-on-accent!"
            />
          </VStack>
        </form>
        {!remoteActionsAvailable ? (
          <Text as="p" role="status" color="secondary">
            Notes keep saving on this device. Checkpoints return with live sync.
          </Text>
        ) : null}
        {message ? (
          <Text as="p" role="alert" className="text-error">
            {message}
          </Text>
        ) : null}
        <VStack gap={2}>
          <HStack gap={2} hAlign="between" vAlign="center">
            <Heading level={3}>Recent versions</Heading>
            <IconButton
              label="Refresh versions"
              tooltip="Refresh versions"
              icon={<RefreshCw aria-hidden="true" />}
              variant="ghost"
              isDisabled={!remoteActionsAvailable || isBusy}
              isLoading={isRefreshing}
              onClick={refreshVersions}
              className="min-h-11 min-w-11"
            />
          </HStack>
          {initialVersions.length > 0 ? (
            <List aria-label="Saved versions">
              {initialVersions.map((version) => (
                <VStack
                  as="li"
                  key={version.id}
                  gap={2}
                  paddingBlock={4}
                  className="border-b border-border last:border-b-0"
                >
                  <Text weight="semibold" className="break-words">
                    {version.label}
                  </Text>
                  <Text type="supporting">
                    {formatTimestamp(version.createdAt)}
                  </Text>
                  <HStack gap={2} hAlign="between" wrap="wrap" vAlign="center">
                    <Text type="supporting" className="break-words">
                      {version.createdBy === currentUserId
                        ? "Saved by you"
                        : `Saved by ${version.createdByName}`}
                    </Text>
                    <Button
                      label="Restore"
                      aria-label={`Restore ${version.label}`}
                      icon={<RotateCcw aria-hidden="true" />}
                      variant="ghost"
                      isDisabled={!remoteActionsAvailable || isBusy}
                      onClick={() => restoreVersion(version)}
                      className="min-h-11"
                    />
                  </HStack>
                </VStack>
              ))}
            </List>
          ) : (
            <Text as="p" color="secondary" className="py-4">
              No saved versions yet. Name a checkpoint when the notes matter.
            </Text>
          )}
        </VStack>
      </VStack>
    </VStack>
  );

  if (isOpen !== undefined && onOpenChange) {
    return (
      <ResponsiveContextPanel
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        label="Version history"
        purpose="form"
      >
        {content}
      </ResponsiveContextPanel>
    );
  }
  return content;
}
