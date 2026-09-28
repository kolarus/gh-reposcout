#!/usr/bin/env bash
# `yarn media:android` [--keep-alive] [--headed] (ADR-0021): the README's demo
# GIF and screenshots, from a scripted tour of the release build
# (e2e/media/tour.yaml) on the dedicated emulator. Writes docs/media/demo.gif
# and docs/media/screens/*.png; re-run it after a UI change.
set -euo pipefail

source "$(dirname "$0")/../e2e/common.sh"

KEEP_ALIVE=false
HEADED=false
for arg in "$@"; do
  case "$arg" in
    --keep-alive) KEEP_ALIVE=true ;;
    --headed) HEADED=true ;;
    *)
      echo "Unknown argument: $arg" >&2
      exit 2
      ;;
  esac
done
if [[ ! -x "$MAESTRO" ]]; then
  echo "Maestro not found at $MAESTRO (see ADR-0021 / README)." >&2
  exit 1
fi

OUT="$ROOT/e2e/artifacts/media"
rm -rf "$OUT"
mkdir -p "$OUT"
# Sampled at 10 fps and 360 px wide: smooth enough, and small in the repo.
FPS=10
WIDTH=360

on_device() { adb -s "$ANDROID_SERIAL" "$@"; }

# Android's demo mode: a fixed clock, full battery, Wi-Fi only, and no
# notification icons, so every run's frames look the same.
demo_mode() { # on | off
  if [[ "$1" == "on" ]]; then
    on_device shell settings put global sysui_demo_allowed 1
    on_device shell am broadcast -a com.android.systemui.demo -e command enter >/dev/null
    on_device shell am broadcast -a com.android.systemui.demo -e command clock -e hhmm 1200 >/dev/null
    on_device shell am broadcast -a com.android.systemui.demo -e command battery -e plugged false -e level 100 >/dev/null
    on_device shell am broadcast -a com.android.systemui.demo -e command network -e fully true -e wifi show -e level 4 -e mobile hide >/dev/null
    on_device shell am broadcast -a com.android.systemui.demo -e command notifications -e visible false >/dev/null
  else
    on_device shell am broadcast -a com.android.systemui.demo -e command exit >/dev/null 2>&1 || true
  fi
}

cleanup() {
  demo_mode off
  if ! $KEEP_ALIVE; then android_shutdown; fi
}

# The host's GPU: headless, the emulator otherwise renders in software.
android_boot "$OUT/emulator.log" "$HEADED" -gpu host
trap cleanup EXIT
# The tour shows the app as people see it, animations included.
android_animations 1
android_install_release
demo_mode on

echo "▶ Recording the tour…"
if ! "$MAESTRO" --device "$ANDROID_SERIAL" test "$ROOT/e2e/media/tour.yaml" \
  --test-output-dir "$OUT" >"$OUT/maestro.log" 2>&1; then
  echo "The tour failed: see e2e/artifacts/media/maestro.log." >&2
  exit 1
fi
run_dir=$(find "$OUT" -type d -path '*/tour' | head -1)

echo "▶ Building the GIF and screenshots…"
swift "$ROOT/scripts/media/frames.swift" "$run_dir/startRecording/tour.mp4" \
  "$OUT/frames" "$FPS" "$WIDTH"
node "$ROOT/scripts/build-media.mts" "$OUT/frames" \
  "$run_dir/takeScreenshot" "$ROOT/docs/media"
