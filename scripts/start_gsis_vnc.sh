#!/bin/bash
# Launch a self-contained X session (Xvfb), an x11vnc server bound to it,
# noVNC on http://localhost:6080, and Chromium pointed at gsis.gov.ph.
#
# Same idea as start_pagibig_vnc.sh: user solves any WAF/captcha challenge
# inside the visible Chromium, profile cookies persist, then a Playwright
# script reuses the profile to download files via page.context.request
# (which inherits the trusted browser fingerprint and bypasses the F5 ASM
# block that hits headless / curl).
#
# Usage:  bash ~/projects/quickformsph-dev/scripts/start_gsis_vnc.sh
# Stop:   kill $(cat /tmp/gsis_vnc.pids)

set -e

DISPLAY_NUM=":99"
VNC_PORT=5999
NOVNC_PORT=6081
PROFILE_DIR="$HOME/projects/quickformsph/Forms-Research/GSIS/_chrome_profile"
PIDFILE=/tmp/gsis_vnc.pids
LOG=/tmp/gsis_vnc.log

mkdir -p "$PROFILE_DIR" "$HOME/projects/quickformsph/Forms-Research/GSIS"
> "$PIDFILE"; > "$LOG"

cleanup_existing() {
  pkill -f "Xvfb $DISPLAY_NUM" 2>/dev/null || true
  pkill -f "x11vnc.*-rfbport $VNC_PORT" 2>/dev/null || true
  pkill -f "websockify.*$NOVNC_PORT" 2>/dev/null || true
  # cleanup stale chromium profile locks
  rm -f "$PROFILE_DIR/Singleton"{Lock,Cookie,Socket} 2>/dev/null || true
  pkill -9 -f "snap/chromium.*$PROFILE_DIR" 2>/dev/null || true
  sleep 0.5
}
cleanup_existing

echo "[1] Xvfb on $DISPLAY_NUM..." | tee -a "$LOG"
Xvfb $DISPLAY_NUM -screen 0 1400x900x24 -nolisten tcp -noreset >>"$LOG" 2>&1 &
echo $! >> "$PIDFILE"
sleep 1

echo "[2] x11vnc on $VNC_PORT..." | tee -a "$LOG"
x11vnc -display $DISPLAY_NUM -nopw -listen 127.0.0.1 -rfbport $VNC_PORT \
       -forever -shared -bg -quiet -o "$LOG" -ncache 0
sleep 1
pgrep -f "x11vnc.*-rfbport $VNC_PORT" >> "$PIDFILE" || true

echo "[3] noVNC on http://localhost:$NOVNC_PORT ..." | tee -a "$LOG"
websockify --web=/usr/share/novnc/ $NOVNC_PORT 127.0.0.1:$VNC_PORT >>"$LOG" 2>&1 &
echo $! >> "$PIDFILE"
sleep 1

echo "[4] Chromium → gsis.gov.ph downloadable-forms ..." | tee -a "$LOG"
DISPLAY=$DISPLAY_NUM /snap/bin/chromium \
  --user-data-dir="$PROFILE_DIR" \
  --no-first-run --no-default-browser-check \
  --disable-features=CalculateNativeWinOcclusion \
  --window-position=0,0 --window-size=1400,900 \
  "https://www.gsis.gov.ph/downloadable-forms/" >>"$LOG" 2>&1 &
echo $! >> "$PIDFILE"

cat <<EOF

====================================================================
 Open in YOUR browser:
   http://192.168.79.11:$NOVNC_PORT/vnc.html?autoconnect=1&resize=remote

 In the visible Chromium:
   1. If the F5 "Request Rejected" page appears, click around the
      site so it learns this is a real session (visit a few links).
   2. Once the Downloadable Forms page loads normally, run:
        ~/playwright-env/bin/python \\
          ~/projects/quickformsph-dev/scripts/download_gsis_missing.py

 Profile dir: $PROFILE_DIR
 Log:         $LOG
 PIDs:        $PIDFILE
====================================================================
EOF
