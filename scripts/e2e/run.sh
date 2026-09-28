#!/usr/bin/env bash
# `yarn e2e:android` / `yarn e2e:ios` [--keep-alive] [--headed] [--record]
# (ADR-0021): boots the dedicated device headless, installs the release build,
# runs the Maestro flows, collects artifacts in e2e/artifacts/<platform>/ and
# shuts the device down.
#
#   --keep-alive  leave the device running afterwards
#   --headed      show the emulator / Simulator window
#   --record      each flow records itself, with animations on: the README
#                 demo videos, e2e/artifacts/<platform>/<flow>.mp4
#                 (`yarn e2e:record <platform>`)
set -euo pipefail

source "$(dirname "$0")/common.sh"

PLATFORM=""
KEEP_ALIVE=false
HEADED=false
RECORD=false
for arg in "$@"; do
  case "$arg" in
    android | ios) PLATFORM="$arg" ;;
    --keep-alive) KEEP_ALIVE=true ;;
    --headed) HEADED=true ;;
    --record) RECORD=true ;;
    *)
      echo "Unknown argument: $arg" >&2
      exit 2
      ;;
  esac
done
if [[ -z "$PLATFORM" ]]; then
  echo "Usage: run.sh <android|ios> [--keep-alive] [--headed] [--record]" >&2
  exit 2
fi
if [[ ! -x "$MAESTRO" ]]; then
  echo "Maestro not found at $MAESTRO (see ADR-0021 / README)." >&2
  exit 1
fi

OUT="$ROOT/e2e/artifacts/$PLATFORM"
rm -rf "$OUT"
mkdir -p "$OUT"

# ---------------------------------------------------------------- Android --

android_start() {
  android_boot "$OUT/emulator.log" "$HEADED"
  # Animations off for steadier runs on this dedicated device, on for the
  # recordings.
  if $RECORD; then android_animations 1; else android_animations 0; fi
}

android_install() { android_install_release; }

android_stop() { android_shutdown; }

# -------------------------------------------------------------------- iOS --

IOS_UDID=""

ios_start() {
  IOS_UDID="$(ios_udid)"
  if [[ -z "$IOS_UDID" ]]; then
    echo "No $IOS_DEVICE_NAME simulator: run yarn e2e:setup first." >&2
    exit 1
  fi
  echo "▶ Booting $IOS_DEVICE_NAME ($IOS_UDID)…"
  xcrun simctl boot "$IOS_UDID" 2>/dev/null || true
  xcrun simctl bootstatus "$IOS_UDID" -b >/dev/null
  if $HEADED; then open -a Simulator --args -CurrentDeviceUDID "$IOS_UDID"; fi
}

ios_install() {
  echo "▶ Building the release app for the simulator…"
  xcodebuild -quiet -workspace "$ROOT/ios/RepoScout.xcworkspace" \
    -scheme RepoScout -configuration Release -sdk iphonesimulator \
    -destination "id=$IOS_UDID" -derivedDataPath "$ROOT/ios/build/e2e" build
  xcrun simctl install "$IOS_UDID" \
    "$ROOT/ios/build/e2e/Build/Products/Release-iphonesimulator/RepoScout.app"
}

ios_stop() {
  xcrun simctl shutdown "$IOS_UDID" >/dev/null 2>&1 || true
}

# ---------------------------------------------------------------- Maestro --

run_maestro() { # <device> <flows> <report name>
  local extra=()
  if [[ "$PLATFORM" == "ios" ]]; then extra+=(--exclude-tags android-only); fi
  if $RECORD; then extra+=(-e RECORD=true); fi
  # ${a[@]+…}: an empty array is "unbound" under set -u in macOS's bash 3.2.
  "$MAESTRO" --device "$1" test "$2" ${extra[@]+"${extra[@]}"} \
    --format JUNIT --output "$OUT/$3.xml" --test-output-dir "$OUT/$3"
}

# <report name>: copies the videos the flows recorded (Maestro saves them as
# <report>/<timestamp>/<flow>/startRecording/<flow>.mp4) to <platform>/, where
# a retake's video replaces the failed take's.
collect_videos() {
  local video
  while IFS= read -r video; do
    cp "$video" "$OUT/$(basename "$video")"
  done < <(find "$OUT/$1" -path '*/startRecording/*.mp4')
}

# <junit.xml>: names of the flows that failed. A test case is self-closing or
# runs to </testcase>; its <properties> hold self-closing tags, so the first
# "/>" inside it is not its end.
failed_flows() {
  node -e '
    const xml = require("fs").readFileSync(process.argv[1], "utf8");
    const cases = xml.match(/<testcase\b[^>]*?(?:\/>|>[\s\S]*?<\/testcase>)/g) ?? [];
    for (const c of cases) {
      if (c.includes("<failure")) console.log(/name="([^"]+)"/.exec(c)?.[1] ?? "");
    }
  ' "$1"
}

# ------------------------------------------------------------------- main --

"${PLATFORM}_start"
if ! $KEEP_ALIVE; then trap '"${PLATFORM}_stop"' EXIT; fi
"${PLATFORM}_install"

device="$ANDROID_SERIAL"
if [[ "$PLATFORM" == "ios" ]]; then device="$IOS_UDID"; fi

status=0
echo "▶ Running the flows…"
if ! run_maestro "$device" "$ROOT/e2e" junit; then
  # The flows use the live, rate-limited GitHub API, so a failed flow gets
  # one retry (ADR-0013); the retry decides.
  failed="$(failed_flows "$OUT/junit.xml")"
  status=1
fi
if $RECORD; then collect_videos junit; fi
if [[ -n "${failed:-}" ]]; then
  status=0
  for flow in $failed; do
    echo "▶ Retrying ${flow}…"
    run_maestro "$device" "$ROOT/e2e/flows/$flow.yaml" "retry-$flow" || status=1
    if $RECORD; then collect_videos "retry-$flow"; fi
  done
fi

echo "Artifacts: e2e/artifacts/$PLATFORM"
exit "$status"
