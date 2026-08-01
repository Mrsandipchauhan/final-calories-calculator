"""
fetch_logos.py

Usage:
  python scripts/fetch_logos.py --input scripts/logos_to_fetch.csv [--png] [--update-db]

CSV format (header optional): id,name,source_url
- id: brand id used by the site (e.g., starbucks, mcdonalds)
- name: optional human name used to build a simpleicons slug
- source_url: optional direct URL to an SVG/PNG to download if CDN lookup fails

Behavior:
- Try to fetch SVG from Simple Icons CDN: https://cdn.simpleicons.org/{slug}
- If that fails and source_url present, download source_url
- Saves files to `brands/images/{id}.svg` (backups original if present)
- If --png is provided and cairoSVG is installed, render a PNG `brands/images/{id}.png`
- If --update-db is provided, updates `brands` table `logo_path` column to `brands/images/{id}.svg` (or .png when created)

Note: Run locally. Ensure you have legal right to use logos.
"""

import csv
import os
import re
import shutil
import sqlite3
import sys
from argparse import ArgumentParser
from pathlib import Path

try:
    import requests
except Exception:
    print('Please install requests: pip install requests')
    raise

try:
    import cairosvg
    HAVE_CAIROSVG = True
except Exception:
    HAVE_CAIROSVG = False

ROOT = Path(__file__).resolve().parents[1]
BRANDS_DIR = ROOT / 'brands' / 'images'
DB_PATH = ROOT / 'nutriroute.db'
BRANDS_DIR.mkdir(parents=True, exist_ok=True)

# polite user-agent for external API requests
HEADERS = {
    'User-Agent': 'NutriRouteLogoFetcher/1.0 (contact: you@example.com)'
}

parser = ArgumentParser()
parser.add_argument('--input', '-i', required=True, help='CSV file list: id,name,source_url')
parser.add_argument('--png', action='store_true', help='Also render PNG from SVG (requires cairosvg)')
parser.add_argument('--update-db', action='store_true', help='Update brands.logo_path in DB')
args = parser.parse_args()

def slugify(name):
    s = name.lower()
    s = re.sub(r"[^a-z0-9]", '', s)
    return s

rows = []
with open(args.input, newline='', encoding='utf-8') as fh:
    reader = csv.reader(fh)
    for r in reader:
        if not r: continue
        if r[0].strip().lower() in ('id','brand','brand_id'): continue
        # normalize to four columns: id,name,source_url,domain
        while len(r) < 4:
            r.append('')
        bid = r[0].strip()
        name = r[1].strip() or bid
        url = r[2].strip()
        domain = r[3].strip()
        rows.append((bid, name, url, domain))

if not rows:
    print('No rows found in input.')
    sys.exit(1)

conn = None
if args.update_db:
    if not DB_PATH.exists():
        print('Database not found at', DB_PATH)
        args.update_db = False
    else:
        conn = sqlite3.connect(str(DB_PATH))

