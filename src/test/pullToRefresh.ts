import { act, screen } from '@testing-library/react-native';
import { isValidElement } from 'react';

const isCallback = (value: unknown): value is () => unknown =>
  typeof value === 'function';

/**
 * Pulls to refresh: calls the screen's RefreshControl as the gesture would.
 * React Native's Jest mock renders the control without its props, so it's
 * read from the scroll view that holds it.
 */
export async function pullToRefresh(): Promise<void> {
  const [scrollView] = screen.container.queryAll(element => {
    const control: unknown = element.props['refreshControl'];
    return isValidElement(control);
  });
  const control: unknown = scrollView?.props['refreshControl'];
  if (
    !isValidElement<{ onRefresh?: unknown }>(control) ||
    !isCallback(control.props.onRefresh)
  ) {
    throw new Error('No RefreshControl on screen.');
  }
  const { onRefresh } = control.props;
  await act(() => {
    onRefresh();
  });
}
