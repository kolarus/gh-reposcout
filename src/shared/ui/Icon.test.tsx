import { render, screen } from '@testing-library/react-native';

import { Icon } from './Icon';

describe('Icon', () => {
  it('is hidden from screen readers when decorative', async () => {
    await render(<Icon name="star" />);

    expect(screen.queryByRole('image')).toBeNull();
  });

  it('is announced when it carries meaning on its own', async () => {
    await render(<Icon name="star" accessibilityLabel="Stars" />);

    expect(screen.getByRole('image', { name: 'Stars' })).toBeOnTheScreen();
  });
});
