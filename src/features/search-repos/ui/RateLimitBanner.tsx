import { strings } from '@/shared/i18n';
import { formatCountdown, secondsUntil, useNow } from '@/shared/lib';
import { Banner } from '@/shared/ui';

/**
 * Live countdown to the search budget's reset (ADR-0012). Hides itself when
 * the time passes; the search resumes on its own (`useRepoSearch`).
 */
export function RateLimitBanner({ resetAt }: { resetAt: string }) {
  const now = useNow(1000);
  const seconds = secondsUntil(resetAt, now);
  if (seconds === 0) return null;
  return (
    <Banner
      tone="warning"
      icon="clock"
      message={strings.search.rateLimitBanner(formatCountdown(seconds))}
      accessibilityMessage={strings.search.errors.rateLimitedMessage}
    />
  );
}
