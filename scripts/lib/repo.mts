/** Small I/O helpers shared by the check scripts. */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

export const ROOT = path.resolve(import.meta.dirname, '..', '..');

/** Tracked + untracked files, honouring .gitignore (repo-relative, POSIX). */
export function listRepoFiles(): string[] {
  const output = execFileSync(
    'git',
    ['ls-files', '--cached', '--others', '--exclude-standard'],
    { cwd: ROOT, encoding: 'utf8' },
  );
  return output
    .split('\n')
    .filter(f => f !== '' && existsSync(path.join(ROOT, f)));
}

export const readRepoFile = (file: string): string =>
  readFileSync(path.join(ROOT, file), 'utf8');

export const repoPathExists = (file: string): boolean =>
  existsSync(path.join(ROOT, file));

/** package.json, parsed with a runtime check instead of a type assertion (ADR-0004). */
export function readPackageJson(): Record<string, unknown> & {
  version: string;
} {
  const parsed: unknown = JSON.parse(readRepoFile('package.json'));
  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('version' in parsed) ||
    typeof parsed.version !== 'string'
  ) {
    throw new Error('package.json has no string "version" field.');
  }
  return { ...parsed, version: parsed.version };
}

export function report(name: string, violations: readonly string[]): void {
  if (violations.length === 0) {
    console.log(`✓ ${name}`);
    return;
  }
  console.error(`✗ ${name}: ${String(violations.length)} problem(s)`);
  for (const v of violations) console.error(`  - ${v}`);
  process.exitCode = 1;
}
