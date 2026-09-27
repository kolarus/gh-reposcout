import { act, renderHook } from '@testing-library/react-native';

import { useDebouncedValue } from './useDebouncedValue';
import { useNow } from './useNow';

describe('useDebouncedValue', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('updates only after the value has been still for the delay', async () => {
    const { result, rerender } = await renderHook(
      (value: string) => useDebouncedValue(value, 400),
      { initialProps: 'a' },
    );

    await rerender('ab');
    await act(() => {
      jest.advanceTimersByTime(399);
    });
    await rerender('abc');
    await act(() => {
      jest.advanceTimersByTime(399);
    });
    expect(result.current).toBe('a');

    await act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(result.current).toBe('abc');
  });
});

describe('useNow', () => {
  it('ticks at the given interval', async () => {
    jest.useFakeTimers({ now: 1_000_000 });
    const { result } = await renderHook(() => useNow(60_000));
    expect(result.current).toBe(1_000_000);

    await act(() => {
      jest.advanceTimersByTime(60_000);
    });

    expect(result.current).toBe(1_060_000);
    jest.useRealTimers();
  });
});
