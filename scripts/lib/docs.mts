/**
 * Documentation integrity checks (ADR-0001, ADR-0022). Pure functions over
 * in-memory markdown so they're easy to test; I/O lives in check-docs.mts.
 */
import path from 'node:path';

export interface MarkdownFile {
  path: string; // repo-relative
  content: string;
}

const ADR_FILE = /^docs\/adr\/(\d{4})-[a-z0-9-]+\.md$/;
const STATUS =
  /^- Status: (proposed|accepted|deprecated|superseded by \[(\d{4})\]\(([^)]+)\))(?=\s|$)/m;
const LINK = /\[[^\]]*\]\(([^)\s]+)\)/g;

export function checkAdrs(files: readonly MarkdownFile[]): string[] {
  const violations: string[] = [];
  const adrs = files
    .map(f => ({ file: f, match: ADR_FILE.exec(f.path) }))
    .filter(
      (a): a is { file: MarkdownFile; match: RegExpExecArray } =>
        a.match !== null,
    )
    .map(a => ({ ...a.file, number: Number(a.match[1]) }))
    .sort((a, b) => a.number - b.number);

  adrs.forEach((adr, i) => {
    if (adr.number !== i + 1) {
      violations.push(
        `${adr.path}: ADR numbers must be contiguous from 0001 (expected ${String(i + 1).padStart(4, '0')}).`,
      );
    }
    const heading = /^# (\d{4})\. .+$/m.exec(adr.content);
    if (heading?.[1] === undefined || Number(heading[1]) !== adr.number) {
      violations.push(
        `${adr.path}: first heading must be "# ${String(adr.number).padStart(4, '0')}. Title".`,
      );
    }
    const status = STATUS.exec(adr.content);
    if (status === null) {
      violations.push(`${adr.path}: missing or invalid "- Status:" line.`);
    } else if (
      status[2] !== undefined &&
      !adrs.some(a => a.number === Number(status[2]))
    ) {
      violations.push(
        `${adr.path}: superseded by ADR-${status[2]}, which doesn't exist.`,
      );
    }
  });

  const index = files.find(f => f.path === 'docs/adr/README.md');
  if (index === undefined) {
    violations.push('docs/adr/README.md: ADR index is missing.');
  } else {
    for (const adr of adrs) {
      const name = path.basename(adr.path);
      if (!index.content.includes(`(${name})`)) {
        violations.push(`docs/adr/README.md: index doesn't link ${name}.`);
      }
    }
  }
  return violations;
}

export function checkLinks(
  files: readonly MarkdownFile[],
  exists: (repoPath: string) => boolean,
): string[] {
  const violations: string[] = [];
  for (const file of files) {
    const withoutCode = file.content
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`[^`]*`/g, '');
    for (const [, target] of withoutCode.matchAll(LINK)) {
      if (target === undefined || /^(https?:|mailto:|#)/.test(target)) continue;
      const relative = decodeURIComponent(target.split('#')[0] ?? '');
      if (relative === '') continue;
      const resolved = path.posix.normalize(
        path.posix.join(path.posix.dirname(file.path), relative),
      );
      if (!exists(resolved)) {
        violations.push(`${file.path}: broken link "${target}".`);
      }
    }
  }
  return violations;
}
