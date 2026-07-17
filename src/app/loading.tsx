export default function Loading(): React.ReactElement {
  return (
    <main className="app-loading" aria-label="Loading BoardPrep Canvas">
      <div className="loading-mark" aria-hidden="true">
        BP
      </div>
      <p>Preparing your study canvas…</p>
    </main>
  );
}
