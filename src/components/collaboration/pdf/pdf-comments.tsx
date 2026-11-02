import { ButtonControl } from "@/components/ui/button";
import { PanelRightClose, Trash2 } from "@/components/ui/icons";
import { type PdfAnnotation, type PdfReply } from "@/lib/pdf-annotations/model";
import type { Dispatch, SetStateAction } from "react";

export function PdfComments({
  page,
  pageComments,
  setCommentsOpen,
  bookmarkedPages,
  setPage,
  selectedId,
  selectAnnotation,
  selectedAnnotation,
  canEdit,
  deleteSelected,
  setTextDraft,
  textDraft,
  saveAnnotationText,
  replies,
  setReplyText,
  replyText,
  addReply,
}: {
  page: number;
  pageComments: PdfAnnotation[];
  setCommentsOpen: Dispatch<SetStateAction<boolean>>;
  bookmarkedPages: Set<number>;
  setPage: Dispatch<SetStateAction<number>>;
  selectedId: string | null;
  selectAnnotation: (annotation: PdfAnnotation) => void;
  selectedAnnotation: PdfAnnotation | null;
  canEdit: boolean;
  deleteSelected: () => void;
  setTextDraft: Dispatch<SetStateAction<string>>;
  textDraft: string;
  saveAnnotationText: () => void;
  replies: PdfReply[];
  setReplyText: Dispatch<SetStateAction<string>>;
  replyText: string;
  addReply: () => void;
}) {
  return (
    <aside
      className="pdf-comments"
      id="pdf-comments-panel"
      aria-label="PDF comments"
    >
      <div className="pdf-comments__heading">
        <div>
          <p className="sidebar-label">Page {page}</p>
          <h2>Comments & notes</h2>
        </div>
        <div className="pdf-comments__heading-actions">
          <span>{pageComments.length}</span>
          <ButtonControl
            variant="ghost"
            size="sm"
            aria-label="Close comments and notes"
            className="pdf-comments__close"
            onClick={() => setCommentsOpen(false)}
            type="button"
          >
            <PanelRightClose aria-hidden="true" size={18} />
          </ButtonControl>
        </div>
      </div>
      {bookmarkedPages.size ? (
        <div className="pdf-bookmarks">
          <strong>Bookmarks</strong>
          <div>
            {[...bookmarkedPages]
              .sort((a, b) => a - b)
              .map((bookmarkedPage) => (
                <ButtonControl
                  variant="ghost"
                  size="sm"
                  key={bookmarkedPage}
                  onClick={() => setPage(bookmarkedPage)}
                  type="button"
                >
                  {bookmarkedPage}
                </ButtonControl>
              ))}
          </div>
        </div>
      ) : null}
      <div className="pdf-comment-list">
        {pageComments.map((annotation) => (
          <ButtonControl
            variant="custom"
            className={selectedId === annotation.id ? "is-active" : ""}
            key={annotation.id}
            onClick={() => selectAnnotation(annotation)}
            type="button"
          >
            <span style={{ background: annotation.color }}>
              {annotation.authorName.charAt(0)}
            </span>
            <div>
              <strong>{annotation.authorName}</strong>
              <p>{annotation.text || "Add a note…"}</p>
            </div>
          </ButtonControl>
        ))}
        {pageComments.length === 0 ? (
          <p className="pdf-comment-empty">No page comments yet.</p>
        ) : null}
      </div>

      {selectedAnnotation ? (
        <div className="pdf-comment-editor">
          <div className="pdf-comment-editor__heading">
            <strong>{selectedAnnotation.type}</strong>
            {canEdit ? (
              <ButtonControl
                variant="danger-ghost"
                size="sm"
                aria-label="Delete annotation"
                onClick={deleteSelected}
                type="button"
              >
                <Trash2 aria-hidden="true" size={15} />
              </ButtonControl>
            ) : null}
          </div>
          <textarea
            disabled={!canEdit}
            maxLength={4000}
            onChange={(event) => setTextDraft(event.target.value)}
            placeholder="Add context for your study partners…"
            value={textDraft}
          />
          {canEdit ? (
            <ButtonControl
              variant="primary"
              onClick={saveAnnotationText}
              type="button"
            >
              Save note
            </ButtonControl>
          ) : null}
          <div className="pdf-replies">
            {replies
              .filter((reply) => reply.annotationId === selectedAnnotation.id)
              .map((reply) => (
                <div key={reply.id}>
                  <strong>{reply.authorName}</strong>
                  <p>{reply.text}</p>
                </div>
              ))}
          </div>
          {canEdit ? (
            <div className="pdf-reply-form">
              <input
                maxLength={1200}
                onChange={(event) => setReplyText(event.target.value)}
                placeholder="Reply…"
                value={replyText}
              />
              <ButtonControl
                variant="primary"
                disabled={!replyText.trim()}
                onClick={addReply}
                type="button"
              >
                Reply
              </ButtonControl>
            </div>
          ) : null}
        </div>
      ) : (
        <p className="pdf-comment-empty">Select a mark to view its details.</p>
      )}
    </aside>
  );
}
