import { fireEvent, render, screen } from '@testing-library/react-native';

import { SegmentedControl } from './SegmentedControl';

const SEGMENTS = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
] as const;

describe('SegmentedControl', () => {
  it('reads as radio buttons and reports a new choice once', async () => {
    const onChange = jest.fn();
    await render(
      <SegmentedControl
        segments={SEGMENTS}
        value="light"
        onChange={onChange}
        accessibilityLabel="Theme"
      />,
    );

    expect(screen.getByRole('radio', { name: 'Light' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Dark' })).not.toBeChecked();

    await fireEvent.press(screen.getByRole('radio', { name: 'Light' }));
    await fireEvent.press(screen.getByRole('radio', { name: 'Dark' }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('dark');
  });
});
