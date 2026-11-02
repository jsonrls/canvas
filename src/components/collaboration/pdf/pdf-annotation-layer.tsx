import { DraftMark } from "@/components/collaboration/pdf/types";
import { ButtonControl } from "@/components/ui/button";
import { MessageSquare, StickyNote } from "@/components/ui/icons";
import {
  type PdfAnnotation,
  type PdfAnnotationType,
} from "@/lib/pdf-annotations/model";

export function PdfAnnotationLayer({
  scrollMode,
  selectedTool,
  finishDraft,
  handlePointerDown,
  handlePointerMove,
  pageAnnotations,
  selectedId,
  selectAnnotation,
  draft,
}: {
  scrollMode: boolean;
  selectedTool: PdfAnnotationType;
  finishDraft: () => void;
  handlePointerDown: (event: React.PointerEvent<HTMLDivElement>) => void;
  handlePointerMove: (event: React.PointerEvent<HTMLDivElement>) => void;
  pageAnnotations: PdfAnnotation[];
  selectedId: string | null;
  selectAnnotation: (annotation: PdfAnnotation) => void;
  draft: DraftMark | null;
}) {
  return (
    <div
      className={`pdf-annotation-layer pdf-annotation-layer--${scrollMode ? "scroll" : selectedTool}`}
      onPointerCancel={finishDraft}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishDraft}
    >
      <svg
        aria-hidden="true"
        className="pdf-drawing-layer"
        viewBox="0 0 1 1"
        preserveAspectRatio="none"
      >
        {pageAnnotations
          .filter((annotation) => annotation.type === "draw")
          .map((annotation) => (
            <polyline
              className={selectedId === annotation.id ? "is-selected" : ""}
              key={annotation.id}
              onPointerDown={(event) => {
                event.stopPropagation();
                selectAnnotation(annotation);
              }}
              points={annotation.points
                .map((point) => `${point.x},${point.y}`)
                .join(" ")}
              stroke={annotation.color}
            />
          ))}
        {draft?.type === "draw" ? (
          <polyline
            className="is-draft"
            points={draft.points
              .map((point) => `${point.x},${point.y}`)
              .join(" ")}
          />
        ) : null}
      </svg>
      {pageAnnotations
        .filter((annotation) => annotation.type !== "draw")
        .map((annotation) => (
          <ButtonControl
            variant="custom"
            aria-label={`${annotation.type} by ${annotation.authorName}`}
            className={`pdf-mark pdf-mark--${annotation.type}${selectedId === annotation.id ? " is-selected" : ""}`}
            key={annotation.id}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => selectAnnotation(annotation)}
            style={
              {
                height: `${annotation.height * 100}%`,
                left: `${annotation.x * 100}%`,
                top: `${annotation.y * 100}%`,
                width: `${annotation.width * 100}%`,
                "--mark-color": annotation.color,
              } as React.CSSProperties
            }
            type="button"
          >
            {annotation.type === "sticky" ? (
              <StickyNote aria-hidden="true" size={14} />
            ) : null}
            {annotation.type === "comment" ? (
              <MessageSquare aria-hidden="true" size={14} />
            ) : null}
          </ButtonControl>
        ))}
      {draft && draft.type !== "draw" ? (
        <span
          className={`pdf-mark pdf-mark--${draft.type} is-draft`}
          style={{
            height: `${Math.max(Math.abs(draft.current.y - draft.start.y), 0.006) * 100}%`,
            left: `${Math.min(draft.start.x, draft.current.x) * 100}%`,
            top: `${Math.min(draft.start.y, draft.current.y) * 100}%`,
            width: `${Math.max(Math.abs(draft.current.x - draft.start.x), 0.01) * 100}%`,
          }}
        />
      ) : null}
    </div>
  );
}
