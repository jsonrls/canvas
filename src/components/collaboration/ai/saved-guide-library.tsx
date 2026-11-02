import { ButtonControl } from "@/components/ui/button";
import { ArrowLeft, Bookmark, Trash2 } from "@/components/ui/icons";
import { LoadingIndicator } from "@/components/ui/LoadingScreen";
import type { SavedStudyGuideMetadata } from "@/lib/ai/saved-study-guides";
import { formatGenerationTime } from "@/lib/ai/study-tool-payload";

export function SavedGuideLibrary({
  savedGuides,
  isLoadingSavedGuides,
  activeSavedGuideId,
  loadingGuideId,
  loadSavedGuide,
  pendingDeleteId,
  deletingGuideId,
  deleteSavedGuide,
  setPendingDeleteId,
}: {
  savedGuides: SavedStudyGuideMetadata[];
  isLoadingSavedGuides: boolean;
  activeSavedGuideId: string | null;
  loadingGuideId: string | null;
  loadSavedGuide: (id: string) => Promise<void>;
  pendingDeleteId: string | null;
  deletingGuideId: string | null;
  deleteSavedGuide: (id: string) => Promise<void>;
  setPendingDeleteId: (id: string | null) => void;
}) {
  return (
    <section className="ai-saved-guides" aria-labelledby="saved-guides-heading">
      <div className="ai-saved-guides__heading">
        <div>
          <p className="ai-section-kicker">Private library</p>
          <h2 id="saved-guides-heading">Saved study guides</h2>
          <p>Only you can reopen or remove guides saved in this room.</p>
        </div>
        <span className="ai-count-badge">{savedGuides.length}/50</span>
      </div>

      {isLoadingSavedGuides ? (
        <LoadingIndicator
          className="ai-saved-guides__state"
          label="Loading saved guides…"
          size="compact"
        />
      ) : savedGuides.length > 0 ? (
        <div className="ai-saved-guides__list">
          {savedGuides.map((guide) => (
            <article
              className={`ai-saved-guide-card${activeSavedGuideId === guide.id ? " ai-saved-guide-card--active" : ""}`}
              key={guide.id}
            >
              <ButtonControl
                variant="custom"
                className="ai-saved-guide-card__open"
                aria-busy={loadingGuideId === guide.id}
                disabled={Boolean(loadingGuideId)}
                onClick={() => void loadSavedGuide(guide.id)}
                type="button"
              >
                <Bookmark aria-hidden="true" size={17} />
                <span>
                  <strong>{guide.title}</strong>
                  <small>
                    Generated {formatGenerationTime(guide.generatedAt)} · Saved{" "}
                    {formatGenerationTime(guide.createdAt)}
                  </small>
                </span>
                {loadingGuideId === guide.id ? (
                  <LoadingIndicator size="icon" />
                ) : (
                  <ArrowLeft aria-hidden="true" size={16} />
                )}
              </ButtonControl>
              {pendingDeleteId === guide.id ? (
                <div
                  className="ai-saved-guide-card__confirm"
                  role="group"
                  aria-label={`Confirm deleting ${guide.title}`}
                >
                  <span>Delete this saved guide?</span>
                  <ButtonControl
                    variant="destructive"
                    aria-busy={deletingGuideId === guide.id}
                    disabled={deletingGuideId === guide.id}
                    onClick={() => void deleteSavedGuide(guide.id)}
                    type="button"
                  >
                    {deletingGuideId === guide.id ? (
                      <LoadingIndicator size="icon" />
                    ) : null}
                    {deletingGuideId === guide.id ? "Deleting…" : "Delete"}
                  </ButtonControl>
                  <ButtonControl
                    variant="secondary"
                    disabled={deletingGuideId === guide.id}
                    onClick={() => setPendingDeleteId(null)}
                    type="button"
                  >
                    Keep
                  </ButtonControl>
                </div>
              ) : (
                <ButtonControl
                  variant="danger-ghost"
                  size="sm"
                  aria-label={`Delete ${guide.title}`}
                  className="ai-saved-guide-card__delete"
                  onClick={() => setPendingDeleteId(guide.id)}
                  type="button"
                >
                  <Trash2 aria-hidden="true" size={16} />
                </ButtonControl>
              )}
            </article>
          ))}
        </div>
      ) : (
        <div className="ai-saved-guides__state">
          <Bookmark aria-hidden="true" size={18} />
          <span>Saved guides appear here after you choose “Save guide.”</span>
        </div>
      )}
    </section>
  );
}
