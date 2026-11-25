"use client";

import { DateInput, type DateInputProps } from "@astryxdesign/core/DateInput";
import { HStack, VStack } from "@astryxdesign/core/Layout";
import { NumberInput } from "@astryxdesign/core/NumberInput";
import { RadioList, RadioListItem } from "@astryxdesign/core/RadioList";
import { Slider } from "@astryxdesign/core/Slider";
import { Text } from "@astryxdesign/core/Text";
import { TextArea } from "@astryxdesign/core/TextArea";
import { TextInput } from "@astryxdesign/core/TextInput";
import { useState } from "react";

import {
  CHOICE_CLASSES,
  Swatch,
} from "@/components/collaboration/live/live-charts";
import {
  GridPlot,
  PinnedImage,
} from "@/components/collaboration/live/live-plots";
import { Button, IconButton } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "@/components/ui/icons";
import { PANEL_ROW } from "@/components/ui/panel";
import {
  formFields,
  GRID_MAX,
  POINTS_TOTAL,
  readResponseValue,
  SCALE_MAX,
  scaleStatements,
  WORDS_MAX,
  type LivePoint,
  type LiveQuestion,
  type LiveResponseValue,
} from "@/lib/live/activities";

export function describeResponse(
  question: LiveQuestion,
  value: LiveResponseValue,
): string {
  const { options } = question;
  if ("option" in value) return options[value.option] ?? "";
  if ("words" in value) return value.words.join(", ");
  if ("text" in value) return value.text;
  if ("rating" in value) return `${value.rating} out of ${SCALE_MAX}`;
  if ("ratings" in value) {
    return value.ratings
      .map((rating, index) =>
        options[index]
          ? `${options[index]} ${rating}`
          : `${rating} out of ${SCALE_MAX}`,
      )
      .join(", ");
  }
  if ("order" in value) {
    return value.order
      .map((option, index) => `${index + 1}. ${options[option]}`)
      .join(", ");
  }
  if ("points" in value) {
    return value.points
      .map((points, index) => `${options[index]} ${points}`)
      .join(", ");
  }
  if ("positions" in value) {
    const { xLabel, yLabel } = question.settings;
    return value.positions
      .map(
        (point, index) =>
          `${options[index]} (${xLabel} ${point.x}, ${yLabel} ${point.y})`,
      )
      .join(", ");
  }
  if ("number" in value) return String(value.number);
  if ("fields" in value) return value.fields.filter(Boolean).join(", ");
  return "Pin placed";
}

/** A blank answer of the right shape. Most are invalid until filled in. */
function blankValue(question: LiveQuestion): LiveResponseValue {
  const { options } = question;
  switch (question.kind) {
    case "poll":
    case "quiz":
      return { option: -1 };
    case "word_cloud":
      return { words: [] };
    case "scale":
      return { ratings: scaleStatements(question).map(() => 0) };
    case "ranking":
      return { order: options.map((_, index) => index) };
    case "points":
      return { points: options.map(() => 0) };
    case "grid":
      // Below zero until placed, which the rules reject.
      return { positions: options.map(() => ({ x: -1, y: -1 })) };
    case "number":
      return { number: Number.NaN };
    case "form":
      return { fields: options.map(() => "") };
    case "pin":
      return { pin: { x: -1, y: -1 } };
    case "open_ended":
    case "qa":
      return { text: "" };
  }
}

function isValid(question: LiveQuestion, value: LiveResponseValue): boolean {
  try {
    readResponseValue(question, value);
    return true;
  } catch {
    return false;
  }
}

function replaceAt<T>(list: T[], index: number, value: T): T[] {
  return list.map((item, position) => (position === index ? value : item));
}

