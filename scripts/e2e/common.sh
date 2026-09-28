#!/usr/bin/env bash
# Shared settings and the dedicated Android emulator's lifecycle, for the
# end-to-end (ADR-0021) and performance (ADR-0017) scripts. Sourced, not run.

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
RELEASE_APK="$ROOT/android/app/build/outputs/apk/release/app-release.apk"

IOS_DEVICE_NAME="RepoScout-E2E"
IOS_DEVICE_TYPE="com.apple.CoreSimulator.SimDeviceType.iPhone-17"

ios_udid() {
  xcrun simctl list devices --json | node -e '
    const { devices } = JSON.parse(require("fs").readFileSync(0, "utf8"));
    const match = Object.values(devices).flat().find(d => d.name === process.argv[1]);
    process.stdout.write(match?.udid ?? "");
  ' "$IOS_DEVICE_NAME"
}

# ------------------------------------------------------- Android emulator --

# <log file> <headed: true|false> [emulator options…]: boots the dedicated
# emulator and waits until Android has finished booting.
android_boot() {
  if ! "$SDK/emulator/emulator" -list-avds | grep -qx "$AVD_NAME"; then
    echo "No $AVD_NAME emulator: run yarn e2e:setup first." >&2
    exit 1
  fi
  local log="$1" window=(-no-window)
  if [[ "$2" == "true" ]]; then window=(); fi
  shift 2
  echo "▶ Booting $AVD_NAME ($ANDROID_SERIAL)…"
  # ${a[@]+…}: an empty array is "unbound" under set -u in macOS's bash 3.2.
  "$SDK/emulator/emulator" -avd "$AVD_NAME" -port "$ANDROID_PORT" \
    ${window[@]+"${window[@]}"} -no-audio -no-boot-anim -no-snapshot-save "$@" \
    >"$log" 2>&1 &
  adb -s "$ANDROID_SERIAL" wait-for-device
  # Polling a device, not a test: nothing else says when boot has finished.
  until [[ "$(adb -s "$ANDROID_SERIAL" shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" == "1" ]]; do
    sleep 2
  done
}

# <scale>: 0 turns Android's animations off, 1 on. The emulator keeps the
# setting across boots, so every run sets it.
android_animations() {
  local key
  for key in window_animation_scale transition_animation_scale animator_duration_scale; do
    adb -s "$ANDROID_SERIAL" shell settings put global "$key" "$1"
  done
}

# Builds the release APK for the emulator's CPU only and installs it.
android_install_release() {
  echo "▶ Building the release APK ($ANDROID_ABI)…"
  (cd "$ROOT/android" && ./gradlew app:assembleRelease -q \
    -PreactNativeArchitectures="$ANDROID_ABI")
  adb -s "$ANDROID_SERIAL" install -r "$RELEASE_APK" >/dev/null
}

android_shutdown() {
  adb -s "$ANDROID_SERIAL" emu kill >/dev/null 2>&1 || true
}
