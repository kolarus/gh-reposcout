import { useEffect, useState } from 'react';

/**
 * The current time (epoch ms), refreshed every `intervalMs`. Components read
 * time through this instead of calling `Date.now()` while rendering, which
 * would make renders impure (ADR-0014) and never update on its own.
 */
export function useNow(intervalMs: number): number {
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, intervalMs);
    return () => {
      clearInterval(timer);
    };
  }, [intervalMs]);

  return now;
}