function RankingInput({
  onChange,
  options,
  order,
}: {
  onChange(order: number[]): void;
  options: string[];
  order: number[];
}): React.ReactElement {
  const move = (from: number, to: number): void => {
    const next = [...order];
    [next[from], next[to]] = [next[to], next[from]];
    onChange(next);
  };

  return (
    <VStack gap={2}>
      <Text as="p" color="secondary">
        Put your top choice first.
      </Text>
      <VStack as="ol" gap={2} aria-label="Your ranking">
        {order.map((option, index) => (
          <HStack
            as="li"
            gap={3}
            vAlign="center"
            className={`${PANEL_ROW} bg-muted!`}
            key={option}
          >
            <Text weight="semibold">{index + 1}</Text>
            <Swatch index={option} />
            <Text className="min-w-0 flex-1 break-words">
              {options[option]}
            </Text>
            <IconButton
              label={`Move ${options[option]} up`}
              tooltip="Move up"
              icon={<ChevronUp aria-hidden="true" size={18} />}
              isDisabled={index === 0}
              onClick={() => move(index, index - 1)}
            />
            <IconButton
              label={`Move ${options[option]} down`}
              tooltip="Move down"
              icon={<ChevronDown aria-hidden="true" size={18} />}
              isDisabled={index === order.length - 1}
              onClick={() => move(index, index + 1)}
            />
          </HStack>
        ))}
      </VStack>
    </VStack>
  );
}

const POINT_STEP = 10;

function PointsInput({
  onChange,
  options,
  points,
}: {
  onChange(points: number[]): void;
  options: string[];
  points: number[];
}): React.ReactElement {
  const left = POINTS_TOTAL - points.reduce((sum, value) => sum + value, 0);
  const add = (index: number, step: number): void =>
    onChange(replaceAt(points, index, points[index] + step));

  return (
    <VStack gap={4}>
      <Text weight="semibold" role="status">
        {left === 0 ? "All 100 points shared." : `${left} points left.`}
      </Text>
      <VStack as="ul" gap={2} aria-label="Share your points">
        {options.map((option, index) => (
          <HStack
            as="li"
            gap={3}
            vAlign="center"
            wrap="wrap"
            className={`${PANEL_ROW} bg-muted!`}
            key={`${index}-${option}`}
          >
            <HStack gap={3} vAlign="center" className="min-w-40 flex-1">
              <Swatch index={index} />
              <Text className="min-w-0 break-words">{option}</Text>
            </HStack>
            <HStack gap={3} vAlign="center" className="shrink-0">
              <Button
                label="−10"
                aria-label={`Take 10 points from ${option}`}
                variant="secondary"
                size="lg"
                isDisabled={points[index] < POINT_STEP}
                onClick={() => add(index, -POINT_STEP)}
              />
              <Text size="xl" weight="bold" className="w-12 text-center">
                {points[index]}
              </Text>
              <Button
                label="+10"
                aria-label={`Give 10 points to ${option}`}
                variant="secondary"
                size="lg"
                isDisabled={left < POINT_STEP}
                onClick={() => add(index, POINT_STEP)}
              />
            </HStack>
          </HStack>
        ))}
      </VStack>
    </VStack>
  );
}

function GridInput({
  onChange,
  options,
  positions,
  xLabel,
  yLabel,
}: {
  onChange(positions: LivePoint[]): void;
  options: string[];
  positions: LivePoint[];
  xLabel: string;
  yLabel: string;
}): React.ReactElement {
  const [active, setActive] = useState(0);
  const current = positions[active];
  const isPlaced = current.x >= 0;
  const shown = isPlaced ? current : { x: GRID_MAX / 2, y: GRID_MAX / 2 };
  const unplaced = positions.filter((position) => position.x < 0).length;
  const place = (point: LivePoint): void =>
    onChange(replaceAt(positions, active, point));

  return (
    <VStack gap={5}>
      <RadioList
        label="Choose an item, then place it on the grid"
        value={String(active)}
        onChange={(index) => setActive(Number(index))}
        width="100%"
      >
        {options.map((option, index) => (
          <RadioListItem
            key={`${index}-${option}`}
            label={option}
            description={positions[index].x >= 0 ? "Placed" : "Not placed yet"}
            value={String(index)}
            className={`rounded-2xl border-2 p-3 ${CHOICE_CLASSES[index]}`}
          />
        ))}
      </RadioList>
      <GridPlot
        labels={options}
        onPick={place}
        points={positions.map((position) =>
          position.x >= 0 ? position : null,
        )}
        xLabel={xLabel}
        yLabel={yLabel}
      />
      <VStack gap={3} role="group" aria-label={`Place ${options[active]}`}>
        {(["x", "y"] as const).map((axis) => (
          <Slider
            key={`${active}-${axis}`}
            label={`${options[active]}: ${axis === "x" ? xLabel : yLabel}`}
            min={0}
            max={GRID_MAX}
            value={shown[axis]}
            valueDisplay="text"
            formatValue={(value) => (isPlaced ? String(value) : "Not placed")}
            onChange={(value: number) => place({ ...shown, [axis]: value })}
            width="100%"
          />
        ))}
      </VStack>
      <Text type="supporting" role="status">
        {unplaced === 0
          ? "Everything is placed."
          : `${unplaced} ${unplaced === 1 ? "item" : "items"} left to place.`}
      </Text>
    </VStack>
  );
}

