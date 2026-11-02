// The deadline covers connection draining and persistence, including hung writes.
export async function shutdownCollaboration({
  stopAccepting,
  drain,
  flush,
  timeoutMs = 10_000,
  log,
}) {
  let timeout;
  const deadline = new Promise((resolve) => {
    timeout = setTimeout(() => resolve("timeout"), timeoutMs);
  });
  const work = (async () => {
    try {
      stopAccepting();
      await drain();
      await flush();
      return "saved";
    } catch {
      return "failed";
    }
  })();
  const outcome = await Promise.race([work, deadline]);
  clearTimeout(timeout);
  log({ event: "collaboration_shutdown", outcome });
  return outcome === "saved" ? 0 : 1;
}
