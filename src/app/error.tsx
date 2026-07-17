"use client";

import { RotateCcw } from "lucide-react";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.ReactElement {
  return (
    <main className="error-page">
      <p className="eyebrow">Canvas interrupted</p>
      <h1>That study session hit a snag.</h1>
      <p>
        Your notes are still safe in this browser session. Try loading the room
        again.
      </p>
      <button type="button" className="primary-button" onClick={reset}>
        <RotateCcw aria-hidden="true" size={17} />
        Try again
      </button>
    </main>
  );
}
