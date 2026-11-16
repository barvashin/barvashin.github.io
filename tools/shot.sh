#!/bin/bash
# Снимок страницы в headless Chrome.
# Использование: tools/shot.sh <page.html> <out.png> <ширина> [высота]
# Пример:        tools/shot.sh index.html out_d.png 1440 12000
#                tools/shot.sh cases/sea-breeze.html out_m.png 390 14000
# Анимации появления отключаются параметром ?static, чтобы снимок был полным.
# Ширина меньше 500 px: Chrome так узко не умеет, поэтому страница
# открывается во фрейме нужной ширины, а снимок потом обрезается.
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PAGE="$1"; OUT="$2"; W="${3:-1440}"; H="${4:-12000}"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
URL="file://$ROOT/$PAGE?static"
if [ "$W" -lt 500 ]; then
  WRAP="$(mktemp -d)/wrap.html"
  printf '<!doctype html><html><body style="margin:0;background:#fff"><iframe src="%s" style="border:0;display:block;margin:0 auto;width:%spx;height:%spx"></iframe></body></html>' "$URL" "$W" "$H" > "$WRAP"
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
    --user-data-dir="$(mktemp -d)" --allow-file-access-from-files \
    --window-size="500,$H" --virtual-time-budget=5000 \
    --screenshot="$OUT" "file://$WRAP" >/dev/null 2>&1
  sips --cropOffset 0 0 -c "$H" "$W" "$OUT" >/dev/null
else
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
    --user-data-dir="$(mktemp -d)" \
    --window-size="$W,$H" --virtual-time-budget=4000 \
    --screenshot="$OUT" "$URL" >/dev/null 2>&1
fi
echo "$OUT"
