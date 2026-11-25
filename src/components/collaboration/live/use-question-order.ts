"use client";

import { useEffect, useRef, useState } from "react";

import type { LiveActivitiesState } from "@/components/collaboration/live/use-live-activities";
import { moveItem, type LiveQuestion } from "@/lib/live/activities";

const SCROLL_EDGE = 48;
const SCROLL_STEP = 8;

function scrollParent(element: HTMLElement | null): HTMLElement | null {
  let parent = element?.parentElement ?? null;
  while (parent) {
    const { overflowY } = getComputedStyle(parent);
    if (
      (overflowY === "auto" || overflowY === "scroll") &&
      parent.scrollHeight > parent.clientHeight
    ) {
      return parent;
    }
    parent = parent.parentElement;
  }
  return null;
}

/** The gap nearest a height on the screen: 0 is above the first row. */
function slotAt(list: HTMLElement | null, y: number): number {
  return [...(list?.querySelectorAll("li") ?? [])].filter((row) => {
    const box = row.getBoundingClientRect();
    return box.top + box.height / 2 < y;
  }).length;
}

/** Reorders the question list by dragging a handle or pressing arrow keys. */
export function useQuestionOrder({
  listRef,
  onAct,
  questions: saved,
}: {
  listRef: React.RefObject<HTMLElement | null>;
  onAct: LiveActivitiesState["act"];
  questions: LiveQuestion[];
}) {
  // Shown until the server's list has the same order.
  const [order, setOrder] = useState<string[] | null>(null);
  const [moved, setMoved] = useState<{ id: string } | null>(null);
  const [drag, setDrag] = useState<{ id: string; slot: number } | null>(null);
  const queued = useRef<string[] | null>(null);
  const isSending = useRef(false);
  const pointerY = useRef(0);

  let questions = saved;
  if (order) {
    const rank = new Map(order.map((id, index) => [id, index]));
    const place = (id: string): number => rank.get(id) ?? order.length;
    questions = [...saved].sort((a, b) => place(a.id) - place(b.id));
  }
  const indexOf = (id: string): number =>
    questions.findIndex((question) => question.id === id);

  // One request at a time; quick moves send only the newest order next.
  const send = async (): Promise<void> => {
    if (isSending.current) return;
    isSending.current = true;
    while (queued.current) {
      const questionIds = queued.current;
      queued.current = null;
      if (!(await onAct({ action: "reorder_questions", questionIds }))) {
        queued.current = null;
      }
    }
    isSending.current = false;
    setOrder(null);
  };

  const move = (id: string, to: number): void => {
    const from = indexOf(id);
    const target = Math.min(questions.length - 1, Math.max(0, to));
    if (from < 0 || target === from) return;
    const next = moveItem(
      questions.map((question) => question.id),
      from,
      target,
    );
    setOrder(next);
    setMoved({ id });
    queued.current = next;
    void send();
  };

  const startDrag = (id: string, y: number): void => {
    pointerY.current = y;
    setDrag({ id, slot: indexOf(id) });
  };
  const dragBy = (y: number): void => {
    if (!drag) return;
    pointerY.current = y;
    setDrag({ id: drag.id, slot: slotAt(listRef.current, y) });
  };
  const cancelDrag = (): void => setDrag(null);
  const endDrag = (): void => {
    if (!drag) return;
    setDrag(null);
    move(drag.id, drag.slot > indexOf(drag.id) ? drag.slot - 1 : drag.slot);
  };

  // While dragging: scroll near the edges, and let Escape give up.
  const isDragging = drag !== null;
  useEffect(() => {
    if (!isDragging) return;
    const list = listRef.current;
    const box = scrollParent(list);
    const timer = setInterval(() => {
      if (!box) return;
      const { bottom, top } = box.getBoundingClientRect();
      if (pointerY.current < top + SCROLL_EDGE) box.scrollTop -= SCROLL_STEP;
      else if (pointerY.current > bottom - SCROLL_EDGE) {
        box.scrollTop += SCROLL_STEP;
      }
    }, 16);
    const onScroll = (): void =>
      setDrag((current) =>
        current ? { ...current, slot: slotAt(list, pointerY.current) } : null,
      );
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === "Escape") setDrag(null);
    };
    box?.addEventListener("scroll", onScroll);
    window.addEventListener("keydown", onKey);
    return () => {
      clearInterval(timer);
      box?.removeEventListener("scroll", onScroll);
      window.removeEventListener("keydown", onKey);
    };
  }, [isDragging, listRef]);

  const from = drag ? indexOf(drag.id) : -1;
  return {
    cancelDrag,
    drag,
    dragBy,
    /** Where the dragged question would land, or null if it would not move. */
    dropSlot:
      drag && drag.slot !== from && drag.slot !== from + 1 ? drag.slot : null,
    endDrag,
    moved,
    questions,
    startDrag,
    step: (id: string, by: number): void => move(id, indexOf(id) + by),
  };
}
