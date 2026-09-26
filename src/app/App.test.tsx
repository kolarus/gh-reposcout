import { render, screen } from '@testing-library/react-native';

import App from './App';

describe('App', () => {
  it('starts on the Search tab with Saved and Settings available', async () => {
    await render(<App />);

    expect(
      await screen.findByRole('header', { name: 'Search is coming next' }),
    ).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: /Saved/ })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: /Settings/ })).toBeOnTheScreen();
  });
});
