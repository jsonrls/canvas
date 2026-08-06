"use client";

import {
  Check,
  GitCompareArrows,
  LoaderCircle,
  RotateCcw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useRef, useState } from "react";

import {
  createDraftExcerpt,
  type ConflictReview,
} from "@/lib/collaboration/conflict-review";

export interface ConflictResolutionResult {
  message: string;
  ok: boolean;
}

interface ConflictReviewPanelProps {
  canUseOfflineDraft: boolean;
  onKeepMerged: (reviewId: number) => void;
  onResolved: (reviewId: number, message: string) => void;
  onUseOfflineDraft: (
    review: ConflictReview,
  ) => Promise<ConflictResolutionResult>;
  review: ConflictReview;
}

function describeBatches(count: number, source: "local" | "shared"): string {
  const label = source === "local" ? "offline" : "shared";
  return `${count} ${label} update ${count === 1 ? "batch" : "batches"}`;
}

export function ConflictReviewPanel({
  canUseOfflineDraft,
  onKeepMerged,
  onResolved,
  onUseOfflineDraft,
  review,
}: ConflictReviewPanelProps): React.ReactElement {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState("");
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const restoreButtonRef = useRef<HTMLButtonElement>(null);

  const showConfirmation = (): void => {
    setMessage("");
    setIsConfirming(true);
    window.requestAnimationFrame(() => confirmButtonRef.current?.focus());
  };

  const cancelConfirmation = (): void => {
    setIsConfirming(false);
    window.requestAnimationFrame(() => restoreButtonRef.current?.focus());
  };

  const restoreOfflineDraft = async (): Promise<void> => {
    setMessage("");
    setIsPending(true);
    let result: ConflictResolutionResult;

    try {
      result = await onUseOfflineDraft(review);
    } catch {
      setMessage(
        "The safety checkpoint could not be confirmed. The merged note is unchanged.",
      );
      setIsPending(false);
      return;
    }

    if (!result.ok) {
      setMessage(result.message);
      setIsPending(false);
      return;
    }

    onResolved(review.id, result.message);
  };

  return (
    <section
      className="conflict-review"
      aria-labelledby={`conflict-review-title-${review.id}`}
      aria-busy={isPending}
    >
      <div className="conflict-review__heading">
        <span className="conflict-review__icon" aria-hidden="true">
          <GitCompareArrows size={19} />
        </span>
        <div>
          <p className="eyebrow">Reconnection review</p>
          <h2 id={`conflict-review-title-${review.id}`}>
            Your notes merged with shared changes
          </h2>
          <p>
            Qollab combined
            {` ${describeBatches(review.localUpdateCount, "local")} `}
            and{` ${describeBatches(review.remoteUpdateCount, "shared")} `}.
            Nothing was discarded.
          </p>
        </div>
      </div>

      <div className="conflict-review__comparison">
        <article className="draft-preview">
          <div className="draft-preview__label">
            <RotateCcw aria-hidden="true" size={15} />
            <span>
              <strong>Your offline draft</strong>
              <small>Before reconnection</small>
            </span>
          </div>
          <p>{createDraftExcerpt(review.offlineDraft.text)}</p>
        </article>

        <article className="draft-preview draft-preview--recommended">
          <div className="draft-preview__label">
            <Sparkles aria-hidden="true" size={15} />
            <span>
              <strong>Current merged note</strong>
              <small>Offline and shared changes together</small>
            </span>
            <span className="recommended-badge">
              <Check aria-hidden="true" size={11} />
              Recommended
            </span>
          </div>
          <p>{createDraftExcerpt(review.mergedDraft.text)}</p>
        </article>
      </div>

      {isConfirming ? (
        <div className="conflict-confirmation" role="group">
          <ShieldCheck aria-hidden="true" size={18} />
          <div>
            <strong>Replace the live note with your offline draft?</strong>
            <p>
              This changes the shared note for everyone. Qollab will save the
              latest merged result as a durable checkpoint first.
            </p>
          </div>
          <div className="conflict-confirmation__actions">
            <button
              type="button"
              className="conflict-button conflict-button--quiet"
              disabled={isPending}
              onClick={cancelConfirmation}
            >
              Cancel
            </button>
            <button
              ref={confirmButtonRef}
              type="button"
              className="conflict-button conflict-button--danger"
              disabled={!canUseOfflineDraft || isPending}
              onClick={() => void restoreOfflineDraft()}
            >
              {isPending ? (
                <LoaderCircle className="spin" aria-hidden="true" size={15} />
              ) : (
                <ShieldCheck aria-hidden="true" size={15} />
              )}
              {isPending ? "Saving checkpoint…" : "Save merge & use draft"}
            </button>
          </div>
        </div>
      ) : (
        <div className="conflict-review__actions">
          <button
            type="button"
            className="conflict-button conflict-button--primary"
            disabled={isPending}
            onClick={() => onKeepMerged(review.id)}
          >
            <Check aria-hidden="true" size={15} />
            Keep merged note
          </button>
          <button
            ref={restoreButtonRef}
            type="button"
            className="conflict-button conflict-button--quiet"
            disabled={!canUseOfflineDraft || isPending}
            onClick={showConfirmation}
          >
            <RotateCcw aria-hidden="true" size={15} />
            Use my offline draft
          </button>
        </div>
      )}

      {!canUseOfflineDraft ? (
        <p className="conflict-review__availability">
          Live sync must return before an offline draft can replace the shared
          note. You can still keep the merged result.
        </p>
      ) : null}

      {message ? (
        <p className="conflict-review__error" role="alert">
          {message}
        </p>
      ) : null}
    </section>
  );
}
