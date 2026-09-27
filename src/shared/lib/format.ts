import { strings } from '@/shared/i18n';

/*
 * Our own formatters (ADR-0019): Hermes has no Intl.RelativeTimeFormat, and
 * compact number notation differs between platforms. Pure and deterministic.
 */

const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

/** 999 → "999", 1234 → "1.2k", 12345 → "12.3k", 123456 → "123k", 1234567 → "1.2M". */
export function formatCompactNumber(value: number): string {
  const sign = value < 0 ? '-' : '';
  const abs = Math.abs(value);
  if (abs < 1000) return `${sign}${String(Math.round(abs))}`;

  const units = [
    { size: 1_000_000, suffix: strings.format.millionSuffix },
    { size: 1_000, suffix: strings.format.thousandSuffix },
  ];
  for (const [index, { size, suffix }] of units.entries()) {
    if (abs < size) continue;
    const scaled = abs / size;
    // One decimal below 100 ("12.3k"), whole numbers above ("123k").
    const rounded =
      scaled < 100 ? Math.round(scaled * 10) / 10 : Math.round(scaled);
    // 999_950 would round to "1000k": promote it to the next unit instead.
    const larger = units[index - 1];
    if (rounded >= 1000 && larger !== undefined) {
      return `${sign}${String(Math.round((abs / larger.size) * 10) / 10)}${larger.suffix}`;
    }
    return `${sign}${String(rounded)}${suffix}`;
  }
  return `${sign}${String(abs)}`;
}

/** "just now", "5m ago", "3h ago", "4d ago", "2mo ago", "1y ago". Future dates → "just now". */
export function formatRelativeTime(
  isoDate: string,
  now: Date = new Date(),
): string {
  const time = Date.parse(isoDate);
  if (Number.isNaN(time)) return '';
  const seconds = Math.max(0, Math.round((now.getTime() - time) / 1000));

  if (seconds < 45) return strings.format.justNow;
  if (seconds < 45 * MINUTE)
    return strings.format.minutesAgo(Math.max(1, Math.round(seconds / MINUTE)));
  if (seconds < 22 * HOUR)
    return strings.format.hoursAgo(Math.max(1, Math.round(seconds / HOUR)));
  if (seconds < 26 * DAY)
    return strings.format.daysAgo(Math.max(1, Math.round(seconds / DAY)));
  if (seconds < 11 * MONTH)
    return strings.format.monthsAgo(Math.max(1, Math.round(seconds / MONTH)));
  return strings.format.yearsAgo(Math.max(1, Math.round(seconds / YEAR)));
}

/** Whole seconds from `now` until `isoDate`; 0 once it has passed. */
export function secondsUntil(isoDate: string, now: number): number {
  const time = Date.parse(isoDate);
  if (Number.isNaN(time)) return 0;
  return Math.max(0, Math.ceil((time - now) / 1000));
}

/** Countdown label: 5 → "0:05", 65 → "1:05", 3600 → "60:00". */
export function formatCountdown(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / MINUTE);
  const seconds = safe % MINUTE;
  return `${String(minutes)}:${String(seconds).padStart(2, '0')}`;
}

// Created once: constructing an Intl formatter is expensive, calling it is cheap.
const integerFormat = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 0,
});

/** Grouped integer for counts, e.g. "12,345" (device locale). */
export function formatInteger(value: number): string {
  return integerFormat.format(value);
}
