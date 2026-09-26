import { render, screen } from '@testing-library/react-native';

import App from './App';

describe('App', () => {
  it('renders the UI catalog as the placeholder root', async () => {
    await render(<App />);

    expect(
      screen.getByRole('header', { name: 'UI catalog' }),
    ).toBeOnTheScreen();
  });
});
