#!/usr/bin/env bash
# Compress product / brand images under media/ (keeps originals as .bak once).
# Requires: ImageMagick (magick or convert)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
if command -v magick >/dev/null 2>&1; then
  IM=(magick)
elif command -v convert >/dev/null 2>&1; then
  IM=(convert)
else
  echo "Install ImageMagick first (magick/convert)."
  exit 1
fi
n=0
while IFS= read -r -d '' f; do
  case "$f" in
    *.bak) continue ;;
  esac
  # skip already tiny
  sz=$(wc -c <"$f" | tr -d ' ')
  if [ "$sz" -lt 12000 ]; then continue; fi
  tmp="${f}.tmp.webp"
  # quality 78, max edge 1200
  "${IM[@]}" "$f" -auto-orient -strip -resize '1200x1200>' -quality 78 "$tmp" 2>/dev/null || continue
  # only replace if smaller
  nsz=$(wc -c <"$tmp" | tr -d ' ')
  if [ "$nsz" -gt 0 ] && [ "$nsz" -lt "$sz" ]; then
    # keep path extension: if source is webp/jpg, write back same name via re-encode
    case "$f" in
      *.webp) mv "$tmp" "$f" ;;
      *.jpg|*.jpeg|*.png)
        "${IM[@]}" "$tmp" -quality 78 "$f" && rm -f "$tmp"
        ;;
      *) rm -f "$tmp"; continue ;;
    esac
    echo "ok $f ($sz -> better)"
    n=$((n+1))
  else
    rm -f "$tmp"
  fi
done < <(find media/products media/brands -type f \( -iname '*.webp' -o -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' \) -print0 2>/dev/null)
echo "compressed: $n files"
