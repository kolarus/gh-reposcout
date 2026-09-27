/*
 * GitHub's language colours (github-linguist) for the most common languages.
 * They're data about the language, not part of our theme, so they live here
 * rather than in the design tokens.
 */
const LANGUAGE_COLORS: Readonly<Record<string, string>> = {
  C: '#555555',
  'C#': '#178600',
  'C++': '#f34b7d',
  Clojure: '#db5855',
  CSS: '#663399',
  Dart: '#00B4AB',
  Dockerfile: '#384d54',
  Elixir: '#6e4a7e',
  Go: '#00ADD8',
  Haskell: '#5e5086',
  HTML: '#e34c26',
  Java: '#b07219',
  JavaScript: '#f1e05a',
  Julia: '#a270ba',
  'Jupyter Notebook': '#DA5B0B',
  Kotlin: '#A97BFF',
  Lua: '#000080',
  MDX: '#fcb32c',
  'Objective-C': '#438eff',
  Perl: '#0298c3',
  PHP: '#4F5D95',
  Python: '#3572A5',
  R: '#198CE7',
  Ruby: '#701516',
  Rust: '#dea584',
  Scala: '#c22d40',
  SCSS: '#c6538c',
  Shell: '#89e051',
  Svelte: '#ff3e00',
  Swift: '#F05138',
  TypeScript: '#3178c6',
  Vue: '#41b883',
  Zig: '#ec915c',
};

/**
 * The language's GitHub colour; unknown languages get a stable colour derived
 * from the name, so the same language always has the same dot.
 */
export function languageColor(language: string): string {
  const known = LANGUAGE_COLORS[language];
  if (known !== undefined) return known;
  let hash = 0;
  for (const char of language) {
    hash = (hash * 31 + (char.codePointAt(0) ?? 0)) % 360;
  }
  return `hsl(${String(hash)}, 45%, 55%)`;
}
