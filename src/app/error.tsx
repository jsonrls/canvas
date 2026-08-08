"use client";

import { RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.ReactElement {
  useEffect(() => {
    console.error("[qollab:error-boundary]", {
      digest: error.digest,
      message: error.message,
      stack: error.stack,
    });
  }, [error]);

  return (
    <main className="error-page">
      <section className="error-page__card" aria-labelledby="error-page-title">
        <span className="error-page__icon" aria-hidden="true">
          <RotateCcw size={24} />
        </span>
        <p className="error-page__eyebrow">Canvas interrupted</p>
        <h1 id="error-page-title">That study session hit a snag.</h1>
        <p className="error-page__copy">
          Your notes are still safe in this browser session. Try loading the
          room again.
        </p>
        <div className="error-page__actions">
          <button type="button" className="error-page__retry" onClick={reset}>
            <RotateCcw aria-hidden="true" size={17} />
            Try again
          </button>
          <Link className="error-page__back" href="/rooms">
            Back to rooms
          </Link>
        </div>
      </section>
    </main>
  );
}
