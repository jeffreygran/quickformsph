#!/bin/bash
# DFA VNC stack — display :97, websockify port 6082
set -e
PROFILE_DIR="$HOME/projects/quickformsph/Forms-Research/DFA/_chrome_profile"
mkdir -p "$PROFILE_DIR"
rm -f "$PROFILE_DIR"/Singleton{Lock,Cookie,Socket}

pkill -f "Xvfb :97" 2>/dev/null || true
pkill -f "x11vnc.*5997" 2>/dev/null || true
pkill -f "websockify.*6082" 2>/dev/null || true
sleep 1

Xvfb :97 -screen 0 1400x900x24 -nolisten tcp -noreset &
sleep 1
x11vnc -display :97 -nopw -listen 127.0.0.1 -rfbport 5997 -forever -shared -bg -quiet -o /tmp/dfa_vnc.log -ncache 0
/usr/bin/python3 /usr/bin/websockify --web=/usr/share/novnc/ 6082 127.0.0.1:5997 >/tmp/dfa_websockify.log 2>&1 &
sleep 1

DISPLAY=:97 nohup /snap/bin/chromium \
  --user-data-dir="$PROFILE_DIR" \
  --no-first-run --no-default-browser-check \
  --disable-features=CalculateNativeWinOcclusion \
  --remote-debugging-port=9223 \
  --window-position=0,0 --window-size=1400,900 \
  "https://dfa.gov.ph/dfa-forms" >> /tmp/dfa_vnc.log 2>&1 &

sleep 4
echo "VNC: http://192.168.79.11:6082/vnc.html?autoconnect=1&resize=remote"
echo "CDP: http://127.0.0.1:9223"
ss -tlnp 2>/dev/null | grep -E "6082|5997|9223" | head -5
