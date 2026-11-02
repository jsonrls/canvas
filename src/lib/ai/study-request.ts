export interface StudyRequest {
  signal: AbortSignal;
  isCurrent(): boolean;
  finish(): void;
}

/** One current operation per mounted study tool; cancellation also fences JSON decoding. */
export function createStudyRequestScope() {
  let active = true;
  let current: AbortController | null = null;

  function cancel() {
    current?.abort();
    current = null;
  }

  return {
    isActive: () => active,
    activate() {
      active = true;
    },
    dispose() {
      active = false;
      cancel();
    },
    cancel,
    start(): StudyRequest | null {
      if (!active) return null;
      cancel();
      const controller = new AbortController();
      current = controller;
      return {
        signal: controller.signal,
        isCurrent: () =>
          active && current === controller && !controller.signal.aborted,
        finish() {
          if (current === controller) current = null;
        },
      };
    },
  };
}

export async function runStudyRequest<T>(
  request: StudyRequest,
  operation: () => Promise<T>,
  handlers: {
    success(value: T): void;
    error(error: unknown): void;
    settled(): void;
  },
): Promise<void> {
  if (!request.isCurrent()) return;
  try {
    const value = await operation();
    if (request.isCurrent()) handlers.success(value);
  } catch (error) {
    if (request.isCurrent()) handlers.error(error);
  } finally {
    if (request.isCurrent()) {
      handlers.settled();
      request.finish();
    }
  }
}
