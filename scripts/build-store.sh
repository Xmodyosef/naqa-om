#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
APP=(js/config.js js/scroll-lock.js js/brands-logos.js js/core.js js/features/wish-concerns.js js/features/bundles.js js/features/reviews.js js/features/quiz.js js/features/boot.js data/oman-areas.js js/extras.js js/render/cards.js js/render/main.js js/sheet/carousel.js js/sheet/panel.js js/cart.js js/a11y.js js/app.js)
: > /tmp/app.concat.js
for f in "${APP[@]}"; do cat "$f" >> /tmp/app.concat.js; echo ";" >> /tmp/app.concat.js; done
npx terser /tmp/app.concat.js -c passes=2 -m --safari10 -o js/store.min.js
npx terser data/products.bundle.js -c -m --safari10 -o data/products.min.js
# css
python3 - <<'PY'
import re
from pathlib import Path
parts=[Path(p).read_text() for p in [
 'css/store/base.css','css/store/cart-chrome.css','css/store/sheet.css','css/store/features.css','css/store/a11y.css']]
css='\n'.join(parts)
css=re.sub(r'/\*.*?\*/','',css,flags=re.S)
css=re.sub(r'\s+',' ',css)
css=re.sub(r'\s*([{}:;,>+~])\s*',r'\1',css).replace(';}','}').strip()
Path('css/store.min.css').write_text(css+'\n')
print('built store.min.css', len(css), 'store.min.js', Path('js/store.min.js').stat().st_size)
PY
echo OK
