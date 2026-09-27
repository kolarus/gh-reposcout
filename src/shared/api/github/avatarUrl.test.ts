import { sizedAvatarUrl } from './avatarUrl';

describe('sizedAvatarUrl', () => {
  it.each([
    [
      'https://avatars.githubusercontent.com/u/69631?v=4',
      120,
      'https://avatars.githubusercontent.com/u/69631?v=4&s=120',
    ],
    [
      'https://avatars.githubusercontent.com/u/69631',
      80,
      'https://avatars.githubusercontent.com/u/69631?s=80',
    ],
    [
      'https://avatars.githubusercontent.com/u/69631?s=460&v=4',
      120,
      'https://avatars.githubusercontent.com/u/69631?s=120&v=4',
    ],
    // Physical pixels are fractional on some Android densities.
    ['https://a.test/u/1', 52.5, 'https://a.test/u/1?s=53'],
  ])('%s at %d px → %s', (url, px, expected) => {
    expect(sizedAvatarUrl(url, px)).toBe(expected);
  });
});
