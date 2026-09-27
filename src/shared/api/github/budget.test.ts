import { act, renderHook } from '@testing-library/react-native';

import { CORE_RESERVE, useCoreBudgetLow } from './budget';
import { useRateLimit } from './rateLimit';

const NOW = Date.parse('2026-09-26T12:00:00Z');
const RESET = '2026-09-26T12:30:00Z';

const setCore = (remaining: number, resetAt = RESET) => {
  useRateLimit.setState({
    buckets: { core: { limit: 60, remaining, resetAt } },
  });
};

describe('useCoreBudgetLow', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: NOW });
    useRateLimit.setState({ buckets: {} });
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('is not low while the budget is unknown or above the reserve', async () => {
    const { result, rerender } = await renderHook(() => useCoreBudgetLow());
    expect(result.current).toBeUndefined();

    await act(() => {
      setCore(CORE_RESERVE + 1);
    });
    await rerender({});
    expect(result.current).toBeUndefined();
  });

  it('reports the reset time at or below the reserve', async () => {
    setCore(CORE_RESERVE);
    const { result } = await renderHook(() => useCoreBudgetLow());
    expect(result.current).toBe(RESET);
  });

  it('is not low once the reset time has passed', async () => {
    setCore(0, '2026-09-26T11:59:00Z');
    const { result } = await renderHook(() => useCoreBudgetLow());
    expect(result.current).toBeUndefined();
  });
});
