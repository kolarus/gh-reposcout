#!/usr/bin/env bash
# Shared settings for the end-to-end scripts (ADR-0021). Sourced, not run.

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SDK="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-$HOME/Library/Android/sdk}}"
export ANDROID_HOME="$SDK"
export PATH="$SDK/platform-tools:$PATH"
# Maestro and Gradle need Java 17 (ADR-0002); use the system one if it's 17.
if [[ -z "${JAVA_HOME:-}" && -x /usr/libexec/java_home ]]; then
  JAVA_HOME="$(/usr/libexec/java_home -v 17 2>/dev/null || true)"
  export JAVA_HOME
fi

MAESTRO="${MAESTRO:-$HOME/.maestro/bin/maestro}"
APP_ID="com.bohdanmorozov.reposcout"

AVD_NAME="RepoScout-E2E"
case "$(uname -m)" in
  arm64 | aarch64) ANDROID_ABI="arm64-v8a" ;;
  *) ANDROID_ABI="x86_64" ;;
esac
ANDROID_IMAGE="system-images;android-36;google_apis_ps16k;$ANDROID_ABI"
# Its own port, so it never collides with an everyday emulator on 5554.
ANDROID_PORT=5580
ANDROID_SERIAL="emulator-$ANDROID_PORT"

IOS_DEVICE_NAME="RepoScout-E2E"
IOS_DEVICE_TYPE="com.apple.CoreSimulator.SimDeviceType.iPhone-17"

ios_udid() {
  xcrun simctl list devices --json | node -e '
    const { devices } = JSON.parse(require("fs").readFileSync(0, "utf8"));
    const match = Object.values(devices).flat().find(d => d.name === process.argv[1]);
    process.stdout.write(match?.udid ?? "");
  ' "$IOS_DEVICE_NAME"
}
