// Serializes snapshots per document. A failed write remains dirty for the next flush.
export function createDocumentPersistence({ save, onError, delay = 750 }) {
  const entries = new Map();

  function entryFor(name, document) {
    let entry = entries.get(name);
    if (!entry) {
      entry = {
        document,
        revision: 0,
        savedRevision: 0,
        timer: null,
        running: null,
      };
      entries.set(name, entry);
    }
    if (entry.document !== document) {
      if (entry.running || entry.savedRevision !== entry.revision) {
        throw new Error(
          "A previous document must finish saving before replacement.",
        );
      }
      entry.document = document;
    }
    return entry;
  }

  function flush(name) {
    const entry = entries.get(name);
    if (!entry) return Promise.resolve();
    clearTimeout(entry.timer);
    entry.timer = null;
    if (entry.running) return entry.running;
    entry.running = (async () => {
      while (entry.savedRevision < entry.revision) {
        const revision = entry.revision;
        await save(name, entry.document);
        entry.savedRevision = revision;
      }
    })().finally(() => {
      entry.running = null;
    });
    return entry.running;
  }

  function schedule(name, document) {
    const entry = entryFor(name, document);
    entry.revision += 1;
    clearTimeout(entry.timer);
    entry.timer = setTimeout(() => {
      entry.timer = null;
      void flush(name).catch(() => onError());
    }, delay);
  }

  async function flushAll() {
    const results = await Promise.allSettled([...entries.keys()].map(flush));
    const failures = results.filter((result) => result.status === "rejected");
    if (failures.length) {
      throw new AggregateError(
        failures.map(() => new Error("Document persistence failed.")),
        `${failures.length} collaborative document saves failed.`,
      );
    }
  }

  function release(name, document) {
    const entry = entries.get(name);
    if (
      entry?.document !== document ||
      entry.running ||
      entry.savedRevision !== entry.revision
    )
      return;
    clearTimeout(entry.timer);
    entries.delete(name);
  }

  return { schedule, flush, flushAll, release };
}
