import { fireEvent, render, screen } from '@testing-library/react-native';

import { StateView } from './StateView';

describe('StateView', () => {
  it('renders a heading, message and working action', async () => {
    const onPress = jest.fn();
    await render(
      <StateView
        icon="search"
        title="No results"
        message="Try another term"
        action={{ label: 'Clear search', onPress }}
      />,
    );

    expect(
      screen.getByRole('header', { name: 'No results' }),
    ).toBeOnTheScreen();
    expect(screen.getByText('Try another term')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Clear search' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
