"use client";

import { HStack, VStack } from "@astryxdesign/core/Layout";
import { Text } from "@astryxdesign/core/Text";
import { TextArea } from "@astryxdesign/core/TextArea";
import { Token } from "@astryxdesign/core/Token";
import { useState } from "react";

import type { LiveActivitiesState } from "@/components/collaboration/live/use-live-activities";
import { Button } from "@/components/ui/button";
import { Check, Eye, EyeOff, ThumbsUp } from "@/components/ui/icons";
import { PANEL_ROW } from "@/components/ui/panel";
import { spotlightOf } from "@/lib/live/activities";
import type { LiveQuestion, QaItem, QaStatus } from "@/lib/live/activities";

const STATUS_LABELS: Record<QaStatus, string | null> = {
  visible: null,
  pending: "Waiting for approval",
  answered: "Answered",
  hidden: "Hidden",
};

function HostControls({
  isBusy,
  item,
  onStatus,
}: {
  isBusy: boolean;
  item: QaItem;
  onStatus(status: QaStatus): void;
}): React.ReactElement {
  return (
    <HStack gap={1} wrap="wrap">
      {item.status === "visible" ? (
        <Button
          label="Mark answered"
          variant="ghost"
          size="sm"
          icon={<Check aria-hidden="true" size={16} />}
          isDisabled={isBusy}
          onClick={() => onStatus("answered")}
        />
      ) : (
        <Button
          label={
            item.status === "pending"
              ? "Approve"
              : item.status === "answered"
                ? "Reopen"
                : "Show"
          }
          variant="ghost"
          size="sm"
          icon={<Eye aria-hidden="true" size={16} />}
          isDisabled={isBusy}
          onClick={() => onStatus("visible")}
        />
      )}
      {item.status === "hidden" ? null : (
        <Button
          label="Hide"
          variant="ghost"
          size="sm"
          icon={<EyeOff aria-hidden="true" size={16} />}
          isDisabled={isBusy}
          onClick={() => onStatus("hidden")}
        />
      )}
    </HStack>
  );
}

export function LiveQa({
  act,
  canHost,
  isBusy,
  isOpen,
  items,
  question,
}: {
  act: LiveActivitiesState["act"];
  canHost: boolean;
  isBusy: boolean;
  isOpen: boolean;
  items: QaItem[];
  question: LiveQuestion;
}): React.ReactElement {
  const [text, setText] = useState("");

  const ask = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    if (await act({ action: "qa_ask", questionId: question.id, text })) {
      setText("");
    }
  };

  return (
    <VStack gap={6}>
      {!canHost && isOpen ? (
        <VStack as="form" gap={3} aria-label="Ask a question" onSubmit={ask}>
          <TextArea
            label="Your question"
            description={
              question.settings.moderated
                ? "Asked without your name. A host approves it before others see it."
                : "Asked without your name."
            }
            value={text}
            onChange={setText}
            maxLength={280}
            rows={3}
          />
          <HStack hAlign="end">
            <Button
              type="submit"
              label="Ask"
              variant="primary"
              isLoading={isBusy}
              isDisabled={!text.trim()}
            />
          </HStack>
        </VStack>
      ) : null}
      {items.length === 0 ? (
        <Text as="p" color="secondary">
          No questions yet.
        </Text>
      ) : (
        <VStack as="ul" gap={2} aria-label="Questions from the room">
          {items.map((item) => (
            <HStack
              as="li"
              gap={3}
              vAlign="start"
              className={`${PANEL_ROW} bg-muted!`}
              key={item.id}
            >
              <Button
                label={String(item.votes)}
                aria-label={
                  canHost || item.isMine
                    ? `${item.votes} votes`
                    : `${item.votedByMe ? "Remove vote" : "Vote"}, ${item.votes} votes`
                }
                aria-pressed={item.votedByMe}
                variant={item.votedByMe ? "primary" : "secondary"}
                size="sm"
                icon={<ThumbsUp aria-hidden="true" size={16} />}
                isDisabled={
                  canHost ||
                  isBusy ||
                  !isOpen ||
                  item.isMine ||
                  item.status !== "visible"
                }
                onClick={() =>
                  void act({
                    action: "qa_vote",
                    itemId: item.id,
                    value: !item.votedByMe,
                  })
                }
              />
              <VStack gap={2} className="min-w-0 flex-1">
                <Text className="break-words">{item.body}</Text>
                <HStack gap={2} vAlign="center" wrap="wrap">
                  {STATUS_LABELS[item.status] ? (
                    <Token label={STATUS_LABELS[item.status]!} size="sm" />
                  ) : null}
                  {item.isMine ? <Token label="Yours" size="sm" /> : null}
                  {canHost ? (
                    <HostControls
                      isBusy={isBusy}
                      item={item}
                      onStatus={(status) =>
                        void act({
                          action: "qa_set_status",
                          itemId: item.id,
                          status,
                        })
                      }
                    />
                  ) : null}
                </HStack>
              </VStack>
            </HStack>
          ))}
        </VStack>
      )}
    </VStack>
  );
}

/** The top open question, large, for a shared screen. */
export function QaSpotlight({
  act,
  items,
}: {
  act: LiveActivitiesState["act"];
  items: QaItem[];
}): React.ReactElement {
  const { answered, item, waiting } = spotlightOf(items);
  if (!item) {
    return (
      <VStack gap={2} hAlign="center" role="status">
        <Text size="2xl" weight="bold">
          {answered > 0 ? "All questions answered" : "No questions yet"}
        </Text>
        <Text color="secondary">New questions appear here.</Text>
      </VStack>
    );
  }
  return (
    <VStack gap={6} hAlign="center" className="mx-auto w-full max-w-4xl">
      <HStack gap={2} vAlign="center">
        <ThumbsUp aria-hidden="true" size={18} />
        <Text weight="semibold">
          {item.votes} {item.votes === 1 ? "vote" : "votes"}
        </Text>
      </HStack>
      <Text
        size="4xl"
        weight="bold"
        className="w-full text-center break-words"
        aria-live="polite"
      >
        {item.body}
      </Text>
      <Button
        label="Mark answered"
        variant="primary"
        size="lg"
        icon={<Check aria-hidden="true" size={18} />}
        onClick={() =>
          void act({
            action: "qa_set_status",
            itemId: item.id,
            status: "answered",
          })
        }
      />
      <Text color="secondary">
        {waiting === 0
          ? "No more questions waiting."
          : `${waiting} more waiting.`}
      </Text>
    </VStack>
  );
}
