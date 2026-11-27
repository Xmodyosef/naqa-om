#!/usr/bin/env python3
"""Fix weak/suspect first packshots from kapy.om by exact barcode/SKU.
Rejects face/hand/lifestyle frames. Process in small batches to limit RAM.
Usage: python3 scripts/kapy_fix125.py [batch_index] [batch_size]
"""
import json, re, time, urllib.request, urllib.parse, gc, sys
from pathlib import Path
from io import BytesIO
from PIL import Image
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
LIST = Path('/tmp/naqa_fix125.json')
PROGRESS = Path('/tmp/kapy125_progress.json')
UA = {'User-Agent': 'Mozilla/5.0 (compatible; NaqaBot/1.0)', 'Accept': '*/*'}

def log(m):
    print(m, flush=True)

def get(url, timeout=28):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()

def direct(u):
    if not u:
        return None
    i = u.find('https://media.zid.store')
    return u[i:] if i >= 0 else u

def score_packshot(im):
    im = im.convert('RGB')
    im2 = im.copy()
    im2.thumbnail((300, 300), Image.BILINEAR)
    a = np.array(im2)
    h, w = a.shape[:2]
    r, g, b = a[:,:,0].astype(np.int16), a[:,:,1].astype(np.int16), a[:,:,2].astype(np.int16)
    white = float(((r > 230) & (g > 230) & (b > 230)).mean())
    border = np.concatenate([a[:8].reshape(-1,3), a[-8:].reshape(-1,3), a[:,:8].reshape(-1,3), a[:,-8:].reshape(-1,3)])
    ew = float(((border[:,0] > 220) & (border[:,1] > 220) & (border[:,2] > 220)).mean())
    y = 0.299*r + 0.587*g + 0.114*b
    cr, cb = r - y, b - y
    sat = np.maximum(np.maximum(r,g),b) - np.minimum(np.minimum(r,g),b)
    skin = ((cr>12)&(cr<55)&(cb>-30)&(cb<12)&(y>40)&(y<220)&(r>g)&((r-g)>8)&(sat<100))
    skin_r = float(skin.mean())
    edge = np.zeros((h,w), bool)
    edge[:10]=True; edge[-10:]=True; edge[:,:10]=True; edge[:,-10:]=True
    edge_skin = float((skin & edge).sum() / max(1, edge.sum()))
    dark = float(((r<50)&(g<50)&(b<50)).mean())
    nw = ~((r>242)&(g>242)&(b>242))
    ys, xs = np.where(nw)
    fill = 0.0 if len(xs)==0 else ((xs.max()-xs.min()+1)*(ys.max()-ys.min()+1))/(h*w)
    reject = False
    reason = ''
    if edge_skin > 0.05 and skin_r > 0.04 and ew < 0.85:
        reject, reason = True, 'hand'
    if skin_r > 0.10 and ew < 0.75:
        reject, reason = True, 'face'
    if white < 0.12 and ew < 0.40:
        reject, reason = True, 'lifestyle'
    if dark > 0.10 and white > 0.25 and fill > 0.85:
        reject, reason = True, 'text'
    if min(im.size) < 260:
        reject, reason = True, 'tiny'
    sc = ew*40 + white*20 + min(fill, 0.65)*35 - skin_r*55 - edge_skin*35
    if ew >= 0.9 and 0.12 <= fill <= 0.78:
        sc += 15
    return {'score': sc, 'ew': ew, 'fill': fill, 'white': white, 'skin': skin_r,
            'reject': reject, 'reason': reason, 'size': im.size}

