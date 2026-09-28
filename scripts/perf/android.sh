#!/usr/bin/env bash
# `yarn perf:android` [--keep-alive] [--headed] (ADR-0017): measures the release
# build on the dedicated emulator (ADR-0021) and writes
# perf/artifacts/android/report.md, with the raw tool output next to it:
#
#   size        the release APK for this CPU, and what's in it
#   cold start  `am start -W` TotalTime (first frame), median of 10
#   scrolling   gfxinfo janky frames and frame times, flinging through all
#               1,000 results of a search
#   memory      meminfo before and after that scroll, and once the app is in
#               the background and asked to trim memory
#   GPU bars    screenshots mid-fling with "Profile HWUI rendering" bars on
#
# Uses the live GitHub API. The request counts of a session are measured
# exactly in Jest instead ("GitHub requests in a scripted session",
# src/app/App.test.tsx): GitHub's rate_limit endpoint doesn't report
# unauthenticated search use, so it can't count the app's requests.
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

OUT="$ROOT/perf/artifacts/android"
rm -rf "$OUT"
mkdir -p "$OUT"
FLOWS="$ROOT/perf/flows"
# At GitHub's 1,000-result cap, so the list has ten full pages to scroll.
SCROLL_QUERY="react"
APKANALYZER="$SDK/cmdline-tools/latest/bin/apkanalyzer"

on_device() { adb -s "$ANDROID_SERIAL" "$@"; }

run_flow() { # <flow> [KEY=value…]
  local flow="$1" env=() kv
  shift
  for kv in "$@"; do env+=(-e "$kv"); done
  if ! "$MAESTRO" --device "$ANDROID_SERIAL" test "$FLOWS/$flow.yaml" \
    ${env[@]+"${env[@]}"} --test-output-dir "$OUT/maestro" >>"$OUT/maestro.log" 2>&1; then
    echo "The $flow flow failed: see perf/artifacts/android/maestro.log." >&2
    exit 1
  fi
}

fling_down() { on_device shell input swipe 540 1900 540 400 60; }

# <text> <UI dump>: taps the middle of the first element showing this text.
tap_text() {
  local bounds
  bounds=$(grep -o "text=\"$1\"[^>]*bounds=\"[^\"]*\"" <<<"$2" | head -1 |
    sed -E 's/.*bounds="\[([0-9]+),([0-9]+)\]\[([0-9]+),([0-9]+)\]"/\1 \2 \3 \4/')
  # shellcheck disable=SC2046 # two words on purpose: x and y
  on_device shell input tap $(awk '{ print int(($1 + $3) / 2), int(($2 + $4) / 2) }' <<<"$bounds")
}

# 0 once the list shows its end-of-results footer at GitHub's cap. A page that
# failed to load shows "Couldn't load more" with Retry: it's tapped, as a user
# would, and counted for the report.
PAGE_RETRIES=0
at_end() {
  # Let the last fling settle first: the dump walks the view tree on the UI
  # thread, which would drop frames of a fling still running.
  sleep 1.5
  on_device shell uiautomator dump /sdcard/perf-ui.xml >/dev/null 2>&1 || return 1
  local ui
  ui=$(on_device shell cat /sdcard/perf-ui.xml)
  if [[ "$ui" == *"Showing the first 1,000 results"* ]]; then return 0; fi
  if [[ "$ui" == *"Couldn't load more"* ]]; then
    tap_text "Retry" "$ui"
    PAGE_RETRIES=$((PAGE_RETRIES + 1))
  fi
  return 1
}

median() { sort -n | awk '{ v[NR] = $1 } END { print (NR % 2 ? v[(NR + 1) / 2] : (v[NR / 2] + v[NR / 2 + 1]) / 2) }'; }

mb() { awk -v b="$1" 'BEGIN { printf "%.1f MB", b / 1048576 }'; }

# <meminfo file> <row>: an App Summary row's PSS, in MB.
pss() {
  awk -v row="$2" '
    index($0, row ":") && $0 ~ "^ *" row ":" { sub("^ *" row ": *", ""); printf "%.1f", $1 / 1024; exit }
  ' "$1"
}

gfx() { grep -m1 "^$1" "$OUT/gfxinfo.txt" | sed 's/^[^:]*: *//'; }

# <meminfo file>: "<count> (<MB> MB)" of Android bitmaps, which hold the
# decoded images.
bitmaps() {
  awk '/Bitmap \(malloced\):/ { printf "%d (%.1f MB)", $3, $4 / 1024; exit }' "$1"
}

views() { awk '/ Views:/ { print $2; exit }' "$1"; }

