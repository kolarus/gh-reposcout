import { fireEvent, render, screen } from '@testing-library/react-native';

import { Button } from './Button';

describe('Button', () => {
  it('is an accessible button that reports presses', async () => {
    const onPress = jest.fn();
    await render(<Button label="Retry" onPress={onPress} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Retry' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('ignores presses and reports the disabled state when disabled', async () => {
    const onPress = jest.fn();
    await render(<Button label="Retry" onPress={onPress} disabled />);
    const button = screen.getByRole('button', { name: 'Retry' });

    await fireEvent.press(button);

    expect(onPress).not.toHaveBeenCalled();
    expect(button).toBeDisabled();
  });
});
