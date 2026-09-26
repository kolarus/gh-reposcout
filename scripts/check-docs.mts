/** `yarn check:docs` — ADR numbering/status/index and relative links (ADR-0001, ADR-0022). */
import { checkAdrs, checkLinks } from './lib/docs.mts';
import {
  listRepoFiles,
  readRepoFile,
  repoPathExists,
  report,
} from './lib/repo.mts';

const markdown = listRepoFiles()
  .filter(f => f.endsWith('.md'))
  .map(f => ({ path: f, content: readRepoFile(f) }));

report('docs', [
  ...checkAdrs(markdown),
  ...checkLinks(markdown, repoPathExists),
]);
