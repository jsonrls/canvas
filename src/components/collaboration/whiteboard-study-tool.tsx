"use client";
import { useVoiceQuestion } from "./whiteboard/use-voice-question";
import { useWhiteboardAnswer } from "./whiteboard/use-whiteboard-answer";
import { useWhiteboardCamera } from "./whiteboard/use-whiteboard-camera";
import { useWhiteboardDocument } from "./whiteboard/use-whiteboard-document";
import { useWhiteboardInteraction } from "./whiteboard/use-whiteboard-interaction";
import { useWhiteboardPresence } from "./whiteboard/use-whiteboard-presence";
import { VoicePanel } from "./whiteboard/voice-panel";
import { WhiteboardRenderer } from "./whiteboard/whiteboard-renderer";
import { WhiteboardToolbar } from "./whiteboard/whiteboard-toolbar";

import { ButtonControl } from "@/components/ui/button";

import { useMemo, useRef, useState } from "react";

import { useCollaborativeTool } from "@/hooks/use-collaborative-tool";
import {
  cameraViewBox,
  WHITEBOARD_HEIGHT,
  WHITEBOARD_MIN_X,
  WHITEBOARD_MIN_Y,
  WHITEBOARD_WIDTH,
  type WhiteboardElement,
  type WhiteboardElementType,
  type WhiteboardPoint,
} from "@/lib/whiteboard/model";

import { readImage } from "@/lib/whiteboard/geometry";
import {
  BOARD_TEXT_FONT_SIZE,
  BOARD_TEXT_MAX_WIDTH,
  boardLineHeight,
  boardTextHeight,
  fitBoardTextBox,
  wrapBoardText,
} from "@/lib/whiteboard/text-layout";
import { measureBoardText } from "./whiteboard/measure-board-text";

/**
 * Width text rewraps to when edited. Text sized to fit a circle keeps its
 * box; ordinary text may grow to the usual limit or a width set by hand.
 */
function editWrapWidth(element: WhiteboardElement): number {
  return element.fontSize
    ? element.width
    : Math.max(BOARD_TEXT_MAX_WIDTH, element.width);
}

interface WhiteboardStudyToolProps {
  breakoutCode?: string;
  /** Owners and editors, as the answer route requires. */
  canAskAi: boolean;
  canEdit: boolean;
  currentUser: { displayName: string; id: string };
  initialState: string | null;
  roomId: string;
}

