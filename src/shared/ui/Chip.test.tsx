import { fireEvent, render, screen } from '@testing-library/react-native';

import { Chip } from './Chip';

describe('Chip', () => {
  it('exposes its selected state and reports presses', async () => {
    const onPress = jest.fn();
    await render(<Chip label="Stars" selected onPress={onPress} />);
    const chip = screen.getByRole('button', { name: 'Stars' });

    await fireEvent.press(chip);

    expect(chip).toBeSelected();
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders as static text when it has no onPress', async () => {
    await render(<Chip label="react-native" />);

    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByText('react-native')).toBeOnTheScreen();
  });
});
