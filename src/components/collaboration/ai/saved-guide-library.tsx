import { Dialog } from "@astryxdesign/core/Dialog";
import { Heading } from "@astryxdesign/core/Heading";
import { HStack, VStack } from "@astryxdesign/core/Layout";
import { List } from "@astryxdesign/core/List";
import { Text } from "@astryxdesign/core/Text";
import { useEffect, useId, useRef } from "react";

import { Button, ButtonControl, IconButton } from "@/components/ui/button";
import { Trash2 } from "@/components/ui/icons";
import { LoadingIndicator } from "@/components/ui/LoadingScreen";
import { PANEL_HEADING, PANEL_MUTED } from "@/components/ui/panel";
import type { SavedStudyGuideMetadata } from "@/lib/ai/saved-study-guides";
import { formatRoomDate } from "@/lib/rooms/directory-summary";

export function SavedGuideLibrary({
  savedGuides,
  isLoadingSavedGuides,
  activeSavedGuideId,
  loadingGuideId,
  loadSavedGuide,
  pendingDeleteId,
  deletingGuideId,
  deleteError,
  deleteSavedGuide,
  setPendingDeleteId,
}: {
  savedGuides: SavedStudyGuideMetadata[];
  isLoadingSavedGuides: boolean;
  activeSavedGuideId: string | null;
  loadingGuideId: string | null;
  loadSavedGuide: (id: string) => Promise<void>;
  pendingDeleteId: string | null;
  deletingGuideId: string | null;
  deleteError: string;
  deleteSavedGuide: (id: string) => Promise<void>;
  setPendingDeleteId: (id: string | null) => void;
}) {
  const deleteTitleId = useId();
  const deleteDescriptionId = useId();
  const pendingGuide = savedGuides.find(
    (guide) => guide.id === pendingDeleteId,
  );
  const isDeleting = deletingGuideId !== null;
  const panelRef = useRef<HTMLElement>(null);
  const lastPendingId = useRef<string | null>(null);

  // A deleted row takes its trash button with it, so focus has nowhere to return.
  useEffect(() => {
    if (pendingDeleteId !== null) {
      lastPendingId.current = pendingDeleteId;
      return;
    }
    const closedId = lastPendingId.current;
    lastPendingId.current = null;
    if (closedId && !savedGuides.some((guide) => guide.id === closedId)) {
      panelRef.current?.focus();
    }
  }, [pendingDeleteId, savedGuides]);

  return (
    <VStack
      as="section"
      ref={panelRef}
      tabIndex={-1}
      gap={4}
      className={`${PANEL_MUTED} outline-none`}
      aria-labelledby="saved-guides-heading"
    >
      <VStack gap={1}>
        <HStack gap={3} hAlign="between" vAlign="center">
          <Heading
            level={3}
            id="saved-guides-heading"
            className={PANEL_HEADING}
          >
            Saved study guides
          </Heading>
          <Text type="supporting">{savedGuides.length} of 50</Text>
        </HStack>
        <Text as="p" type="supporting">
          Only you can open or delete these.
        </Text>
      </VStack>

      {isLoadingSavedGuides ? (
        <LoadingIndicator label="Loading saved guides…" size="compact" />
      ) : savedGuides.length > 0 ? (
        <List
          aria-label="Saved study guides"
          className="flex w-full flex-col gap-2"
        >
          {savedGuides.map((guide) => {
            const isActive = activeSavedGuideId === guide.id;
            return (
              <VStack
                as="li"
                gap={0}
                key={guide.id}
                className={`w-full min-w-0 rounded-2xl ${isActive ? "bg-accent-muted" : "bg-surface"}`}
              >
                <HStack gap={1} vAlign="center" className="pe-2">
                  <ButtonControl
                    variant="custom"
                    className="flex min-h-11 min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-2xl p-4 text-start text-primary"
                    aria-busy={loadingGuideId === guide.id}
                    aria-current={isActive ? "true" : undefined}
                    disabled={Boolean(loadingGuideId)}
                    onClick={() => void loadSavedGuide(guide.id)}
                  >
                    <Text
                      weight="medium"
                      className="min-w-0 flex-1 break-words"
                    >
                      {guide.title}
                      <Text as="span" type="supporting" className="block">
                        Saved {formatRoomDate(guide.createdAt)}
                      </Text>
                    </Text>
                    {loadingGuideId === guide.id ? (
                      <LoadingIndicator size="icon" />
                    ) : null}
                  </ButtonControl>
                  <IconButton
                    label={`Delete ${guide.title}`}
                    tooltip="Delete guide"
                    icon={<Trash2 aria-hidden="true" size={16} />}
                    onClick={() => setPendingDeleteId(guide.id)}
                  />
                </HStack>
              </VStack>
            );
          })}
        </List>
      ) : (
        <Text as="p" color="secondary">
          Guides you save appear here.
        </Text>
      )}
      <Dialog
        isOpen={pendingDeleteId !== null}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setPendingDeleteId(null);
        }}
        purpose="form"
        role="alertdialog"
        aria-labelledby={deleteTitleId}
        aria-describedby={deleteDescriptionId}
      >
        <VStack gap={4} padding={4}>
          <Heading level={2} id={deleteTitleId}>
            Delete this saved guide?
          </Heading>
          <Text
            as="p"
            color="secondary"
            id={deleteDescriptionId}
            className="break-words"
          >
            {pendingGuide ? `“${pendingGuide.title}”` : "This guide"} will be
            permanently deleted. This can’t be undone.
          </Text>
          {deleteError && pendingGuide ? (
            <Text as="p" role="alert" className="text-error">
              {deleteError}
            </Text>
          ) : null}
          <HStack gap={2} hAlign="end" wrap="wrap">
            <Button
              label="Keep guide"
              variant="ghost"
              data-autofocus
              onClick={() => {
                if (!isDeleting) setPendingDeleteId(null);
              }}
            />
            <Button
              label={isDeleting ? "Deleting…" : "Delete guide"}
              variant="destructive"
              aria-busy={isDeleting}
              onClick={() => {
                if (pendingDeleteId) void deleteSavedGuide(pendingDeleteId);
              }}
            />
          </HStack>
        </VStack>
      </Dialog>
    </VStack>
  );
}
