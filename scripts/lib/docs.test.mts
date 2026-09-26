import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { checkAdrs, checkLinks, type MarkdownFile } from './docs.mts';

const adr = (n: number, status = 'accepted'): MarkdownFile => {
  const id = String(n).padStart(4, '0');
  return {
    path: `docs/adr/${id}-title-${id}.md`,
    content: `# ${id}. Title\n\n- Status: ${status}\n- Date: 2026-09-26\n`,
  };
};
const index = (...ns: number[]): MarkdownFile => ({
  path: 'docs/adr/README.md',
  content: ns
    .map(n => {
      const id = String(n).padStart(4, '0');
      return `- [${id}](${id}-title-${id}.md)`;
    })
    .join('\n'),
});

describe('checkAdrs', () => {
  it('accepts a consistent ADR set', () => {
    assert.deepEqual(
      checkAdrs([
        adr(1),
        adr(2, 'superseded by [0001](0001-title-0001.md)'),
        index(1, 2),
      ]),
      [],
    );
  });
  it('rejects gaps in numbering', () => {
    assert.match(
      checkAdrs([adr(1), adr(3), index(1, 3)]).join('\n'),
      /contiguous/,
    );
  });
  it('rejects invalid status', () => {
    assert.match(checkAdrs([adr(1, 'maybe'), index(1)]).join('\n'), /Status/);
  });
  it('rejects superseded-by pointing nowhere', () => {
    assert.match(
      checkAdrs([adr(1, 'superseded by [0009](0009-x.md)'), index(1)]).join(
        '\n',
      ),
      /doesn't exist/,
    );
  });
  it('rejects ADRs missing from the index', () => {
    assert.match(
      checkAdrs([adr(1), adr(2), index(1)]).join('\n'),
      /doesn't link 0002/,
    );
  });
});

describe('checkLinks', () => {
  const files: MarkdownFile[] = [
    {
      path: 'README.md',
      content:
        '[ok](docs/adr/README.md) [anchor](#top) [web](https://x.dev) [bad](docs/missing.md) `[code](nope.md)`',
    },
  ];
  it('reports only broken relative links', () => {
    const violations = checkLinks(files, p => p === 'docs/adr/README.md');
    assert.deepEqual(violations, ['README.md: broken link "docs/missing.md".']);
  });
});
