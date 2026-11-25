"use client";

import { Dialog } from "@astryxdesign/core/Dialog";
import { FileInput } from "@astryxdesign/core/FileInput";
import { Heading } from "@astryxdesign/core/Heading";
import { HStack, VStack } from "@astryxdesign/core/Layout";
import { NumberInput } from "@astryxdesign/core/NumberInput";
import { Selector } from "@astryxdesign/core/Selector";
import { Slider } from "@astryxdesign/core/Slider";
import { Switch } from "@astryxdesign/core/Switch";
import { Text } from "@astryxdesign/core/Text";
import { TextInput } from "@astryxdesign/core/TextInput";
import { useEffect, useId, useRef, useState } from "react";

import { Button, IconButton } from "@/components/ui/button";
import { Plus, Trash2 } from "@/components/ui/icons";
import {
  FORM_FIELD_LABELS,
  LIVE_KIND_LABELS,
  LIVE_OPTION_RULES,
  LIVE_QUESTION_KINDS,
  QUIZ_LIMIT_DEFAULT,
  type FormField,
  type FormFieldType,
  type LiveArea,
  type LiveQuestionDraft,
  type LiveQuestionKind,
  type LiveSettings,
} from "@/lib/live/activities";
import { toLiveImage } from "@/lib/live/image";
import { fitArea } from "@/lib/live/shapes";
import { PinnedImage } from "@/components/collaboration/live/live-plots";

interface LiveQuestionFormProps {
  /** Why the last change failed; shown once this form has failed to save. */
  error: string | null;
  isBusy: boolean;
  onCancel(): void;
  onCreate(draft: LiveQuestionDraft, image?: File): Promise<boolean>;
}

const EMPTY_OPTIONS = ["", ""];
interface FieldDraft {
  type: FormFieldType;
  required: boolean;
  /** As typed: separated by commas. */
  choices: string;
}

const TEXT_FIELD: FieldDraft = { type: "text", required: false, choices: "" };
const DEFAULT_AREA: LiveArea = { x: 30, y: 30, width: 40, height: 40 };
const AREA_SLIDERS = [
  ["x", "From the left"],
  ["y", "From the top"],
  ["width", "Width"],
  ["height", "Height"],
] as const;

function toField({ choices, required, type }: FieldDraft): FormField {
  return type === "choice"
    ? {
        type,
        required,
        choices: choices
          .split(",")
          .map((choice) => choice.trim())
          .filter(Boolean),
      }
    : { type, required };
}

const EMPTY_SETTINGS: LiveSettings = { min: 0, max: 100, answer: 50 };

const KIND_HINTS: Partial<Record<LiveQuestionKind, string>> = {
  scale: "Leave the statements empty to rate the question itself.",
  form: "Only the room’s owner and editors see form answers.",
  number: "The correct number stays hidden until you show results.",
  points: "Everyone shares 100 points between the items.",
  qa: "Everyone can ask without their name and vote for questions.",
};

