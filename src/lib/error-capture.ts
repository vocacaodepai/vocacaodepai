/**
 * Captures the last unhandled server-side error so the SSR entry can report a
 * meaningful error instead of h3's generic swallowed 500 payload.
 */
let lastCapturedError: unknown;

export function captureError(error: unknown) {
  lastCapturedError = error;
}

export function consumeLastCapturedError(): unknown {
  const error = lastCapturedError;
  lastCapturedError = undefined;
  return error;
}

const globalScope = globalThis as typeof globalThis & {
  __errorCaptureInstalled?: boolean;
};

if (!globalScope.__errorCaptureInstalled) {
  globalScope.__errorCaptureInstalled = true;

  const onUnhandledRejection = (event: { reason?: unknown }) => {
    captureError(event?.reason);
  };

  const onError = (event: { error?: unknown; message?: unknown }) => {
    captureError(event?.error ?? event?.message);
  };

  const scope = globalThis as unknown as {
    addEventListener?: (type: string, listener: (event: never) => void) => void;
  };

  scope.addEventListener?.("unhandledrejection", onUnhandledRejection as never);
  scope.addEventListener?.("error", onError as never);
}