# <meminfo file>: one row of the memory table.
memory_row() {
  echo "$(pss "$1" "TOTAL PSS") | $(pss "$1" "Java Heap") | $(pss "$1" "Native Heap") | $(bitmaps "$1") | $(views "$1")"
}

# ------------------------------------------------------------------- run --

# The host's GPU: headless, the emulator otherwise renders in software, and
# frame times would measure that instead of the app.
android_boot "$OUT/emulator.log" "$HEADED" -gpu host
if ! $KEEP_ALIVE; then trap android_shutdown EXIT; fi
if ! grep -q "gles_mode_selected:host" "$OUT/emulator.log"; then
  echo "The emulator isn't rendering on the host GPU (see emulator.log)." >&2
  exit 1
fi
# Measure the app as people see it, animations included.
android_animations 1
android_install_release

if [[ "$("$APKANALYZER" manifest debuggable "$RELEASE_APK")" != "false" ]] ||
  ! "$APKANALYZER" manifest print "$RELEASE_APK" | grep -q '<profileable'; then
  echo "The release APK must be profileable and not debuggable (ADR-0017)." >&2
  exit 1
fi

echo "▶ Size…"
apk_bytes=$(stat -f%z "$RELEASE_APK")
bundle_bytes=$(unzip -l "$RELEASE_APK" assets/index.android.bundle | awk 'NR == 4 { print $1 }')
libs_bytes=$(unzip -l "$RELEASE_APK" 'lib/*' | awk 'END { print $1 }')
dex_bytes=$(unzip -l "$RELEASE_APK" '*.dex' | awk 'END { print $1 }')

echo "▶ Cold start (10 launches)…"
on_device shell pm clear "$APP_ID" >/dev/null
# The first launch after install does one-off work (first run, ART): not measured.
on_device shell am start -W -n "$APP_ID/.MainActivity" >/dev/null
sleep 5
for run in 1 2 3 4 5 6 7 8 9 10; do
  on_device shell am start -W -S -n "$APP_ID/.MainActivity" | tr -d '\r' >"$OUT/cold-start-$run.txt"
  if ! grep -q "LaunchState: COLD" "$OUT/cold-start-$run.txt"; then
    echo "Launch $run wasn't cold: see perf/artifacts/android/cold-start-$run.txt." >&2
    exit 1
  fi
  awk '/^TotalTime/ { print $2 }' "$OUT/cold-start-$run.txt" >>"$OUT/cold-start.txt"
  # Let the app finish starting (JS, first render) before the next kill.
  sleep 4
done
start_median=$(median <"$OUT/cold-start.txt")
start_min=$(sort -n "$OUT/cold-start.txt" | head -1)
start_max=$(sort -n "$OUT/cold-start.txt" | tail -1)

echo "▶ Scrolling and memory…"
run_flow search QUERY="$SCROLL_QUERY"
sleep 2
on_device shell dumpsys meminfo "$APP_ID" >"$OUT/meminfo-before.txt"
on_device shell dumpsys gfxinfo "$APP_ID" reset >/dev/null
# Fling to the end: the nine further pages load as the list nears its end. If
# GitHub's search budget runs out on the way, the app pauses and resumes by
# itself (ADR-0012); the deadline allows for that wait.
deadline=$(($(date +%s) + 300))
flings=0
until at_end; do
  for _ in 1 2 3 4 5; do fling_down; done
  flings=$((flings + 5))
  if (($(date +%s) > deadline)); then
    echo "Flinging didn't reach the end of the 1,000 results in 5 minutes." >&2
    exit 1
  fi
done
on_device shell dumpsys gfxinfo "$APP_ID" >"$OUT/gfxinfo.txt"
sleep 3
on_device shell dumpsys meminfo "$APP_ID" >"$OUT/meminfo-after.txt"

echo "▶ GPU bars…"
# The developer option "Profile HWUI rendering: on screen as bars". The
# service call is what the Settings toggle sends: running apps re-read debug
# properties, so the list stays loaded.
on_device shell setprop debug.hwui.profile visual_bars
on_device shell service call activity 1599295570 >/dev/null
for shot in 1 2 3; do
  # Back up the list: a swipe starting below the sort chips.
  on_device shell input swipe 540 900 540 2100 60 &
  sleep 0.5
  on_device exec-out screencap -p >"$OUT/scroll-gpu-bars-$shot.png"
  # This fling only: a bare `wait` would also wait for the emulator.
  wait "$!"
done
on_device shell setprop debug.hwui.profile false
on_device shell service call activity 1599295570 >/dev/null

