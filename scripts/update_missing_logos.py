import sqlite3
import urllib.request
import json
from pathlib import Path

# Paths
ROOT = Path(__file__).resolve().parents[1]
DB_PATH = ROOT / 'nutriroute.db'
IMAGES_DIR = ROOT / 'brands' / 'images'

def main():
    if not DB_PATH.exists():
        print(f"Database not found at {DB_PATH}")
        return

    conn = sqlite3.connect(str(DB_PATH))
    cur = conn.cursor()

    # Get all brands
    brands = cur.execute("SELECT id, name, logo_path FROM brands").fetchall()
    
    # We will search for local SVG/PNG files first
    for brand_id, name, logo_path in brands:
        print(f"Checking brand: {brand_id} ({name})")
        
        # 1. Search for local files
        svg_path = IMAGES_DIR / f"{brand_id}.svg"
        png_path = IMAGES_DIR / f"{brand_id}.png"
        
        path_to_store = None
        if svg_path.exists():
            path_to_store = f"brands/images/{brand_id}.svg"
            print(f"  -> Found local SVG: {path_to_store}")
        elif png_path.exists():
            path_to_store = f"brands/images/{brand_id}.png"
            print(f"  -> Found local PNG: {path_to_store}")
        
        # 2. If no local file, try downloading SVG from SimpleIcons
        if not path_to_store:
            # We map some brand IDs to SimpleIcons slugs if necessary
            slug = brand_id
            if brand_id == 'chickfila':
                slug = 'chickfila'
            elif brand_id == 'pandaexpress':
                slug = 'pandaexpress'
            elif brand_id == 'fiveguys':
                slug = 'fiveguys'
            elif brand_id == 'jerseymikes':
                slug = 'jerseymikes'
            elif brand_id == 'raisingcanes':
                slug = 'raisingcanes'
            elif brand_id == 'wendys':
                slug = 'wendys'
            elif brand_id == 'dominos':
                slug = 'dominos'
            elif brand_id == 'pizzahut':
                slug = 'pizzahut'
            elif brand_id == 'popeyes':
                slug = 'popeyes'
            elif brand_id == 'sonic':
                slug = 'sonic'
            elif brand_id == 'wingstop':
                slug = 'wingstop'
                
            url = f"https://cdn.simpleicons.org/{slug}"
            try:
                print(f"  -> Downloading SVG from SimpleIcons: {url}")
                req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
                with urllib.request.urlopen(req, timeout=10) as response:
                    content = response.read().decode('utf-8')
                    if '<svg' in content:
                        svg_path.write_text(content, encoding='utf-8')
                        path_to_store = f"brands/images/{brand_id}.svg"
                        print(f"  -> Downloaded SVG: {path_to_store}")
            except Exception as e:
                print(f"  -> Failed to download from SimpleIcons: {e}")

        # 3. Update database if we found or downloaded a logo
        if path_to_store:
            cur.execute("UPDATE brands SET logo_path = ? WHERE id = ?", (path_to_store, brand_id))
            print(f"  -> Updated DB logo_path to: {path_to_store}")
        else:
            print(f"  -> Logo still missing for {brand_id}")
            
    conn.commit()
    conn.close()
    print("Logo updates completed successfully!")

if __name__ == '__main__':
    main()
