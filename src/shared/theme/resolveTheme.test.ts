import { resolveTheme } from './resolveTheme';
import { darkTheme, lightTheme } from './themes';

describe('resolveTheme', () => {
  it.each([
    ['light', 'dark', lightTheme],
    ['dark', 'light', darkTheme],
    ['system', 'dark', darkTheme],
    ['system', 'light', lightTheme],
    ['system', null, lightTheme],
  ] as const)(
    'preference %s with system %s',
    (preference, system, expected) => {
      expect(resolveTheme(preference, system)).toBe(expected);
    },
  );
});
