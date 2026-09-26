import { render, screen } from '@testing-library/react-native';

import { Avatar, initialsOf } from './Avatar';

describe('initialsOf', () => {
  it.each([
    ['facebook', 'F'],
    ['react native', 'RN'],
    ['react-native-community', 'RN'],
    ['', '?'],
  ])('%s → %s', (name, expected) => {
    expect(initialsOf(name)).toBe(expected);
  });
});

describe('Avatar', () => {
  it('shows initials and no image without a uri', async () => {
    await render(<Avatar name="Octo Cat" />);

    expect(
      screen.getByText('OC', { includeHiddenElements: true }),
    ).toBeOnTheScreen();
    expect(
      screen.queryByTestId('avatar-image', { includeHiddenElements: true }),
    ).toBeNull();
  });

  it('renders the image over the initials when a uri is given', async () => {
    await render(
      <Avatar name="facebook" uri="https://example.com/a.png?s=80" />,
    );

    expect(
      screen.getByTestId('avatar-image', { includeHiddenElements: true }),
    ).toBeOnTheScreen();
  });
});