import {
  HoveredWhiteboardAuthor,
  SAFE_IMAGE_TYPES,
  WhiteboardTool,
} from "./whiteboard/types";
export default function WhiteboardStudyTool({
  breakoutCode,
  canAskAi,
  canEdit,
  currentUser,
  initialState,
  roomId,
}: WhiteboardStudyToolProps): React.ReactElement {
  const collaboration = useCollaborativeTool({
    breakoutCode,
    canEdit,
    currentUser,
    initialState,
    kind: "whiteboard",
    roomId,
  });

  const {
    elements,
    canUndo,
    canRedo,
    transact,
    upsertElement,
    readElement,
    handleUndo,
    handleRedo,
  } = useWhiteboardDocument({ collaboration, canEdit });

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [tool, setTool] = useState<WhiteboardTool>("select");

  const autoAnswerTriggerRef = useRef<{
    id: string;
    type: WhiteboardElementType;
  } | null>(null);

  const {
    aiAnswerMessage,
    aiAnswerLoading,
    answerPlacedQuestion,
    answerWhiteboardQuestion,
    setAiAnswerMessage,
  } = useWhiteboardAnswer({
    elements,
    selectedId,
    canEdit,
    roomId,
    upsertElement,
    readElement,
    currentUser,
    setSelectedId,
    setTool,
    autoAnswerTriggerRef,
  });

  const [drawingColor, setDrawingColor] = useState("#121212");

  const svgRef = useRef<SVGSVGElement>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const {
    camera,
    setCamera,
    viewport,
    hasInteractedWithBoardRef,
    handleWheel,
    handleZoomIn,
    handleZoomOut,
    handleResetView,
    handleAutoFit,
  } = useWhiteboardCamera({ containerRef, elements, collaboration, svgRef });

  const { setAwarenessField } = collaboration;

  const {
    collaboratorNames,
    laserEnabled,
    setLaserEnabled,
    clearLaser,
    publishLaser,
  } = useWhiteboardPresence({ currentUser, setAwarenessField, camera, roomId });

  const [textPlacement, setTextPlacement] = useState<WhiteboardPoint | null>(
    null,
  );

  const [pendingImage, setPendingImage] = useState("");

  const [imageMessage, setImageMessage] = useState("");

  const canUseVoice = canEdit && canAskAi && Boolean(collaboration.connection);

  const voice = useVoiceQuestion({
    answerPlacedQuestion,
    camera,
    color: drawingColor,
    currentUser,
    elements,
    enabled: canUseVoice,
    hasInteractedWithBoardRef,
    setCamera,
    setMessage: (message) => {
      setImageMessage("");
      setAiAnswerMessage(message);
    },
    setSelectedId,
    transact,
    viewport,
  });

  const {
    draft,
    setDraft,
    resizeSession,
    setResizeSession,
    moveSession,
    setMoveSession,
    isPanning,
    isSpacePressed,
    insertElement,
    handlePointerDown,
    handlePointerMove,
    finishPointer,
    selectElement,
    beginResize,
  } = useWhiteboardInteraction({
    currentUser,
    drawingColor,
    upsertElement,
    autoAnswerTriggerRef,
    setSelectedId,
    svgRef,
    hasInteractedWithBoardRef,
    canEdit,
    camera,
    viewport,
    laserEnabled,
    publishLaser,
    tool,
    setTextPlacement,
    pendingImage,
    setPendingImage,
    setImageMessage,
    setTool,
    setCamera,
    elements,
  });

  const [confirmAction, setConfirmAction] = useState<"delete" | "clear" | null>(
    null,
  );

  const [textValue, setTextValue] = useState("");

  const [editingTextId, setEditingTextId] = useState<string | null>(null);

  const [editingTextValue, setEditingTextValue] = useState("");

  const selectedElement = useMemo(
    () => elements.find((element) => element.id === selectedId) ?? null,
    [elements, selectedId],
  );

  const commitText = (): void => {
    const value = (editingTextValue || textValue).trim().slice(0, 600);
    if (!value) return;
    if (editingTextId) {
      const element = elements.find((item) => item.id === editingTextId);
      if (element) {
        const box = fitBoardTextBox(
          value,
          measureBoardText,
          editWrapWidth(element),
          element.fontSize,
        );
        upsertElement({
          ...element,
          height: box.height,
          text: value,
          width: box.width,
        });
      }
      setEditingTextId(null);
    } else if (textPlacement) {
      const box = fitBoardTextBox(value, measureBoardText);
      insertElement(
        "text",
        textPlacement,
        { x: textPlacement.x + box.width, y: textPlacement.y + box.height },
        [],
        value,
      );
      setTextPlacement(null);
      setTextValue("");
    }
  };

  const beginTextEdit = (
    event: React.MouseEvent<SVGTextElement>,
    element: WhiteboardElement,
  ): void => {
    if (!canEdit) return;
    event.stopPropagation();
    setMoveSession(null);
    setResizeSession(null);
    setSelectedId(element.id);
    setEditingTextId(element.id);
    setEditingTextValue(element.text);
  };

  // The editor grows with what is typed and wraps where the board text will.
  const editingElement = editingTextId
    ? elements.find((element) => element.id === editingTextId)
    : undefined;
  const editorOrigin = textPlacement ?? editingElement;
  const textEditor = editorOrigin
    ? (() => {
        const value = editingTextId ? editingTextValue : textValue;
        const fontSize = editingElement?.fontSize ?? BOARD_TEXT_FONT_SIZE;
        const wrapWidth = editingElement
          ? editWrapWidth(editingElement)
          : BOARD_TEXT_MAX_WIDTH;
        const box = fitBoardTextBox(
          value || "Type text…",
          measureBoardText,
          wrapWidth,
          fontSize,
        );
        const lineCount = wrapBoardText(
          value,
          wrapWidth,
          measureBoardText,
          fontSize,
        ).length;
        return {
          fontSize,
          // Border and padding of `.whiteboard-text-editor`.
          height: boardTextHeight(lineCount, fontSize) + 12,
          width: Math.max(200, box.width + 28),
          x: editorOrigin.x - 8,
          y: editorOrigin.y - 4,
        };
      })()
    : null;

  const deleteSelected = (): void => {
    if (!selectedElement) return;
    setConfirmAction("delete");
  };

  const confirmDeleteSelected = (): void => {
    if (!selectedElement) return;
    transact((document) =>
      document.getMap("whiteboard-elements").delete(selectedElement.id),
    );
    setSelectedId(null);
    setResizeSession(null);
    setConfirmAction(null);
  };

  const clearAllDrawings = (): void => {
    if (!canEdit || elements.length === 0) return;
    setConfirmAction("clear");
  };

  const confirmClearAll = (): void => {
    transact((document) => {
      const elementMap = document.getMap("whiteboard-elements");
      for (const key of Array.from(elementMap.keys())) {
        elementMap.delete(key);
      }
    });
    setSelectedId(null);
    setResizeSession(null);
    setDraft(null);
    setConfirmAction(null);
  };

  const imageInputRef = useRef<HTMLInputElement>(null);

  const chooseImage = async (file: File): Promise<void> => {
    setImageMessage("");
    if (!SAFE_IMAGE_TYPES.has(file.type) || file.size > 1024 * 1024) {
      setImageMessage("Choose a PNG, JPEG, WebP, or GIF no larger than 1 MB.");
      return;
    }

    try {
      setPendingImage(await readImage(file));
      setTool("image");
      setImageMessage("Click the board to place the image.");
    } catch (error) {
      setImageMessage(
        error instanceof Error ? error.message : "The image could not be read.",
      );
    } finally {
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  const draftElement = draft
    ? {
        authorId: currentUser.id,
        authorName: currentUser.displayName || "Study partner",
        color: collaboration.connection?.user.color ?? "#7352FA",
        createdAt: "",
        height:
          draft.type === "line" || draft.type === "arrow"
            ? draft.current.y - draft.start.y
            : Math.abs(draft.current.y - draft.start.y),
        id: "draft",
        points: draft.points,
        src: "",
        text: "",
        type: draft.type,
        width:
          draft.type === "line" || draft.type === "arrow"
            ? draft.current.x - draft.start.x
            : Math.abs(draft.current.x - draft.start.x),
        x:
          draft.type === "line" || draft.type === "arrow"
            ? draft.start.x
            : Math.min(draft.start.x, draft.current.x),
        y:
          draft.type === "line" || draft.type === "arrow"
            ? draft.start.y
            : Math.min(draft.start.y, draft.current.y),
      }
    : null;

  const [hoveredAuthor, setHoveredAuthor] =
    useState<HoveredWhiteboardAuthor | null>(null);

  return (
    <section
      className="study-tool study-tool--visual study-tool--whiteboard"
      aria-label="Whiteboard workspace"
    >
      <WhiteboardToolbar
        canUndo={canUndo}
        canEdit={canEdit}
        handleUndo={handleUndo}
        canRedo={canRedo}
        handleRedo={handleRedo}
        tool={tool}
        imageInputRef={imageInputRef}
        setTool={setTool}
        laserEnabled={laserEnabled}
        setLaserEnabled={setLaserEnabled}
        aiAnswerLoading={aiAnswerLoading}
        elements={elements}
        answerWhiteboardQuestion={answerWhiteboardQuestion}
        canUseVoice={canUseVoice}
        voiceStatus={voice.status}
        toggleVoice={voice.toggle}
        chooseImage={chooseImage}
        setDrawingColor={setDrawingColor}
        drawingColor={drawingColor}
        camera={camera}
        handleZoomOut={handleZoomOut}
        handleZoomIn={handleZoomIn}
        handleResetView={handleResetView}
        handleAutoFit={handleAutoFit}
        selectedElement={selectedElement}
        deleteSelected={deleteSelected}
        clearAllDrawings={clearAllDrawings}
        collaboration={collaboration}
      />

      {voice.status !== "idle" ? (
        <VoicePanel
          download={voice.download}
          onCancel={voice.cancel}
          onDone={voice.toggle}
          seconds={voice.seconds}
          status={voice.status}
        />
      ) : imageMessage || aiAnswerMessage || collaboration.message ? (
        <p className="study-tool__message" role="status">
          {imageMessage || aiAnswerMessage || collaboration.message}
        </p>
      ) : null}

      {confirmAction ? (
        <div className="whiteboard-confirm-backdrop" role="presentation">
          <div
            aria-labelledby="whiteboard-confirm-title"
            aria-modal="true"
            className="whiteboard-confirm-dialog"
            role="dialog"
          >
            <h2 id="whiteboard-confirm-title">
              {confirmAction === "delete"
                ? "Delete selected item?"
                : "Clear the whiteboard?"}
            </h2>
            <p>
              {confirmAction === "delete"
                ? "This item will be removed for everyone in the room."
                : "All drawings and objects will be removed for everyone in the room."}
            </p>
            <div className="whiteboard-confirm-actions">
              <ButtonControl
                variant="secondary"
                onClick={() => setConfirmAction(null)}
                type="button"
              >
                Cancel
              </ButtonControl>
              <ButtonControl
                variant="destructive"
                className="whiteboard-confirm-danger"
                onClick={
                  confirmAction === "delete"
                    ? confirmDeleteSelected
                    : confirmClearAll
                }
                type="button"
              >
                {confirmAction === "delete" ? "Delete" : "Clear all"}
              </ButtonControl>
            </div>
          </div>
        </div>
      ) : null}

      <div
        ref={containerRef}
        className={`whiteboard-stage whiteboard-stage--${tool}${laserEnabled ? " whiteboard-stage--laser-enabled" : ""}${resizeSession ? " whiteboard-stage--resizing" : ""}${isPanning ? " whiteboard-stage--panning" : ""}${isSpacePressed ? " whiteboard-stage--space-pressed" : ""}${moveSession ? " whiteboard-stage--moving" : ""}`}
      >
        <svg
          ref={svgRef}
          aria-label="Collaborative whiteboard canvas"
          onPointerCancel={finishPointer}
          onPointerDown={handlePointerDown}
          onPointerLeave={clearLaser}
          onPointerMove={handlePointerMove}
          onPointerUp={finishPointer}
          onWheel={handleWheel}
          role="img"
          viewBox={cameraViewBox(camera, viewport)}
        >
          <defs>
            <marker
              id="board-arrow"
              markerHeight="8"
              markerWidth="8"
              orient="auto-start-reverse"
              refX="7"
              refY="4"
              viewBox="0 0 8 8"
            >
              <path d="M 0 0 L 8 4 L 0 8 z" fill="context-stroke" />
            </marker>
            <pattern
              height="24"
              id="board-grid"
              patternUnits="userSpaceOnUse"
              width="24"
            >
              <circle cx="1" cy="1" fill="#d8d1c7" r="1" />
            </pattern>
            <radialGradient id="laser-core" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="24%" stopColor="#fff4f1" />
              <stop offset="52%" stopColor="#ff3b30" />
              <stop offset="100%" stopColor="#d60909" />
            </radialGradient>
            <filter
              id="laser-glow"
              height="460%"
              width="460%"
              x="-180%"
              y="-180%"
            >
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <rect
            fill="url(#board-grid)"
            x={WHITEBOARD_MIN_X}
            y={WHITEBOARD_MIN_Y}
            height={WHITEBOARD_HEIGHT}
            width={WHITEBOARD_WIDTH}
          />
          <WhiteboardRenderer
            selectedId={selectedId}
            containerRef={containerRef}
            collaboratorNames={collaboratorNames}
            setHoveredAuthor={setHoveredAuthor}
            selectElement={selectElement}
            beginTextEdit={beginTextEdit}
            tool={tool}
            canEdit={canEdit}
            beginResize={beginResize}
            elements={elements}
            draftElement={draftElement}
            selectedElement={selectedElement}
          />
          {textEditor ? (
            <foreignObject
              height={textEditor.height}
              width={textEditor.width}
              x={textEditor.x}
              y={textEditor.y}
            >
              {/* Wraps at the same width as the board text, so what you
                  type is laid out the way it will be drawn. */}
              <textarea
                autoFocus
                className="whiteboard-text-editor"
                maxLength={600}
                style={
                  textEditor.fontSize === BOARD_TEXT_FONT_SIZE
                    ? undefined
                    : {
                        fontSize: textEditor.fontSize,
                        lineHeight: `${boardLineHeight(textEditor.fontSize)}px`,
                      }
                }
                onChange={(event) => {
                  if (editingTextId) setEditingTextValue(event.target.value);
                  else setTextValue(event.target.value);
                }}
                onKeyDown={(event) => {
                  // Enter places the text; Shift+Enter starts a new line.
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    commitText();
                  }
                  if (event.key === "Escape") {
                    setTextPlacement(null);
                    setEditingTextId(null);
                  }
                }}
                onBlur={commitText}
                placeholder="Type text…"
                value={editingTextId ? editingTextValue : textValue}
              />
            </foreignObject>
          ) : null}
          {collaboration.participants.map((participant) => {
            const isSelf =
              participant.clientId === collaboration.connection?.user.clientId;
            return participant.laser ? (
              <g className="whiteboard-laser" key={participant.clientId}>
                {participant.laser.trail.slice(1).map((point, index, trail) => {
                  const previous = participant.laser?.trail[index];
                  if (!previous) return null;
                  const progress = (index + 1) / Math.max(1, trail.length);
                  return (
                    <line
                      className="whiteboard-laser__trail"
                      key={`${participant.clientId}-${index}`}
                      opacity={0.08 + progress * 0.58}
                      strokeWidth={1.5 + progress * 4.5}
                      x1={previous.x}
                      x2={point.x}
                      y1={previous.y}
                      y2={point.y}
                    />
                  );
                })}
                <g
                  transform={`translate(${participant.laser.x} ${participant.laser.y})`}
                >
                  <circle className="whiteboard-laser__halo" r="15" />
                  <circle
                    className="whiteboard-laser__dot"
                    fill="url(#laser-core)"
                    filter="url(#laser-glow)"
                    r="6.5"
                  />
                </g>
                {!isSelf ? (
                  <text
                    fill={participant.color}
                    x={participant.laser.x + 14}
                    y={participant.laser.y - 12}
                  >
                    {participant.name}
                  </text>
                ) : null}
              </g>
            ) : null;
          })}
        </svg>
        {hoveredAuthor &&
        elements.some((element) => element.id === hoveredAuthor.elementId) ? (
          <div
            className="whiteboard-author-tooltip"
            role="tooltip"
            style={{ left: hoveredAuthor.left, top: hoveredAuthor.top }}
          >
            <span
              aria-hidden="true"
              style={{ backgroundColor: hoveredAuthor.color }}
            >
              {(collaboratorNames[hoveredAuthor.authorId] ?? hoveredAuthor.name)
                .charAt(0)
                .toUpperCase()}
            </span>
            <div>
              <strong>
                {collaboratorNames[hoveredAuthor.authorId] ??
                  hoveredAuthor.name}
              </strong>
              <small>Created this</small>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
