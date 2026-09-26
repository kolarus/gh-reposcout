import { isValidRepoRef } from './repoRef';

describe('isValidRepoRef', () => {
  it.each([
    ['facebook', 'react-native'],
    ['react-native-community', 'cli'],
    ['a', 'b'],
    ['user123', 'repo.name_with-chars'],
  ])('accepts %s/%s', (owner, name) => {
    expect(isValidRepoRef({ owner, name })).toBe(true);
  });

  it.each([
    ['', 'repo'],
    ['-leading', 'repo'],
    ['trailing-', 'repo'],
    ['double--hyphen', 'repo'],
    ['a'.repeat(40), 'repo'],
    ['owner', ''],
    ['owner', '..'],
    ['owner', 'has space'],
    ['owner', 'a/b'],
  ])('rejects %s/%s', (owner, name) => {
    expect(isValidRepoRef({ owner, name })).toBe(false);
  });
});
