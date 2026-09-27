import {
  formatCompactNumber,
  formatCountdown,
  formatInteger,
  formatRelativeTime,
  runAt,
  secondsUntil,
} from '@/shared/lib';

describe('formatCompactNumber', () => {
  it.each([
    [0, '0'],
    [999, '999'],
    [1000, '1k'],
    [1234, '1.2k'],
    [12_345, '12.3k'],
    [99_950, '100k'],
    [123_456, '123k'],
    [999_499, '999k'],
    [999_950, '1M'],
    [1_234_567, '1.2M'],
    [-1500, '-1.5k'],
  ])('%d → %s', (value, expected) => {
    expect(formatCompactNumber(value)).toBe(expected);
  });
});

describe('formatRelativeTime', () => {
  const now = new Date('2026-09-26T12:00:00Z');
  const ago = (seconds: number) =>
    new Date(now.getTime() - seconds * 1000).toISOString();

  it.each([
    [10, 'just now'],
    [44, 'just now'],
    [60, '1m ago'],
    [44 * 60, '44m ago'],
    [45 * 60, '1h ago'],
    [21 * 3600, '21h ago'],
    [22 * 3600, '1d ago'],
    [3 * 86_400, '3d ago'],
    [26 * 86_400, '1mo ago'],
    [200 * 86_400, '7mo ago'],
    [400 * 86_400, '1y ago'],
  ])('%d seconds ago → %s', (seconds, expected) => {
    expect(formatRelativeTime(ago(seconds), now)).toBe(expected);
  });

  it('treats future dates as just now and invalid dates as empty', () => {
    expect(formatRelativeTime('2027-01-01T00:00:00Z', now)).toBe('just now');
    expect(formatRelativeTime('not a date', now)).toBe('');
  });
});

describe('formatInteger', () => {
  it('groups thousands', () => {
    expect(formatInteger(12_345)).toBe('12,345');
  });
});

describe('secondsUntil', () => {
  const now = Date.parse('2026-09-26T12:00:00Z');

  it('rounds partial seconds up and stops at zero', () => {
    expect(secondsUntil('2026-09-26T12:00:30.200Z', now)).toBe(31);
    expect(secondsUntil('2026-09-26T11:59:00Z', now)).toBe(0);
    expect(secondsUntil('not a date', now)).toBe(0);
  });
});

describe('formatCountdown', () => {
  it.each([
    [0, '0:00'],
    [5, '0:05'],
    [65, '1:05'],
    [3600, '60:00'],
    [-3, '0:00'],
  ])('%d s → %s', (seconds, expected) => {
    expect(formatCountdown(seconds)).toBe(expected);
  });
});

describe('runAt', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('runs after the date plus the margin, unless cancelled', () => {
    jest.useFakeTimers({ now: Date.parse('2026-09-26T12:00:00Z') });
    const callback = jest.fn();
    const cancelled = jest.fn();

    runAt('2026-09-26T12:00:10Z', callback, 1000);
    runAt('2026-09-26T12:00:10Z', cancelled)();
    jest.advanceTimersByTime(10_999);
    expect(callback).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(cancelled).not.toHaveBeenCalled();
  });

  it('runs straight away for a date already past', () => {
    jest.useFakeTimers({ now: Date.parse('2026-09-26T12:00:00Z') });
    const callback = jest.fn();
    runAt('2026-09-26T11:00:00Z', callback);
    jest.advanceTimersByTime(0);
    expect(callback).toHaveBeenCalledTimes(1);
  });
});
