import { toSafeHttpsUrl } from './safeUrl';

describe('toSafeHttpsUrl', () => {
  it.each([
    ['https://reactnative.dev', 'https://reactnative.dev'],
    ['  https://example.com/docs  ', 'https://example.com/docs'],
    // A bare domain, as owners often type it.
    ['reactnative.dev', 'https://reactnative.dev'],
  ])('keeps %j as %j', (raw, expected) => {
    expect(toSafeHttpsUrl(raw)).toBe(expected);
  });

  it.each([
    null,
    undefined,
    '',
    '   ',
    'http://insecure.test',
    'javascript:alert(1)',
    'ftp://files.test',
    'mailto:me@test.dev',
    'https://',
    'https:// spaces.test',
  ])('rejects %j', raw => {
    expect(toSafeHttpsUrl(raw)).toBeUndefined();
  });
});
