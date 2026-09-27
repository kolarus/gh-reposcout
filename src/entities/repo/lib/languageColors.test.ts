import { languageColor } from './languageColors';

describe('languageColor', () => {
  it("uses GitHub's colour for known languages", () => {
    expect(languageColor('TypeScript')).toBe('#3178c6');
    expect(languageColor('C++')).toBe('#f34b7d');
  });

  it('gives unknown languages a stable derived colour', () => {
    const color = languageColor('Brainfuck');
    expect(color).toMatch(/^hsl\(\d{1,3}, 45%, 55%\)$/);
    expect(languageColor('Brainfuck')).toBe(color);
    expect(languageColor('Befunge')).not.toBe(color);
  });
});
