"use client";

import { Heading } from "@astryxdesign/core/Heading";
import { HStack, VStack } from "@astryxdesign/core/Layout";
import { NumberInput } from "@astryxdesign/core/NumberInput";
import { Selector } from "@astryxdesign/core/Selector";
import { Text } from "@astryxdesign/core/Text";
import { TextInput } from "@astryxdesign/core/TextInput";
import { useState } from "react";

import { Button, IconButton } from "@/components/ui/button";
import { Plus, Trash2 } from "@/components/ui/icons";
import {
  hasChoices,
  LIVE_KIND_LABELS,
  LIVE_QUESTION_KINDS,
  OPTIONS_MAX,
  OPTIONS_MIN,
  QUIZ_LIMIT_DEFAULT,
  type LiveQuestionDraft,
  type LiveQuestionKind,
} from "@/lib/live/activities";

interface LiveQuestionFormProps {
  isBusy: boolean;
  onCreate(draft: LiveQuestionDraft): Promise<boolean>;
}

const EMPTY_OPTIONS = ["", ""];

export function LiveQuestionForm({
  isBusy,
  onCreate,
}: LiveQuestionFormProps): React.ReactElement {
  const [kind, setKind] = useState<LiveQuestionKind>("poll");
  const [prompt, setPrompt] = useState("");
  const [options, setOptions] = useState<string[]>(EMPTY_OPTIONS);
  const [correctOption, setCorrectOption] = useState("0");
  const [timeLimit, setTimeLimit] = useState<number | undefined>(
    QUIZ_LIMIT_DEFAULT,
  );
  const showOptions = hasChoices(kind);

  const updateOption = (index: number, value: string): void => {
    setOptions((current) =>
      current.map((option, position) => (position === index ? value : option)),
    );
  };

  const removeOption = (index: number): void => {
    setOptions((current) =>
      current.filter((_, position) => position !== index),
    );
    setCorrectOption((current) => {
      const selected = Number(current);
      if (selected === index) return "0";
      return String(selected > index ? selected - 1 : selected);
    });
  };

  const submit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    const created = await onCreate({
      kind,
      prompt,
      options: showOptions ? options : [],
      correctOption: kind === "quiz" ? Number(correctOption) : null,
      timeLimitSeconds: kind === "quiz" ? (timeLimit ?? null) : null,
    });
    if (created) {
      setPrompt("");
      setOptions(EMPTY_OPTIONS);
      setCorrectOption("0");
    }
  };

  return (
    <VStack
      as="form"
      gap={4}
      onSubmit={submit}
      aria-labelledby="live-question-form-title"
    >
      <Heading level={3} id="live-question-form-title">
        Add a question
      </Heading>
      <Selector
        label="Question type"
        value={kind}
        onChange={(value) => setKind(value as LiveQuestionKind)}
        options={LIVE_QUESTION_KINDS.map((value) => ({
          value,
          label: LIVE_KIND_LABELS[value],
        }))}
        width="100%"
      />
      <TextInput
        label="Question"
        value={prompt}
        onChange={setPrompt}
        placeholder="What do you want to ask?"
        isRequired
      />
      {showOptions ? (
        <VStack gap={2} role="group" aria-labelledby="live-question-options">
          <Text id="live-question-options" weight="semibold">
            Options
          </Text>
          {options.map((option, index) => (
            <HStack gap={2} vAlign="end" key={index}>
              <VStack className="flex-1">
                <TextInput
                  label={`Option ${index + 1}`}
                  isLabelHidden
                  value={option}
                  onChange={(value) => updateOption(index, value)}
                  placeholder={`Option ${index + 1}`}
                />
              </VStack>
              <IconButton
                label={`Remove option ${index + 1}`}
                tooltip="Remove option"
                icon={<Trash2 aria-hidden="true" size={16} />}
                isDisabled={options.length <= OPTIONS_MIN}
                onClick={() => removeOption(index)}
              />
            </HStack>
          ))}
          <HStack>
            <Button
              label="Add option"
              variant="ghost"
              icon={<Plus aria-hidden="true" size={16} />}
              isDisabled={options.length >= OPTIONS_MAX}
              onClick={() => setOptions((current) => [...current, ""])}
            />
          </HStack>
        </VStack>
      ) : null}
      {kind === "quiz" ? (
        <HStack gap={3} wrap="wrap">
          <VStack className="flex-1">
            <Selector
              label="Correct answer"
              value={correctOption}
              onChange={setCorrectOption}
              options={options.map((option, index) => ({
                value: String(index),
                label: option.trim() || `Option ${index + 1}`,
              }))}
              width="100%"
            />
          </VStack>
          <VStack className="flex-1">
            <NumberInput
              label="Time limit (seconds)"
              value={timeLimit}
              onChange={setTimeLimit}
              min={5}
              max={120}
              isIntegerOnly
              isWheelEnabled={false}
              width="100%"
            />
          </VStack>
        </HStack>
      ) : null}
      <HStack hAlign="end">
        <Button
          type="submit"
          label="Add question"
          isLoading={isBusy}
          icon={<Plus aria-hidden="true" size={16} />}
        />
      </HStack>
    </VStack>
  );
}
