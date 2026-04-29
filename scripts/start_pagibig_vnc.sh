#!/bin/bash
# Launch a self-contained X session (Xvfb), an x11vnc server bound to it,
# noVNC on http://localhost:6080, and Chromium pointed at pagibigfund.gov.ph.
#
# After the user solves the reCAPTCHA via the browser, the Chromium profile
# at $PROFILE_DIR retains the cookies, so a follow-up Playwright run with
# `launch_persistent_context(PROFILE_DIR, headless=True)` can scrape
# without seeing another challenge.
#
# Usage:
#   bash ~/projects/quickformsph-dev/scripts/start_pagibig_vnc.sh
#
# Stop with: kill $(cat /tmp/pagibig_vnc.pids)

set -e

DISPLAY_NUM=":98"
VNC_PORT=5998
NOVNC_PORT=6080
PROFILE_DIR="$HOME/projects/quickformsph/Forms-Research/PAGIBIG/_chrome_profile"
PIDFILE=/tmp/pagibig_vnc.pids
LOG=/tmp/pagibig_vnc.log

mkdir -p "$PROFILE_DIR" "$HOME/projects/quickformsph/Forms-Research/PAGIBIG"
> "$PIDFILE"; > "$LOG"

cleanup_existing() {
  pkill -f "Xvfb $DISPLAY_NUM" 2>/dev/null || true
  pkill -f "x11vnc.*-rfbport $VNC_PORT" 2>/dev/null || true
  pkill -f "websockify.*$NOVNC_PORT" 2>/dev/null || true
  sleep 0.5
}
cleanup_existing

echo "[1] Starting Xvfb on $DISPLAY_NUM..." | tee -a "$LOG"
Xvfb $DISPLAY_NUM -screen 0 1400x900x24 -nolisten tcp -noreset >>"$LOG" 2>&1 &
echo $! >> "$PIDFILE"
sleep 1

echo "[2] Starting x11vnc on port $VNC_PORT..." | tee -a "$LOG"
x11vnc -display $DISPLAY_NUM -nopw -listen 127.0.0.1 -rfbport $VNC_PORT \
       -forever -shared -bg -quiet -o "$LOG" -ncache 0
# x11vnc with -bg already daemonized; track via pgrep
sleep 1
pgrep -f "x11vnc.*-rfbport $VNC_PORT" >> "$PIDFILE" || true

echo "[3] Starting noVNC (websockify) on http://localhost:$NOVNC_PORT ..." | tee -a "$LOG"
websockify --web=/usr/share/novnc/ $NOVNC_PORT 127.0.0.1:$VNC_PORT >>"$LOG" 2>&1 &
echo $! >> "$PIDFILE"
sleep 1

echo "[4] Launching Chromium inside virtual display..." | tee -a "$LOG"
DISPLAY=$DISPLAY_NUM /snap/bin/chromium \
  --user-data-dir="$PROFILE_DIR" \
  --no-first-run \
  --no-default-browser-check \
  --disable-features=CalculateNativeWinOcclusion \
  --window-position=0,0 \
  --window-size=1400,900 \
  "https://www.pagibigfund.gov.ph/" >>"$LOG" 2>&1 &
echo $! >> "$PIDFILE"

echo
echo "===================================================================="
echo " Open this URL in YOUR browser:"
echo "   http://localhost:$NOVNC_PORT/vnc.html?autoconnect=1&resize=remote"
echo
echo " (No password set. If your VS Code has port forwarding for 6080,"
echo "  it will automatically expose this on your local laptop.)"
echo
echo " Inside the noVNC session you'll see a Chromium window already on"
echo " pagibigfund.gov.ph. Steps:"
echo "   1. Solve the reCAPTCHA"
echo "   2. Navigate to the Forms / Downloadables page"
echo "   3. Once the form-list page is loaded, run:"
echo "        ~/playwright-env/bin/python \\"
echo "          ~/projects/quickformsph-dev/scripts/scrape_pagibig_persistent.py"
echo
echo " Profile dir (cookies persisted): $PROFILE_DIR"
echo " Log file: $LOG"
echo " PID file: $PIDFILE  (kill -9 \$(cat $PIDFILE) to stop)"
echo "===================================================================="
