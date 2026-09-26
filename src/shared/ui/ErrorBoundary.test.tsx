import { fireEvent, render, screen } from '@testing-library/react-native';
import { useState } from 'react';

import { monitoring } from '@/shared/monitoring';

import { Button } from './Button';
import { ErrorBoundary } from './ErrorBoundary';
import { ErrorFallback } from './ErrorFallback';
import { Text } from './Text';

let shouldThrow = true;
function Flaky() {
  if (shouldThrow) throw new Error('boom');
  return <Text>recovered</Text>;
}

function Harness() {
  const [, rerender] = useState(0);
  return (
    <>
      <ErrorBoundary fallback={reset => <ErrorFallback onReset={reset} />}>
        <Flaky />
      </ErrorBoundary>
      <Button
        label="noop"
        onPress={() => {
          rerender(n => n + 1);
        }}
      />
    </>
  );
}

describe('ErrorBoundary', () => {
  it('shows the fallback, reports the error, and recovers on retry', async () => {
    const capture = jest
      .spyOn(monitoring, 'captureException')
      .mockImplementation(() => undefined);
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    await render(<Harness />);
    expect(
      screen.getByRole('header', { name: 'Something went wrong' }),
    ).toBeOnTheScreen();
    expect(capture).toHaveBeenCalledWith(expect.any(Error), {
      source: 'error-boundary',
    });

    shouldThrow = false;
    await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    expect(screen.getByText('recovered')).toBeOnTheScreen();

    capture.mockRestore();
    consoleError.mockRestore();
  });
});