export function LiveQuestionForm({
  error,
  isBusy,
  onCancel,
  onCreate,
}: LiveQuestionFormProps): React.ReactElement {
  const [kind, setKind] = useState<LiveQuestionKind>("poll");
  const [prompt, setPrompt] = useState("");
  const [options, setOptions] = useState<string[]>(EMPTY_OPTIONS);
  const [correctOption, setCorrectOption] = useState("0");
  const [timeLimit, setTimeLimit] = useState<number | undefined>(
    QUIZ_LIMIT_DEFAULT,
  );
  const [settings, setSettings] = useState<LiveSettings>(EMPTY_SETTINGS);
  const [image, setImage] = useState<File | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);
  const [fields, setFields] = useState<FieldDraft[]>([]);
  const [hasArea, setHasArea] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);
  const [area, setArea] = useState<LiveArea>(DEFAULT_AREA);
  const [preview, setPreview] = useState<{ image: File; url: string } | null>(
    null,
  );
  const [pendingIndex, setPendingIndex] = useState<number | null>(null);
  const confirmTitleId = useId();
  const confirmTextId = useId();
  const optionsRef = useRef<HTMLElement>(null);
  const rule = LIVE_OPTION_RULES[kind];
  const noun = rule?.noun.toLowerCase() ?? "";

  useEffect(() => {
    if (!image) return;
    const url = URL.createObjectURL(image);
    queueMicrotask(() => setPreview({ image, url }));
    return () => URL.revokeObjectURL(url);
  }, [image]);
  const previewUrl = preview && preview.image === image ? preview.url : null;

  const fieldAt = (index: number): FieldDraft => fields[index] ?? TEXT_FIELD;
  const changeField = (index: number, patch: Partial<FieldDraft>): void =>
    setFields((current) =>
      options.map((_, position) => ({
        ...(current[position] ?? TEXT_FIELD),
        ...(position === index ? patch : {}),
      })),
    );

  const chooseKind = (next: LiveQuestionKind): void => {
    const nextRule = LIVE_OPTION_RULES[next];
    setKind(next);
    // Switching type keeps what was typed and only tops the list up.
    setOptions((current) => {
      const filled = current.filter((option) => option.trim());
      const missing = Math.max(0, (nextRule?.min ?? 0) - filled.length);
      return [...filled, ...Array.from({ length: missing }, () => "")];
    });
    setCorrectOption("0");
  };

  const changeSettings = (patch: LiveSettings): void =>
    setSettings((current) => ({ ...current, ...patch }));

  const updateOption = (index: number, value: string): void => {
    setOptions((current) =>
      current.map((option, position) => (position === index ? value : option)),
    );
  };

  const isBlank = (index: number): boolean =>
    !options[index].trim() &&
    !(kind === "form" && fieldAt(index).choices.trim());
  // The fewest rows a type may have stay, so deleting one of them empties it.
  const isAtMinimum = rule !== undefined && options.length <= rule.min;

  const removeOption = (index: number): void => {
    if (isAtMinimum) {
      updateOption(index, "");
      changeField(index, TEXT_FIELD);
      return;
    }
    setOptions((current) =>
      current.filter((_, position) => position !== index),
    );
    setFields((current) => current.filter((_, position) => position !== index));
    setCorrectOption((current) => {
      const selected = Number(current);
      if (selected === index) return "0";
      return String(selected > index ? selected - 1 : selected);
    });
  };

  const confirmRemoval = (): void => {
    if (pendingIndex === null) return;
    removeOption(pendingIndex);
    setPendingIndex(null);
    // The row's button is gone or disabled, so focus has nowhere to return.
    setTimeout(() => optionsRef.current?.focus());
  };

  const submit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    let upload: File | undefined;
    setImageError(null);
    if (kind === "pin") {
      if (!image) {
        setImageError("Choose an image.");
        return;
      }
      setIsPreparing(true);
      try {
        upload = await toLiveImage(image);
      } catch (error) {
        setImageError(
          error instanceof Error
            ? error.message
            : "That image could not be used.",
        );
        return;
      } finally {
        setIsPreparing(false);
      }
    }
    const created = await onCreate(
      {
        kind,
        prompt,
        options: rule ? options : [],
        correctOption: kind === "quiz" ? Number(correctOption) : null,
        timeLimitSeconds: kind === "quiz" ? (timeLimit ?? null) : null,
        settings:
          kind === "form"
            ? { fields: options.map((_, index) => toField(fieldAt(index))) }
            : kind === "pin"
              ? hasArea
                ? { area }
                : {}
              : settings,
      },
      upload,
    );
    setHasFailed(!created);
    if (created) {
      setPrompt("");
      setOptions(EMPTY_OPTIONS.slice(0, rule?.min ?? 0));
      setCorrectOption("0");
      setSettings(EMPTY_SETTINGS);
      setImage(null);
      setFields([]);
      setHasArea(false);
    }
  };

  return (
    <>
      <VStack
        as="form"
        gap={4}
        paddingInline={4}
        paddingBlockStart={4}
        onSubmit={submit}
        aria-label="Add a question"
      >
        <Selector
          label="Question type"
          value={kind}
          onChange={(value) => chooseKind(value as LiveQuestionKind)}
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
        {KIND_HINTS[kind] ? (
          <Text as="p" type="supporting">
            {KIND_HINTS[kind]}
          </Text>
        ) : null}
        {rule ? (
          <VStack
            ref={optionsRef}
            tabIndex={-1}
            gap={2}
            role="group"
            aria-labelledby="live-question-options"
            className="outline-none"
          >
            <Text id="live-question-options" weight="semibold">
              {rule.plural}
            </Text>
            {options.map((option, index) => (
              <VStack gap={2} key={index}>
                <HStack gap={2} vAlign="center">
                  <VStack className="flex-1">
                    <TextInput
                      label={`${rule.noun} ${index + 1}`}
                      isLabelHidden
                      value={option}
                      onChange={(value) => updateOption(index, value)}
                      placeholder={`${rule.noun} ${index + 1}`}
                    />
                  </VStack>
                  <IconButton
                    label={`Delete ${noun} ${index + 1}`}
                    tooltip="Delete"
                    variant="danger-ghost"
                    icon={<Trash2 aria-hidden="true" size={16} />}
                    isDisabled={isAtMinimum && isBlank(index)}
                    onClick={() =>
                      isBlank(index)
                        ? removeOption(index)
                        : setPendingIndex(index)
                    }
                  />
                </HStack>
                {kind === "form" ? (
                  <>
                    <HStack gap={3} vAlign="center" wrap="wrap">
                      <Selector
                        label={`Type of field ${index + 1}`}
                        isLabelHidden
                        value={fieldAt(index).type}
                        onChange={(type) =>
                          changeField(index, { type: type as FormFieldType })
                        }
                        options={Object.entries(FORM_FIELD_LABELS).map(
                          ([value, label]) => ({ value, label }),
                        )}
                      />
                      <Switch
                        label="Required"
                        value={fieldAt(index).required}
                        onChange={(required) =>
                          changeField(index, { required })
                        }
                      />
                    </HStack>
                    {fieldAt(index).type === "choice" ? (
                      <TextInput
                        label={`Choices for field ${index + 1}`}
                        isLabelHidden
                        value={fieldAt(index).choices}
                        onChange={(choices) => changeField(index, { choices })}
                        placeholder="Choices, separated by commas"
                      />
                    ) : null}
                  </>
                ) : null}
              </VStack>
            ))}
            <HStack>
              <Button
                label={`Add ${noun}`}
                variant="ghost"
                icon={<Plus aria-hidden="true" size={16} />}
                isDisabled={options.length >= rule.max}
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
        {kind === "grid" ? (
          <>
            <TextInput
              label="Horizontal axis"
              value={settings.xLabel ?? ""}
              onChange={(xLabel) => changeSettings({ xLabel })}
              placeholder="Effort"
              isRequired
            />
            <TextInput
              label="Vertical axis"
              value={settings.yLabel ?? ""}
              onChange={(yLabel) => changeSettings({ yLabel })}
              placeholder="Impact"
              isRequired
            />
          </>
        ) : null}
        {kind === "number"
          ? (
              [
                ["min", "Lowest number"],
                ["max", "Highest number"],
                ["answer", "Correct number"],
              ] as const
            ).map(([key, label]) => (
              <NumberInput
                key={key}
                label={label}
                value={settings[key] ?? 0}
                onChange={(value: number) => changeSettings({ [key]: value })}
                isIntegerOnly
                isWheelEnabled={false}
                width="100%"
              />
            ))
          : null}
        {kind === "qa" ? (
          <Switch
            label="Approve questions before others see them"
            value={settings.moderated ?? false}
            onChange={(moderated) => changeSettings({ moderated })}
          />
        ) : null}
        {kind === "pin" ? (
          <FileInput
            label="Image"
            value={image}
            onChange={(file) => {
              setImageError(null);
              setImage(file instanceof File ? file : null);
            }}
            accept="image/jpeg,image/png,image/webp"
            status={
              imageError ? { type: "error", message: imageError } : undefined
            }
            isRequired
            width="100%"
          />
        ) : null}
        {kind === "pin" && previewUrl ? (
          <VStack gap={3}>
            <Switch
              label="Mark a correct area"
              value={hasArea}
              onChange={setHasArea}
            />
            {hasArea ? (
              <>
                <Text as="p" type="supporting">
                  Drag on the image, or use the sliders. Students see the area
                  only when you show results.
                </Text>
                <PinnedImage
                  alt="Your image, with the correct area marked"
                  src={previewUrl}
                  pins={[]}
                  area={area}
                  onArea={(next) => setArea(fitArea(next))}
                />
                {AREA_SLIDERS.map(([key, label]) => (
                  <Slider
                    key={key}
                    label={label}
                    min={0}
                    max={100}
                    value={area[key]}
                    valueDisplay="text"
                    formatValue={(value) => `${value}%`}
                    onChange={(value: number) =>
                      setArea(fitArea({ ...area, [key]: value }))
                    }
                    width="100%"
                  />
                ))}
              </>
            ) : null}
          </VStack>
        ) : null}
        <HStack
          gap={2}
          hAlign="end"
          vAlign="center"
          wrap="wrap"
          className="sticky bottom-0 z-10 -mx-4 border-t border-border bg-popover px-4 py-4"
        >
          {hasFailed && error ? (
            <Text role="alert" className="w-full text-error">
              {error}
            </Text>
          ) : null}
          <Button
            label="Cancel"
            variant="ghost"
            isDisabled={isBusy || isPreparing}
            onClick={onCancel}
          />
          <Button
            type="submit"
            label="Add question"
            variant="primary"
            isLoading={isBusy || isPreparing}
            icon={<Plus aria-hidden="true" size={16} />}
          />
        </HStack>
      </VStack>
      <Dialog
        isOpen={pendingIndex !== null}
        onOpenChange={(open) => {
          if (!open) setPendingIndex(null);
        }}
        purpose="form"
        role="alertdialog"
        aria-labelledby={confirmTitleId}
        aria-describedby={confirmTextId}
      >
        <VStack gap={4} padding={4}>
          <Heading level={2} id={confirmTitleId}>
            Delete this {noun}?
          </Heading>
          <Text
            as="p"
            color="secondary"
            id={confirmTextId}
            className="break-words"
          >
            {pendingIndex !== null && options[pendingIndex]?.trim()
              ? `“${options[pendingIndex].trim()}” will be deleted.`
              : `What you entered for this ${noun} will be deleted.`}
            {rule && isAtMinimum
              ? ` This type needs at least ${rule.min}, so an empty row stays.`
              : ""}
          </Text>
          <HStack gap={2} hAlign="end" wrap="wrap">
            <Button
              type="button"
              label={`Keep ${noun}`}
              variant="ghost"
              data-autofocus
              onClick={() => setPendingIndex(null)}
            />
            <Button
              type="button"
              label={`Delete ${noun}`}
              variant="destructive"
              onClick={confirmRemoval}
            />
          </HStack>
        </VStack>
      </Dialog>
    </>
  );
}