function PinInput({
  alt,
  imageUrl,
  onChange,
  pin,
}: {
  alt: string;
  imageUrl: string;
  onChange(pin: LivePoint): void;
  pin: LivePoint;
}): React.ReactElement {
  const isPlaced = pin.x >= 0;
  const current = isPlaced ? pin : { x: 50, y: 50 };

  return (
    <VStack gap={4}>
      <Text as="p" color="secondary">
        Choose a spot on the image, or use the sliders.
      </Text>
      <PinnedImage
        alt={alt}
        src={imageUrl}
        pins={isPlaced ? [pin] : []}
        onPick={onChange}
      />
      <Slider
        label="Left to right"
        value={Math.round(current.x)}
        onChange={(x: number) => onChange({ ...current, x })}
        formatValue={(value) => `${value}%`}
        width="100%"
      />
      <Slider
        label="Top to bottom"
        value={Math.round(current.y)}
        onChange={(y: number) => onChange({ ...current, y })}
        formatValue={(value) => `${value}%`}
        width="100%"
      />
    </VStack>
  );
}

function AnswerFields({
  imageUrl,
  onChange,
  question,
  value,
}: {
  imageUrl: string;
  onChange(value: LiveResponseValue): void;
  question: LiveQuestion;
  value: LiveResponseValue;
}): React.ReactElement | null {
  const { options, settings } = question;

  if ("option" in value) {
    return (
      <RadioList
        label="Choose one"
        value={value.option < 0 ? "" : String(value.option)}
        onChange={(option) => onChange({ option: Number(option) })}
        width="100%"
      >
        {options.map((option, index) => (
          <RadioListItem
            key={`${index}-${option}`}
            label={option}
            value={String(index)}
            className={`rounded-2xl border-2 p-4 ${CHOICE_CLASSES[index]}`}
          />
        ))}
      </RadioList>
    );
  }
  if ("words" in value) {
    return (
      <TextInput
        label="Your words"
        description={`Up to ${WORDS_MAX} words, separated by commas.`}
        value={value.words.join(",")}
        onChange={(text) => onChange({ words: text.split(",") })}
        placeholder="photosynthesis, chlorophyll"
      />
    );
  }
  if ("ratings" in value) {
    return (
      <VStack gap={6}>
        {scaleStatements(question).map((statement, row) => (
          <Slider
            key={row}
            label={statement ?? "Your rating"}
            description={`Drag to a rating from 1 to ${SCALE_MAX}.`}
            // Zero is "not rated", so nobody sends a rating by accident.
            min={0}
            max={SCALE_MAX}
            marks={Array.from({ length: SCALE_MAX + 1 }, (_, mark) => ({
              value: mark,
              label: mark === 0 ? "–" : String(mark),
            }))}
            value={value.ratings[row]}
            valueDisplay="text"
            formatValue={(rating) =>
              rating === 0 ? "Not rated" : String(rating)
            }
            onChange={(rating: number) =>
              onChange({ ratings: replaceAt(value.ratings, row, rating) })
            }
            width="100%"
          />
        ))}
      </VStack>
    );
  }
  if ("order" in value) {
    return (
      <RankingInput
        options={options}
        order={value.order}
        onChange={(order) => onChange({ order })}
      />
    );
  }
  if ("points" in value) {
    return (
      <PointsInput
        options={options}
        points={value.points}
        onChange={(points) => onChange({ points })}
      />
    );
  }
  if ("positions" in value) {
    return (
      <GridInput
        options={options}
        positions={value.positions}
        xLabel={settings.xLabel ?? ""}
        yLabel={settings.yLabel ?? ""}
        onChange={(positions) => onChange({ positions })}
      />
    );
  }
  if ("number" in value) {
    return (
      <NumberInput
        label="Your guess"
        description={`A whole number from ${settings.min} to ${settings.max}.`}
        value={Number.isNaN(value.number) ? null : value.number}
        onChange={(number: number | null) =>
          onChange({ number: number ?? Number.NaN })
        }
        hasClear
        min={settings.min}
        max={settings.max}
        isIntegerOnly
        isWheelEnabled={false}
        width="100%"
      />
    );
  }
  if ("fields" in value) {
    const types = formFields(question);
    const set = (index: number, text: string): void =>
      onChange({ fields: replaceAt(value.fields, index, text) });
    return (
      <VStack gap={4}>
        <Text as="p" color="secondary">
          Only the room’s owner and editors see what you enter.
        </Text>
        {options.map((field, index) => {
          const { choices = [], required, type } = types[index];
          const key = `${index}-${field}`;
          if (type === "choice") {
            return (
              <RadioList
                key={key}
                label={field}
                isRequired={required}
                value={value.fields[index]}
                onChange={(choice) => set(index, choice)}
                width="100%"
              >
                {choices.map((choice) => (
                  <RadioListItem key={choice} label={choice} value={choice} />
                ))}
              </RadioList>
            );
          }
          if (type === "date") {
            return (
              <DateInput
                key={key}
                label={field}
                isRequired={required}
                value={
                  (value.fields[index] || undefined) as DateInputProps["value"]
                }
                onChange={(date) => set(index, date ?? "")}
              />
            );
          }
          return (
            <TextInput
              key={key}
              label={field}
              type={type === "email" ? "email" : "text"}
              isRequired={required}
              value={value.fields[index]}
              onChange={(text) => set(index, text)}
              width="100%"
            />
          );
        })}
      </VStack>
    );
  }
  if ("pin" in value) {
    return (
      <PinInput
        alt={`Image for: ${question.prompt}`}
        imageUrl={imageUrl}
        pin={value.pin}
        onChange={(pin) => onChange({ pin })}
      />
    );
  }
  if ("text" in value) {
    return (
      <TextArea
        label="Your answer"
        value={value.text}
        onChange={(text) => onChange({ text })}
        maxLength={280}
        rows={4}
      />
    );
  }
  return null;
}

export function LiveAnswerForm({
  imageUrl,
  isBusy,
  onSubmit,
  question,
}: {
  imageUrl: string;
  isBusy: boolean;
  onSubmit(value: LiveResponseValue): void;
  question: LiveQuestion;
}): React.ReactElement {
  const [value, setValue] = useState(() => blankValue(question));
  const canSend = isValid(question, value);

  return (
    <VStack
      as="form"
      gap={4}
      aria-label="Your answer"
      onSubmit={(event: React.FormEvent) => {
        event.preventDefault();
        if (canSend) onSubmit(value);
      }}
    >
      <AnswerFields
        imageUrl={imageUrl}
        onChange={setValue}
        question={question}
        value={value}
      />
      <HStack hAlign="end">
        <Button
          type="submit"
          label="Send answer"
          variant="primary"
          isLoading={isBusy}
          isDisabled={!canSend}
        />
      </HStack>
    </VStack>
  );
}