for bid, name, source_url, domain in rows:
    print(f'Processing {bid} ({name})')
    slug = slugify(name)
    svg_url = f'https://cdn.simpleicons.org/{slug}'
    out_svg = BRANDS_DIR / f'{bid}.svg'
    out_png = BRANDS_DIR / f'{bid}.png'

    success = False
    # try simpleicons
    try:
        r = requests.get(svg_url, timeout=15)
        if r.status_code == 200 and '<svg' in r.text[:200]:
            if out_svg.exists():
                bak = out_svg.with_suffix('.svg.bak')
                shutil.copy(out_svg, bak)
            out_svg.write_text(r.text, encoding='utf-8')
            print('  -> downloaded from SimpleIcons CDN')
            success = True
    except Exception as e:
        print('  -> SimpleIcons request failed:', e)

    # fallback: try Wikimedia Commons search for '{name} logo'
    if not success:
        try:
            query = f"{name} logo"
            api = 'https://commons.wikimedia.org/w/api.php'
            params = {
                'action': 'query',
                'list': 'search',
                'srsearch': query,
                'format': 'json',
                'srlimit': 5
            }
            r = requests.get(api, params=params, timeout=15, headers=HEADERS)
            data = r.json()
            candidates = []
            for item in data.get('query', {}).get('search', []):
                title = item.get('title')
                if title and title.lower().startswith('file:'):
                    candidates.append(title)
            if not candidates and data.get('query', {}).get('search'):
                first = data['query']['search'][0]['title']
                params2 = {
                    'action': 'query',
                    'prop': 'images',
                    'titles': first,
                    'format': 'json'
                }
                r2 = requests.get(api, params=params2, timeout=15, headers=HEADERS)
                d2 = r2.json()
                pages = d2.get('query', {}).get('pages', {})
                for p in pages.values():
                    for img in p.get('images', []) if p.get('images') else []:
                        t = img.get('title')
                        if t and (t.lower().endswith('.svg') or t.lower().endswith('.png')):
                            candidates.append(t)

            for cand in candidates:
                try:
                    params3 = {
                        'action': 'query',
                        'titles': cand,
                        'prop': 'imageinfo',
                        'iiprop': 'url|mime|extmetadata',
                        'format': 'json'
                    }
                    r3 = requests.get(api, params=params3, timeout=15, headers=HEADERS)
                    d3 = r3.json()
                    pages3 = d3.get('query', {}).get('pages', {})
                    for p in pages3.values():
                        if 'imageinfo' in p:
                            info = p['imageinfo'][0]
                            url = info.get('url')
                            mime = info.get('mime') or ''
                            if url and ('svg' in mime or url.lower().endswith('.svg') or url.lower().endswith('.png')):
                                rr = requests.get(url, timeout=20, headers=HEADERS)
                                if rr.status_code == 200:
                                    if url.lower().endswith('.svg') or 'svg' in mime:
                                        if out_svg.exists():
                                            bak = out_svg.with_suffix('.svg.bak')
                                            shutil.copy(out_svg, bak)
                                        out_svg.write_bytes(rr.content)
                                    else:
                                        out_png.write_bytes(rr.content)
                                    print('  -> downloaded from Wikimedia Commons:', url)
                                    success = True
                                    break
                    if success:
                        break
                except Exception:
                    continue
        except Exception as e:
            print('  -> Wikimedia lookup failed:', e)

    # fallback to source_url
    # fallback: try domain-derived heuristics (Clearbit + common paths)
    if not success and domain:
        try:
            # try Clearbit logo service
            cb_url = f'https://logo.clearbit.com/{domain}'
            rcb = requests.get(cb_url, timeout=15, headers=HEADERS)
            if rcb.status_code == 200:
                ctype = rcb.headers.get('Content-Type','')
                if 'svg' in ctype or cb_url.lower().endswith('.svg'):
                    if out_svg.exists():
                        bak = out_svg.with_suffix('.svg.bak')
                        shutil.copy(out_svg, bak)
                    out_svg.write_bytes(rcb.content)
                else:
                    out_png.write_bytes(rcb.content)
                print('  -> downloaded from Clearbit:', cb_url)
                success = True
        except Exception as e:
            print('  -> Clearbit failed:', e)

    if not success and domain:
        common_paths = ['favicon.ico', 'logo.svg', 'logo.png', 'assets/logo.svg', 'assets/logo.png', 'images/logo.svg', 'images/logo.png', 'static/logo.svg', 'static/logo.png']
        for p in common_paths:
            try:
                url_try = f'https://{domain.rstrip('/')}/{p.lstrip('/')}'
                rr = requests.get(url_try, timeout=12, headers=HEADERS)
                if rr.status_code == 200:
                    ctype = rr.headers.get('Content-Type','')
                    if 'svg' in ctype or url_try.lower().endswith('.svg'):
                        if out_svg.exists():
                            bak = out_svg.with_suffix('.svg.bak')
                            shutil.copy(out_svg, bak)
                        out_svg.write_bytes(rr.content)
                    else:
                        out_png.write_bytes(rr.content)
                    print('  -> downloaded from site path:', url_try)
                    success = True
                    break
            except Exception:
                continue

    if not success and source_url:
        try:
            r = requests.get(source_url, timeout=20, stream=True)
            if r.status_code == 200:
                content_type = r.headers.get('Content-Type','')
                if out_svg.exists():
                    bak = out_svg.with_suffix('.svg.bak')
                    shutil.copy(out_svg, bak)
                if 'svg' in content_type or source_url.lower().endswith('.svg'):
                    out_svg.write_bytes(r.content)
                    print('  -> downloaded SVG from provided URL')
                    success = True
                else:
                    # save as PNG (binary)
                    out_png.write_bytes(r.content)
                    print('  -> downloaded raster image from provided URL')
                    success = True
            else:
                print('  -> source URL returned', r.status_code)
        except Exception as e:
            print('  -> source URL request failed:', e)

    if not success:
        print('  ! Failed to obtain logo for', bid)
        continue

    # Optionally render PNG from SVG
    if args.png and out_svg.exists():
        if not HAVE_CAIROSVG:
            print('  ! cairosvg not installed; skipping PNG render. Install: pip install cairosvg')
        else:
            try:
                cairosvg.svg2png(url=str(out_svg), write_to=str(out_png), output_width=256, output_height=256)
                print('  -> rendered PNG from SVG')
            except Exception as e:
                print('  ! cairosvg render failed:', e)

    # Optionally update DB
    if args.update_db and conn:
        path_to_store = f'brands/images/{bid}.svg' if out_svg.exists() else f'brands/images/{bid}.png'
        try:
            cur = conn.cursor()
            cur.execute('UPDATE brands SET logo_path = ? WHERE id = ?', (path_to_store, bid))
            if cur.rowcount == 0:
                print('  ! DB: no brand with id', bid)
            else:
                conn.commit()
                print('  -> DB updated logo_path')
        except Exception as e:
            print('  ! DB update failed:', e)

if conn:
    conn.close()

print('Done')
