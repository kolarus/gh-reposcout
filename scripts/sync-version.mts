/**
 * `yarn release:prepare <x.y.z>` — set the app version everywhere (ADR-0016).
 * Without an argument, re-syncs the copies from package.json.
 * Android needs nothing: Gradle reads package.json at build time.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { readPackageJson, ROOT } from './lib/repo.mts';
import {
  GENERATED_VERSION_FILE,
  SEMVER,
  renderVersionModule,
  setMarketingVersion,
} from './lib/version.mts';

const file = (p: string) => path.join(ROOT, p);
const packageJsonPath = file('package.json');
const pkg = readPackageJson();

const requested = process.argv[2];
if (requested !== undefined) {
  if (!SEMVER.test(requested)) {
    console.error(
      `"${requested}" is not a semantic version (x.y.z or x.y.z-pre).`,
    );
    process.exit(1);
  }
  pkg.version = requested;
  writeFileSync(packageJsonPath, `${JSON.stringify(pkg, null, 2)}\n`);
}

const pbxprojPath = file('ios/RepoScout.xcodeproj/project.pbxproj');
writeFileSync(
  pbxprojPath,
  setMarketingVersion(readFileSync(pbxprojPath, 'utf8'), pkg.version),
);
writeFileSync(file(GENERATED_VERSION_FILE), renderVersionModule(pkg.version));

console.log(
  `Version ${pkg.version}: package.json, iOS MARKETING_VERSION and ${GENERATED_VERSION_FILE} are in sync.`,
);
