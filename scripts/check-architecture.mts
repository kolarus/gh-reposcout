/** `yarn check:architecture` — structural rules lint can't express (ADR-0022). */
import { checkArchitecture } from './lib/architecture.mts';
import { listRepoFiles, report } from './lib/repo.mts';

report('architecture', checkArchitecture(listRepoFiles()));