def save_canvas(im, dest, fill_target=0.82):
    im = im.convert('RGB')
    a = np.array(im)
    nw = ~((a[:,:,0]>245)&(a[:,:,1]>245)&(a[:,:,2]>245))
    ys, xs = np.where(nw)
    canvas = Image.new('RGB', (1400, 1400), (255, 255, 255))
    if len(xs) == 0:
        canvas.save(dest, 'WEBP', quality=90, method=4)
        return
    pad = int(max(im.size) * 0.03)
    crop = im.crop((max(0, int(xs.min())-pad), max(0, int(ys.min())-pad),
                    min(im.width, int(xs.max())+1+pad), min(im.height, int(ys.max())+1+pad)))
    cw, ch = crop.size
    scale = min((1400*fill_target)/cw, (1400*fill_target)/ch)
    nw_, nh_ = max(1, int(cw*scale)), max(1, int(ch*scale))
    crop = crop.resize((nw_, nh_), Image.LANCZOS)
    canvas.paste(crop, ((1400-nw_)//2, (1400-nh_)//2))
    canvas.save(dest, 'WEBP', quality=90, method=4)

def kapy_by_sku(sku):
    url = f'https://kapy.om/api/v1/products?q={urllib.parse.quote(sku)}&page_size=6'
    data = json.loads(get(url))
    for it in data.get('results') or []:
        if str(it.get('sku') or '') == sku or str(it.get('barcode') or '') == sku:
            return it
    return None

def kapy_search(q, page_size=8):
    url = f'https://kapy.om/api/v1/products?q={urllib.parse.quote(q)}&page_size={page_size}'
    return json.loads(get(url)).get('results') or []

def tokens(s):
    s = (s or '').lower()
    s = re.sub(r'[^a-z0-9\u0600-\u06ff]+', ' ', s)
    return set(t for t in s.split() if len(t) > 2)

def pick_best_image(item):
    urls = []
    for imobj in (item.get('images') or [])[:5]:
        img = imobj.get('image') or {}
        u = direct(img.get('full_size') or img.get('large'))
        if u:
            urls.append(u)
    main = item.get('main_image') or {}
    if isinstance(main, dict):
        img = main.get('image') or main
        if isinstance(img, dict):
            u = direct(img.get('full_size') or img.get('large'))
            if u:
                urls.insert(0, u)
    best = None
    for u in list(dict.fromkeys(urls))[:5]:
        try:
            im = Image.open(BytesIO(get(u)))
            sc = score_packshot(im)
            if sc['reject']:
                log(f'    reject {sc["reason"]} {sc["size"]}')
                continue
            if sc['score'] < 52:
                log(f'    weak {sc["score"]:.1f}')
                continue
            if best is None or sc['score'] > best[0]:
                # save as PNG bytes then reopen to free intermediate
                buf = BytesIO()
                im.convert('RGB').save(buf, 'JPEG', quality=92)
                best = (sc['score'], buf.getvalue(), sc)
                log(f'    cand s={sc["score"]:.1f} ew={sc["ew"]:.2f} fill={sc["fill"]:.2f}')
            del im
        except Exception as e:
            log(f'    dl {e}')
    if not best:
        return None
    im = Image.open(BytesIO(best[1]))
    return best[0], im, best[2]

def name_match_item(name, brand, results):
    ta = tokens(name)
    best = None
    for it in results:
        blob = (it.get('name') or '') + ' ' + (it.get('slug') or '').replace('-', ' ')
        tb = tokens(blob)
        inter = ta & tb
        sc = len(inter)
        if brand and brand.lower() in blob.lower():
            sc += 2
        # require at least 2 shared tokens OR exact brand + 1
        if sc >= 3 or (sc >= 2 and brand and brand.lower() in blob.lower()):
            if best is None or sc > best[0]:
                best = (sc, it)
    return best

def load_prog():
    if PROGRESS.exists():
        return json.loads(PROGRESS.read_text())
    return {'ok': [], 'skip': [], 'miss': [], 'reject': []}

def save_prog(p):
    PROGRESS.write_text(json.dumps(p, ensure_ascii=False, indent=2))

def main():
    batch_i = int(sys.argv[1]) if len(sys.argv) > 1 else 0
    batch_n = int(sys.argv[2]) if len(sys.argv) > 2 else 10
    targets = json.loads(LIST.read_text())
    batch = targets[batch_i*batch_n:(batch_i+1)*batch_n]
    log(f'batch {batch_i} size {len(batch)} of {len(targets)}')
    prog = load_prog()
    done = set(prog['ok'] + prog['skip'] + prog['miss'] + prog['reject'])

    for t in batch:
        pid = t['id']
        if pid in done:
            log(f'p{pid} already done')
            continue
        sku = str(t.get('sku') or '')
        brand = t.get('brand') or ''
        name = t.get('name') or ''
        dest = ROOT / f'media/products/p{pid}_0.webp'
        log(f'\n=== p{pid} {brand} sku={sku} {name[:45]}')

        item = None
        via = ''
        if re.fullmatch(r'\d{8,14}', sku):
            try:
                item = kapy_by_sku(sku)
                if item:
                    via = 'sku'
                    log(f'  SKU hit: {str(item.get("name"))[:50]}')
            except Exception as e:
                log(f'  sku err {e}')
                time.sleep(1)

        if not item:
            # name search — only for lips / high priority or when SKU missing
            qs = []
            clean = re.sub(r'\s*[-–|].*$', '', name)
            clean = re.sub(r'\b\d+(\.\d+)?\s*(ml|g|oz)?\b', '', clean, flags=re.I).strip()
            if clean:
                qs.append(clean[:50])
            if brand and clean:
                words = [w for w in clean.split() if w.lower() != brand.lower()][:3]
                qs.append(f'{brand} {" ".join(words)}')
            # Arabic brand shortcuts for lips
            ar = {
                'SHEGLAM': 'شيجلام', 'LOLLIS': 'لوليس', 'essence': 'اسنس',
                'LANEIGE': 'لانيج', 'Cantu': 'كانتو', 'Medicube': 'ميديكيوب',
                'OLAPLEX': 'اولابلكس', 'Anua': 'انووا',
            }.get(brand)
            if ar:
                qs.append(ar)
            for q in qs[:3]:
                try:
                    results = kapy_search(q)
                    log(f'  search {q!r} n={len(results)}')
                    m = name_match_item(name, brand, results)
                    if m and m[0] >= 3:
                        item = m[1]
                        via = f'name:{m[0]}'
                        log(f'  name hit score={m[0]} {str(item.get("name"))[:50]}')
                        break
                except Exception as e:
                    log(f'  search err {e}')
                time.sleep(0.3)

        if not item:
            prog['miss'].append(pid)
            save_prog(prog)
            log('  MISS no kapy product')
            continue

        best = pick_best_image(item)
        if not best:
            prog['reject'].append(pid)
            save_prog(prog)
            log('  REJECT all frames (face/hand/lifestyle)')
            time.sleep(0.2)
            continue

        score, im, sc = best
        # skip if current already as good
        if dest.exists() and dest.stat().st_size > 400:
            try:
                cur = score_packshot(Image.open(dest))
                if (not cur['reject']) and cur['fill'] >= 0.18 and cur['ew'] >= 0.85 and cur['score'] >= score - 4:
                    prog['skip'].append(pid)
                    save_prog(prog)
                    log(f'  SKIP current better/equal {cur["score"]:.1f}')
                    del im
                    continue
            except Exception:
                pass

        save_canvas(im, dest)
        prog['ok'].append(pid)
        save_prog(prog)
        log(f'  OK via={via} score={score:.1f} fill={sc["fill"]:.2f}')
        del im
        gc.collect()
        time.sleep(0.25)

    log(f'batch done ok={len(prog["ok"])} skip={len(prog["skip"])} miss={len(prog["miss"])} reject={len(prog["reject"])}')

if __name__ == '__main__':
    main()
