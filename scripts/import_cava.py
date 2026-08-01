"""
import_cava.py

Local helper to import menu and nutrition data for CAVA into the project.

USAGE (run locally):
  pip install requests beautifulsoup4
  python scripts/import_cava.py --start https://cavamacroscalculator.com/ --out scripts/cava_menu.csv --update-db

Notes:
- This script runs locally and is the user's responsibility. Do not run it here.
- It attempts simple HTML parsing to find item names and calorie/macronutrient numbers.
- Results are best-effort; verify and correct before using in production.
"""

import argparse
import csv
import re
import sqlite3
from pathlib import Path

try:
    import requests
    from bs4 import BeautifulSoup
except Exception as e:
    print('Missing dependency. Install: pip install requests beautifulsoup4')
    raise

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'scripts' / 'cava_menu.csv'
DB = ROOT / 'nutriroute.db'

def extract_from_url(url):
    print('Fetching', url)
    r = requests.get(url, timeout=15)
    r.raise_for_status()
    soup = BeautifulSoup(r.text, 'html.parser')
    items = []

    # Look for common patterns: tables, items with 'cal' or 'kcal' nearby
    # 1) Table rows
    for table in soup.find_all('table'):
        for tr in table.find_all('tr'):
            cols = [td.get_text(strip=True) for td in tr.find_all(['td','th'])]
            if not cols: continue
            # crude detection
            name = cols[0]
            nums = re.findall(r'\d+', ' '.join(cols))
            if nums:
                cal = nums[0]
            else:
                cal = ''
            items.append({'name': name, 'calories': cal})

    # 2) elements with kcal or cal text
    for el in soup.find_all(text=re.compile(r'\b(kcal|cal)\b', re.I)):
        parent = el.parent
        text = parent.get_text(' ', strip=True)
        m = re.search(r'([A-Za-z &\-()]+).*?(\d{1,4})\s*(kcal|cal)?', text)
        if m:
            name = m.group(1).strip()
            cal = m.group(2)
            items.append({'name': name, 'calories': cal})

    # de-duplicate by name
    seen = set()
    out = []
    for it in items:
        n = it['name']
        if not n or n in seen: continue
        seen.add(n)
        out.append(it)
    return out

def write_csv(rows, outpath):
    with open(outpath, 'w', newline='', encoding='utf-8') as fh:
        w = csv.writer(fh)
        w.writerow(['id','name','calories','protein','carbs','fat'])
        for i,r in enumerate(rows):
            rid = re.sub(r'[^a-z0-9]','', r['name'].lower())[:40]
            w.writerow([rid, r['name'], r.get('calories',''), r.get('protein',''), r.get('carbs',''), r.get('fat','')])

def update_db(csvpath):
    if not DB.exists():
        print('DB not found at', DB)
        return
    conn = sqlite3.connect(str(DB))
    cur = conn.cursor()
    with open(csvpath, encoding='utf-8') as fh:
        reader = csv.DictReader(fh)
        for r in reader:
            # Ensure brand exists
            try:
                logo_path = None
                svg_path = Path(ROOT) / 'brands' / 'images' / 'cava.svg'
                png_path = Path(ROOT) / 'brands' / 'images' / 'cava.png'
                if svg_path.exists():
                    logo_path = '/brands/images/cava.svg'
                elif png_path.exists():
                    logo_path = '/brands/images/cava.png'
                cur.execute('INSERT OR IGNORE INTO brands (id, name, category, desc, bg, logo_path) VALUES (?,?,?,?,?,?)',
                            ('cava', 'CAVA', 'Fast Casual', 'CAVA nutrition data imported', '#ffffff', logo_path))
            except Exception:
                pass
            # Insert menu item
            try:
                calories = int(r.get('calories') or 0)
            except Exception:
                calories = 0
            try:
                protein = int(r.get('protein') or 0)
            except Exception:
                protein = 0
            try:
                carbs = int(r.get('carbs') or 0)
            except Exception:
                carbs = 0
            try:
                fat = int(r.get('fat') or 0)
            except Exception:
                fat = 0
            try:
                cur.execute('INSERT INTO menu_items (brand_id, emoji, name, calories, protein, carbs, fat, category) VALUES (?,?,?,?,?,?,?,?)',
                            ('cava', '🥗', r.get('name') or '', calories, protein, carbs, fat, 'Entrees'))
            except Exception:
                continue
    conn.commit()
    conn.close()

def main():
    p = argparse.ArgumentParser()
    p.add_argument('--start', required=True, help='Start URL to scrape')
    p.add_argument('--out', default=str(OUT), help='Output CSV path')
    p.add_argument('--update-db', action='store_true', help='Insert into DB items table')
    args = p.parse_args()

    rows = extract_from_url(args.start)
    if not rows:
        print('No items found. Try a different start URL or provide a CSV manually.')
        return
    write_csv(rows, args.out)
    print('Wrote', args.out, 'with', len(rows), 'rows')
    if args.update_db:
        update_db(args.out)
        print('DB updated (best-effort)')

if __name__ == '__main__':
    main()
