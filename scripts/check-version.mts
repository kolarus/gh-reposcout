/** `yarn check:version` — package.json, iOS project and generated module agree (ADR-0016). */
import {
  readPackageJson,
  readRepoFile,
  repoPathExists,
  report,
} from './lib/repo.mts';
import { checkVersions, GENERATED_VERSION_FILE } from './lib/version.mts';

const { version } = readPackageJson();

report(
  'version',
  checkVersions({
    packageVersion: version,
    pbxproj: readRepoFile('ios/RepoScout.xcodeproj/project.pbxproj'),
    generatedModule: repoPathExists(GENERATED_VERSION_FILE)
      ? readRepoFile(GENERATED_VERSION_FILE)
      : undefined,
  }),
);
