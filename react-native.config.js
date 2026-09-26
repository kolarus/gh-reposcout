/**
 * React Native CLI configuration.
 *
 * `automaticPodsInstallation`: `yarn ios` installs CocoaPods (through Bundler)
 * whenever native dependencies changed, so `yarn install && yarn ios` works
 * without a slow `postinstall` step (ADR-0003). `yarn pods` is the manual fallback.
 */
module.exports = {
  project: {
    ios: {
      automaticPodsInstallation: true,
    },
  },
};
