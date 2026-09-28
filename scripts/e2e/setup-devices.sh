#!/usr/bin/env bash
# `yarn e2e:setup`: creates the dedicated end-to-end devices (ADR-0021), apart
# from your everyday emulator and simulators. Safe to run repeatedly.
#
#   Android: the `RepoScout-E2E` emulator, Android 16 with 16 KB memory pages
#            (ADR-0023: every run proves the app works on such devices), a
#            mid-range profile (4 GB RAM).
#   iOS:     the `RepoScout-E2E` simulator, an iPhone 17 on the newest
#            installed iOS 26 runtime.
set -euo pipefail

source "$(dirname "$0")/common.sh"

set_avd_config() { # <key> <value>: replaces the key, or adds it
  local config="$HOME/.android/avd/$AVD_NAME.avd/config.ini"
  grep -v "^$1=" "$config" >"$config.tmp" || true
  echo "$1=$2" >>"$config.tmp"
  mv "$config.tmp" "$config"
}

android_setup() {
  local image_dir="$SDK/system-images/android-36/google_apis_ps16k/$ANDROID_ABI"
  if [[ ! -d "$image_dir" ]]; then
    echo "Installing ${ANDROID_IMAGE}…"
    # The Android CLI replaces the deprecated sdkmanager (ADR-0021).
    if [[ -x "$SDK/cmdline-tools/latest/bin/android" ]]; then
      "$SDK/cmdline-tools/latest/bin/android" sdk install "${ANDROID_IMAGE//;//}"
    else
      yes | "$SDK/cmdline-tools/latest/bin/sdkmanager" "$ANDROID_IMAGE" >/dev/null
    fi
  fi

  if "$SDK/emulator/emulator" -list-avds | grep -qx "$AVD_NAME"; then
    echo "✓ Android: $AVD_NAME exists"
    return
  fi
  echo no | "$SDK/cmdline-tools/latest/bin/avdmanager" create avd \
    --name "$AVD_NAME" --package "$ANDROID_IMAGE" --device pixel_7 >/dev/null
  # Mid-range profile, and a clean boot every time (no snapshots).
  set_avd_config hw.ramSize 4096
  set_avd_config hw.keyboard yes
  set_avd_config fastboot.forceColdBoot yes
  echo "✓ Android: created $AVD_NAME ($ANDROID_IMAGE)"
}

ios_setup() {
  if ! command -v xcrun >/dev/null; then
    echo "• iOS: Xcode not found, skipped"
    return
  fi
  if [[ -n "$(ios_udid)" ]]; then
    echo "✓ iOS: $IOS_DEVICE_NAME exists"
    return
  fi
  local runtime
  runtime=$(xcrun simctl list runtimes --json | node -e '
    const { runtimes } = JSON.parse(require("fs").readFileSync(0, "utf8"));
    const ios26 = runtimes
      .filter(r => r.isAvailable && r.identifier.includes(".iOS-26-"))
      .sort((a, b) => a.version.localeCompare(b.version, undefined, { numeric: true }));
    process.stdout.write(ios26.at(-1)?.identifier ?? "");
  ')
  if [[ -z "$runtime" ]]; then
    echo "✗ iOS: no iOS 26 simulator runtime installed (Xcode → Settings → Components)" >&2
    exit 1
  fi
  xcrun simctl create "$IOS_DEVICE_NAME" "$IOS_DEVICE_TYPE" "$runtime" >/dev/null
  echo "✓ iOS: created $IOS_DEVICE_NAME ($runtime)"
}

android_setup
ios_setup
