import { fireEvent, render, screen } from '@testing-library/react-native';

import { ListRow } from './ListRow';
import { ListSection } from './ListSection';

describe('ListRow', () => {
  it('reads label, description and value as one element', async () => {
    const onPress = jest.fn();
    await render(
      <ListRow
        label="Clear recent searches"
        description="3 searches"
        onPress={onPress}
      />,
    );

    await fireEvent.press(
      screen.getByRole('button', { name: 'Clear recent searches, 3 searches' }),
    );
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('ignores presses while disabled', async () => {
    const onPress = jest.fn();
    await render(<ListRow label="Clear" onPress={onPress} disabled />);
    const row = screen.getByRole('button', { name: 'Clear' });

    await fireEvent.press(row);

    expect(row).toBeDisabled();
    expect(onPress).not.toHaveBeenCalled();
  });

  it('is static without onPress, and a link when it opens a page', async () => {
    await render(
      <ListSection title="About">
        <ListRow label="Version" value="1.2.3" />
        {false}
        <ListRow label="Source code" role="link" onPress={jest.fn()} />
      </ListSection>,
    );

    expect(screen.getByRole('header', { name: 'About' })).toBeOnTheScreen();
    expect(screen.getByLabelText('Version, 1.2.3')).toBeOnTheScreen();
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByRole('link', { name: 'Source code' })).toBeOnTheScreen();
  });
});