echo "▶ Memory in the background…"
# What Android does to an app the user leaves: Home, then a trim request.
on_device shell input keyevent KEYCODE_HOME
# Android refuses a background trim level until the app has left the
# foreground, which takes a moment after Home.
for attempt in 1 2 3 4 5 6 7 8 9 10; do
  trim=$(on_device shell am send-trim-memory "$APP_ID" BACKGROUND 2>&1 || true)
  if [[ "$trim" != *Exception* ]]; then break; fi
  if ((attempt == 10)); then
    echo "Android didn't accept the trim request: $trim" >&2
    exit 1
  fi
  sleep 1
done
sleep 4
on_device shell dumpsys meminfo "$APP_ID" >"$OUT/meminfo-background.txt"

# ---------------------------------------------------------------- report --

prop() { on_device shell getprop "$1" | tr -d '\r'; }
avd_ram=$(awk -F= '/^hw.ramSize/ { gsub(/ /, "", $2); print $2 }' "$HOME/.android/avd/$AVD_NAME.avd/config.ini")
refresh=$(on_device shell dumpsys SurfaceFlinger | tr -d '\r' |
  awk -F: '/refresh-rate/ { printf "%.0f Hz", $2 + 0; exit }')
version=$(on_device shell dumpsys package "$APP_ID" | tr -d '\r' | awk -F= '/versionName/ { print $2; exit }')
gpu=$(sed -n 's/.*Selecting Vulkan device: \([^,]*\),.*/\1/p' "$OUT/emulator.log" | head -1)
r8=$(awk '/def enableProguardInReleaseBuilds/ { print $NF; exit }' "$ROOT/android/app/build.gradle")

cat >"$OUT/report.md" <<EOF
# Android performance, $(date -u +%Y-%m-%d)

Release build ${version} (R8: ${r8}, profileable, not debuggable), ${ANDROID_ABI} APK.
Emulator ${AVD_NAME}: ${ANDROID_IMAGE}, Android $(prop ro.build.version.release) (API $(prop ro.build.version.sdk)), $(on_device shell getconf PAGE_SIZE | tr -d '\r')-byte pages, ${avd_ram} MB RAM, ${refresh}, rendering on the host GPU (${gpu}), animations on.
Host: $(sysctl -n machdep.cpu.brand_string), $(($(sysctl -n hw.memsize) / 1073741824)) GB, macOS $(sw_vers -productVersion). Network: live GitHub API over the host's connection.

## Size

| What | Size |
| --- | --- |
| Release APK (${ANDROID_ABI} only) | $(mb "$apk_bytes") |
| JS bundle (Hermes bytecode, uncompressed) | $(mb "$bundle_bytes") |
| Native libraries (uncompressed) | $(mb "$libs_bytes") |
| Dex (uncompressed) | $(mb "$dex_bytes") |

## Cold start

\`am start -W\` TotalTime to the first frame, 10 cold launches after one unmeasured first launch:
median **${start_median} ms** (min ${start_min}, max ${start_max}). All: $(tr '\n' ' ' <"$OUT/cold-start.txt")

## Scrolling

"${SCROLL_QUERY}": ${flings} flings through all 1,000 results, loading nine more pages on the way (gfxinfo over the whole scroll):

| Frames | Janky | Slow UI thread | 50th | 90th | 95th | 99th percentile | GPU 50th |
| --- | --- | --- | --- | --- | --- | --- | --- |
| $(gfx "Total frames rendered") | $(gfx "Janky frames") | $(gfx "Number Slow UI thread") | $(gfx "50th percentile") | $(gfx "90th percentile") | $(gfx "95th percentile") | $(gfx "99th percentile") | $(gfx "50th gpu percentile") |

Pages that failed to load and were retried on the way: ${PAGE_RETRIES}.

Janky frames missed their deadline (Android's frame timeline). The emulator's frame times include waiting for the host GPU, about one refresh per frame (see the GPU column), so the percentiles show the emulator's pipeline more than the app. gfxinfo sees the UI and render threads only, not JavaScript.

## Memory

dumpsys meminfo: PSS in MB, then Android bitmap and view counts. GPU memory isn't in these numbers: the emulator keeps it on the host.

| | Total PSS | Java heap | Native heap | Bitmaps | Views |
| --- | --- | --- | --- | --- | --- |
| First page shown | $(memory_row "$OUT/meminfo-before.txt") |
| After all 1,000 results | $(memory_row "$OUT/meminfo-after.txt") |
| In the background, trimmed | $(memory_row "$OUT/meminfo-background.txt") |
EOF

cat "$OUT/report.md"
echo
echo "Artifacts: perf/artifacts/android"
