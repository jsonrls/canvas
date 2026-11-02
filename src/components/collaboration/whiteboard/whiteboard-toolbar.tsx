import { MobileToolsMenu } from "@/components/collaboration/mobile-tools-menu";
import {
  MOBILE_PRIMARY_WHITEBOARD_TOOLS,
  TOOLS,
  WhiteboardTool,
} from "@/components/collaboration/whiteboard/types";
import { ButtonControl } from "@/components/ui/button";
import {
  Eraser,
  HelpCircle,
  Maximize2,
  Minus,
  Plus,
  Radio,
  Redo2,
  RefreshCw,
  Sparkles,
  Trash2,
  Undo2,
} from "@/components/ui/icons";
import { LoadingIndicator } from "@/components/ui/LoadingScreen";
import type { useCollaborativeTool } from "@/hooks/use-collaborative-tool";
import {
  MAX_ZOOM,
  MIN_ZOOM,
  type WhiteboardCamera,
  type WhiteboardElement,
} from "@/lib/whiteboard/model";
import type { Dispatch, RefObject, SetStateAction } from "react";

export function WhiteboardToolbar({
  canUndo,
  canEdit,
  handleUndo,
  canRedo,
  handleRedo,
  tool,
  imageInputRef,
  setTool,
  laserEnabled,
  setLaserEnabled,
  aiAnswerLoading,
  elements,
  answerWhiteboardQuestion,
  chooseImage,
  setDrawingColor,
  drawingColor,
  camera,
  handleZoomOut,
  handleZoomIn,
  handleResetView,
  handleAutoFit,
  selectedElement,
  deleteSelected,
  clearAllDrawings,
  collaboration,
}: {
  canUndo: boolean;
  canEdit: boolean;
  handleUndo: () => void;
  canRedo: boolean;
  handleRedo: () => void;
  tool: WhiteboardTool;
  imageInputRef: RefObject<HTMLInputElement | null>;
  setTool: Dispatch<SetStateAction<WhiteboardTool>>;
  laserEnabled: boolean;
  setLaserEnabled: Dispatch<SetStateAction<boolean>>;
  aiAnswerLoading: boolean;
  elements: WhiteboardElement[];
  answerWhiteboardQuestion: (
    candidateElements?: WhiteboardElement[],
    candidateSelectedId?: string | null,
    mode?: "auto" | "manual",
  ) => Promise<void>;
  chooseImage: (file: File) => Promise<void>;
  setDrawingColor: Dispatch<SetStateAction<string>>;
  drawingColor: string;
  camera: WhiteboardCamera;
  handleZoomOut: () => void;
  handleZoomIn: () => void;
  handleResetView: () => void;
  handleAutoFit: () => void;
  selectedElement: WhiteboardElement | null;
  deleteSelected: () => void;
  clearAllDrawings: () => void;
  collaboration: ReturnType<typeof useCollaborativeTool>;
}) {
  return (
    <div className="whiteboard-toolbar" aria-label="Whiteboard tools">
      <ButtonControl
        variant="ghost"
        size="sm"
        className="whiteboard-toolbar__mobile-primary"
        disabled={!canUndo || !canEdit}
        onClick={handleUndo}
        title="Undo"
        type="button"
      >
        <Undo2 aria-hidden="true" size={17} />
        <span>Undo</span>
      </ButtonControl>
      <ButtonControl
        variant="ghost"
        size="sm"
        className="whiteboard-toolbar__mobile-primary"
        disabled={!canRedo || !canEdit}
        onClick={handleRedo}
        title="Redo"
        type="button"
      >
        <Redo2 aria-hidden="true" size={17} />
        <span>Redo</span>
      </ButtonControl>
      {TOOLS.map(({ icon: Icon, label, tool: nextTool }) => (
        <ButtonControl
          variant="ghost"
          size="sm"
          aria-pressed={tool === nextTool}
          className={`${MOBILE_PRIMARY_WHITEBOARD_TOOLS.has(nextTool) ? "whiteboard-toolbar__mobile-primary" : "whiteboard-toolbar__mobile-secondary"}${tool === nextTool ? " is-active" : ""}`}
          disabled={!canEdit}
          key={nextTool}
          onClick={() => {
            if (nextTool === "image") imageInputRef.current?.click();
            else setTool(nextTool);
          }}
          title={label}
          type="button"
        >
          <Icon aria-hidden="true" size={17} />
          <span>{label}</span>
        </ButtonControl>
      ))}
      <ButtonControl
        variant="ghost"
        size="sm"
        aria-pressed={laserEnabled}
        className={`whiteboard-laser-toggle whiteboard-toolbar__mobile-secondary${laserEnabled ? " is-active" : ""}`}
        disabled={!canEdit}
        onClick={() => setLaserEnabled((enabled) => !enabled)}
        title={
          laserEnabled
            ? `Turn laser off (using ${tool})`
            : `Use laser with ${tool}`
        }
        type="button"
      >
        <Radio aria-hidden="true" size={17} />
        <span>Laser</span>
        <span aria-hidden="true" className="whiteboard-laser-toggle__status" />
      </ButtonControl>
      <ButtonControl
        variant="ghost"
        size="sm"
        aria-busy={aiAnswerLoading}
        className="whiteboard-ai-answer whiteboard-toolbar__mobile-secondary"
        disabled={!canEdit || aiAnswerLoading || elements.length === 0}
        onClick={() => void answerWhiteboardQuestion()}
        title="AI answer"
        type="button"
      >
        {aiAnswerLoading ? (
          <LoadingIndicator size="icon" />
        ) : (
          <Sparkles aria-hidden="true" size={17} />
        )}
        <span>{aiAnswerLoading ? "Answering" : "AI answer"}</span>
      </ButtonControl>
      <input
        ref={imageInputRef}
        accept="image/png,image/jpeg,image/webp,image/gif,.png,.jpg,.jpeg,.webp,.gif"
        className="visually-hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void chooseImage(file);
        }}
        type="file"
      />
      <label
        className="whiteboard-color-picker whiteboard-toolbar__mobile-secondary"
        title="Drawing color"
      >
        <span>Color</span>
        <input
          aria-label="Drawing color"
          disabled={!canEdit}
          onChange={(event) => setDrawingColor(event.target.value)}
          type="color"
          value={drawingColor}
        />
      </label>
      <div className="whiteboard-toolbar__zoom whiteboard-toolbar__mobile-secondary">
        <ButtonControl
          variant="ghost"
          size="sm"
          disabled={camera.zoom <= MIN_ZOOM}
          onClick={handleZoomOut}
          title="Zoom out"
          type="button"
        >
          <Minus aria-hidden="true" size={17} />
        </ButtonControl>
        <span className="zoom-level">{Math.round(camera.zoom * 100)}%</span>
        <ButtonControl
          variant="ghost"
          size="sm"
          disabled={camera.zoom >= MAX_ZOOM}
          onClick={handleZoomIn}
          title="Zoom in"
          type="button"
        >
          <Plus aria-hidden="true" size={17} />
        </ButtonControl>
        <ButtonControl
          variant="ghost"
          size="sm"
          onClick={handleResetView}
          title="Reset view"
          type="button"
        >
          <RefreshCw aria-hidden="true" size={17} />
        </ButtonControl>
        <ButtonControl
          variant="ghost"
          size="sm"
          onClick={handleAutoFit}
          title="Auto-fit"
          type="button"
        >
          <Maximize2 aria-hidden="true" size={17} />
        </ButtonControl>
      </div>
      <MobileToolsMenu
        active={
          !MOBILE_PRIMARY_WHITEBOARD_TOOLS.has(tool) ||
          laserEnabled ||
          camera.zoom !== 1
        }
        description="Add shapes and media, change the view, or manage the board."
        title="More whiteboard tools"
      >
        {(close) => (
          <div className="mobile-tools-dialog__grid">
            {TOOLS.filter(
              ({ tool: nextTool }) =>
                !MOBILE_PRIMARY_WHITEBOARD_TOOLS.has(nextTool),
            ).map(({ icon: Icon, label, tool: nextTool }) => (
              <ButtonControl
                variant="ghost"
                size="sm"
                aria-pressed={tool === nextTool}
                className={`mobile-tool-action${tool === nextTool ? " is-active" : ""}`}
                disabled={!canEdit}
                key={nextTool}
                onClick={() => {
                  if (nextTool === "image") {
                    imageInputRef.current?.click();
                  } else {
                    setTool(nextTool);
                  }
                  close();
                }}
                type="button"
              >
                <Icon aria-hidden="true" size={18} />
                <span>{label}</span>
              </ButtonControl>
            ))}
            <ButtonControl
              variant="ghost"
              size="sm"
              aria-pressed={laserEnabled}
              className={`mobile-tool-action${laserEnabled ? " is-active" : ""}`}
              disabled={!canEdit}
              onClick={() => {
                setLaserEnabled((enabled) => !enabled);
                close();
              }}
              type="button"
            >
              <Radio aria-hidden="true" size={18} />
              <span>{laserEnabled ? "Turn laser off" : "Laser pointer"}</span>
            </ButtonControl>
            <ButtonControl
              variant="ghost"
              size="sm"
              aria-busy={aiAnswerLoading}
              className="mobile-tool-action"
              disabled={!canEdit || aiAnswerLoading || elements.length === 0}
              onClick={() => {
                void answerWhiteboardQuestion();
                close();
              }}
              type="button"
            >
              {aiAnswerLoading ? (
                <LoadingIndicator size="icon" />
              ) : (
                <Sparkles aria-hidden="true" size={18} />
              )}
              <span>{aiAnswerLoading ? "Answering…" : "AI answer"}</span>
            </ButtonControl>
            <label className="mobile-tools-dialog__control">
              <span>Drawing color</span>
              <input
                aria-label="Drawing color"
                disabled={!canEdit}
                onChange={(event) => setDrawingColor(event.target.value)}
                type="color"
                value={drawingColor}
              />
            </label>
            <div className="mobile-tools-dialog__control mobile-tools-dialog__control--wide mobile-tools-dialog__control--canvas">
              <span>Canvas view</span>
              <div className="mobile-tools-dialog__stepper mobile-tools-dialog__stepper--wide">
                <ButtonControl
                  variant="ghost"
                  size="sm"
                  aria-label="Zoom out"
                  disabled={camera.zoom <= MIN_ZOOM}
                  onClick={handleZoomOut}
                  type="button"
                >
                  <Minus aria-hidden="true" size={18} />
                </ButtonControl>
                <strong>{Math.round(camera.zoom * 100)}%</strong>
                <ButtonControl
                  variant="ghost"
                  size="sm"
                  aria-label="Zoom in"
                  disabled={camera.zoom >= MAX_ZOOM}
                  onClick={handleZoomIn}
                  type="button"
                >
                  <Plus aria-hidden="true" size={18} />
                </ButtonControl>
                <ButtonControl
                  variant="ghost"
                  size="sm"
                  aria-label="Reset view"
                  onClick={handleResetView}
                  type="button"
                >
                  <RefreshCw aria-hidden="true" size={18} />
                </ButtonControl>
                <ButtonControl
                  variant="ghost"
                  size="sm"
                  aria-label="Auto-fit whiteboard"
                  onClick={handleAutoFit}
                  type="button"
                >
                  <Maximize2 aria-hidden="true" size={18} />
                </ButtonControl>
              </div>
            </div>
            {canEdit && selectedElement ? (
              <ButtonControl
                variant="danger-ghost"
                size="sm"
                className="mobile-tool-action mobile-tool-action--danger"
                onClick={() => {
                  deleteSelected();
                  close();
                }}
                type="button"
              >
                <Trash2 aria-hidden="true" size={18} />
                <span>Delete selected</span>
              </ButtonControl>
            ) : null}
            {canEdit && elements.length > 0 ? (
              <ButtonControl
                variant="danger-ghost"
                size="sm"
                className="mobile-tool-action mobile-tool-action--danger"
                onClick={() => {
                  clearAllDrawings();
                  close();
                }}
                type="button"
              >
                <Eraser aria-hidden="true" size={18} />
                <span>Clear board</span>
              </ButtonControl>
            ) : null}
          </div>
        )}
      </MobileToolsMenu>
      <div className="whiteboard-toolbar__meta" role="status">
        <span
          className={`connection-badge connection-badge--${collaboration.status}`}
        >
          <span className="connection-dot" aria-hidden="true" />
          {collaboration.status === "synced"
            ? "Live"
            : collaboration.status === "viewing"
              ? "Read-only"
              : collaboration.status}
        </span>
        <span>{collaboration.participants.length} active</span>
        <ButtonControl
          variant="ghost"
          size="sm"
          className="whiteboard-shortcuts-help"
          type="button"
          aria-label="Whiteboard keyboard shortcuts"
        >
          <HelpCircle size={18} />
          <div className="whiteboard-shortcuts-tooltip" role="tooltip">
            <div className="tooltip-title">Keyboard Shortcuts</div>
            <div className="tooltip-row">
              <span>
                <kbd>Space</kbd> + Drag / Swipe
              </span>
              <span className="tooltip-desc">Pan Canvas</span>
            </div>
            <div className="tooltip-row">
              <span>
                <kbd>⌘/Ctrl</kbd> + Scroll
              </span>
              <span className="tooltip-desc">Zoom at cursor</span>
            </div>
            <div className="tooltip-row">
              <span>
                <kbd>Scroll</kbd>
              </span>
              <span className="tooltip-desc">Pan Canvas</span>
            </div>
          </div>
        </ButtonControl>
      </div>
      {canEdit && (selectedElement || elements.length > 0) ? (
        <div className="whiteboard-toolbar__actions">
          {selectedElement ? (
            <ButtonControl
              variant="danger-ghost"
              size="sm"
              className="whiteboard-delete"
              onClick={deleteSelected}
              type="button"
            >
              <Trash2 aria-hidden="true" size={16} /> Delete
            </ButtonControl>
          ) : null}
          {elements.length > 0 ? (
            <ButtonControl
              variant="danger-ghost"
              size="sm"
              className="whiteboard-clear"
              onClick={clearAllDrawings}
              type="button"
            >
              <Eraser aria-hidden="true" size={16} /> Clear all
            </ButtonControl>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
