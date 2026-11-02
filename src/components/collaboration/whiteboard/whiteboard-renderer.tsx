import {
  HANDLE_SIZE,
  HoveredWhiteboardAuthor,
  WhiteboardTool,
} from "@/components/collaboration/whiteboard/types";
import { getResizeHandles, handleCursor } from "@/lib/whiteboard/geometry";
import type { ResizeHandle } from "@/lib/whiteboard/model";
import {
  getElementBounds,
  type WhiteboardElement,
} from "@/lib/whiteboard/model";
import type { Dispatch, RefObject, SetStateAction } from "react";

export function WhiteboardRenderer({
  selectedId,
  containerRef,
  collaboratorNames,
  setHoveredAuthor,
  selectElement,
  beginTextEdit,
  tool,
  canEdit,
  beginResize,
  elements,
  draftElement,
  selectedElement,
}: {
  selectedId: string | null;
  containerRef: RefObject<HTMLDivElement | null>;
  collaboratorNames: Record<string, string>;
  setHoveredAuthor: Dispatch<SetStateAction<HoveredWhiteboardAuthor | null>>;
  selectElement: (event: React.PointerEvent<SVGElement>, id: string) => void;
  beginTextEdit: (
    event: React.MouseEvent<SVGTextElement, MouseEvent>,
    element: WhiteboardElement,
  ) => void;
  tool: WhiteboardTool;
  canEdit: boolean;
  beginResize: (
    event: React.PointerEvent<SVGRectElement>,
    element: WhiteboardElement,
    handle: ResizeHandle,
  ) => void;
  elements: WhiteboardElement[];
  draftElement: WhiteboardElement | null;
  selectedElement: WhiteboardElement | null;
}) {
  const renderElement = (
    element: WhiteboardElement,
    isDraft = false,
  ): React.ReactNode => {
    const className = `${selectedId === element.id ? "is-selected" : ""}${isDraft ? " is-draft" : ""}`;
    const showAuthor = (event: React.PointerEvent<SVGElement>): void => {
      if (isDraft || !containerRef.current) return;

      const bounds = containerRef.current.getBoundingClientRect();
      const registeredName =
        collaboratorNames[element.authorId] ?? element.authorName;
      setHoveredAuthor({
        authorId: element.authorId,
        color: element.color,
        elementId: element.id,
        left: Math.min(
          Math.max(12, event.clientX - bounds.left + 12),
          Math.max(12, bounds.width - 172),
        ),
        name: registeredName,
        top: Math.min(
          Math.max(12, event.clientY - bounds.top + 12),
          Math.max(12, bounds.height - 58),
        ),
      });
    };
    const hideAuthor = (): void => {
      setHoveredAuthor((current) =>
        current?.elementId === element.id ? null : current,
      );
    };
    const common = {
      "aria-label": `${element.type} by ${
        collaboratorNames[element.authorId] ?? element.authorName
      }`,
      className,
      onPointerEnter: showAuthor,
      onPointerLeave: hideAuthor,
      onPointerDown: (event: React.PointerEvent<SVGElement>) =>
        selectElement(event, element.id),
      stroke: element.color,
    };

    switch (element.type) {
      case "draw":
        return (
          <polyline
            {...common}
            fill="none"
            key={element.id}
            points={element.points
              .map((point) => `${point.x},${point.y}`)
              .join(" ")}
          />
        );
      case "rectangle":
        return (
          <rect
            {...common}
            fill="transparent"
            height={element.height}
            key={element.id}
            width={element.width}
            x={element.x}
            y={element.y}
          />
        );
      case "ellipse":
        return (
          <ellipse
            {...common}
            cx={element.x + element.width / 2}
            cy={element.y + element.height / 2}
            fill="transparent"
            key={element.id}
            rx={element.width / 2}
            ry={element.height / 2}
          />
        );
      case "line":
        return (
          <line
            {...common}
            key={element.id}
            x1={element.x}
            x2={element.x + element.width}
            y1={element.y}
            y2={element.y + element.height}
          />
        );
      case "arrow":
        return (
          <line
            {...common}
            key={element.id}
            markerEnd="url(#board-arrow)"
            x1={element.x}
            x2={element.x + element.width}
            y1={element.y}
            y2={element.y + element.height}
          />
        );
      case "text":
        return (
          <text
            {...common}
            fill={element.color}
            key={element.id}
            onDoubleClick={(event) => beginTextEdit(event, element)}
            onClick={(event) => {
              if (event.detail === 2) beginTextEdit(event, element);
            }}
            stroke="none"
            x={element.x}
            y={element.y + 30}
          >
            {element.text.split("\n").map((line, index) => (
              <tspan dy={index === 0 ? 0 : 32} key={index} x={element.x}>
                {line}
              </tspan>
            ))}
          </text>
        );
      case "image":
        return (
          <image
            aria-label={`image by ${
              collaboratorNames[element.authorId] ?? element.authorName
            }`}
            className={className}
            height={element.height}
            href={element.src}
            key={element.id}
            onPointerEnter={showAuthor}
            onPointerLeave={hideAuthor}
            onPointerDown={(event) => selectElement(event, element.id)}
            preserveAspectRatio="xMidYMid meet"
            width={element.width}
            x={element.x}
            y={element.y}
          />
        );
    }
  };

  const renderSelectionOverlay = (
    element: WhiteboardElement,
  ): React.ReactNode => {
    if (tool !== "select") return null;

    const isLine = element.type === "line" || element.type === "arrow";
    const bounds = getElementBounds(element);
    const handles = getResizeHandles(element);

    return (
      <g className="whiteboard-selection" key={`selection-${element.id}`}>
        {!isLine ? (
          <rect
            className="whiteboard-selection__box"
            fill="none"
            height={bounds.height}
            pointerEvents="none"
            width={bounds.width}
            x={bounds.x}
            y={bounds.y}
          />
        ) : null}
        {canEdit
          ? handles.map(({ handle, x, y }) => (
              <rect
                aria-label={`Resize ${handle}`}
                className="whiteboard-resize-handle"
                fill="#ffffff"
                height={HANDLE_SIZE}
                key={handle}
                onPointerDown={(event) => beginResize(event, element, handle)}
                rx={2}
                stroke="#7352FA"
                strokeWidth={2}
                style={{ cursor: handleCursor(handle) }}
                width={HANDLE_SIZE}
                x={x - HANDLE_SIZE / 2}
                y={y - HANDLE_SIZE / 2}
              />
            ))
          : null}
      </g>
    );
  };
  return (
    <>
      {elements.map((element) => renderElement(element))}
      {draftElement ? renderElement(draftElement, true) : null}
      {selectedElement ? renderSelectionOverlay(selectedElement) : null}
    </>
  );
}
