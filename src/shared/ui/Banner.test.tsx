import { fireEvent, render, screen } from '@testing-library/react-native';

import { Banner } from './Banner';

describe('Banner', () => {
  it('is announced as an alert and supports an action', async () => {
    const onPress = jest.fn();
    await render(
      <Banner
        tone="danger"
        icon="cloud-offline"
        message="You're offline"
        action={{ label: 'Retry', onPress }}
      />,
    );

    expect(
      screen.getByRole('alert', { name: "You're offline" }),
    ).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Retry' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
