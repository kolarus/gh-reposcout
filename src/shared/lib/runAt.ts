/**
 * Runs `callback` once `isoDate` has passed (immediately if it already has),
 * plus an optional margin. Returns a cancel function, so it can be returned
 * straight from an effect.
 */
export function runAt(
  isoDate: string,
  callback: () => void,
  marginMs = 0,
): () => void {
  const target = Date.parse(isoDate);
  const waitMs = Number.isNaN(target) ? 0 : Math.max(0, target - Date.now());
  const timer = setTimeout(callback, waitMs + marginMs);
  return () => {
    clearTimeout(timer);
  };
}
