import os
import json
import sqlite3
from pathlib import Path

# Paths
ROOT = Path(__file__).resolve().parents[1]
DB_PATH = ROOT / 'nutriroute.db'
API_DIR = ROOT / 'api'
BRANDS_API_DIR = API_DIR / 'brands'
BLOGS_API_DIR = API_DIR / 'blogs'

def main():
    if not DB_PATH.exists():
        print(f"Database not found at {DB_PATH}")
        return

    # Create directories
    API_DIR.mkdir(parents=True, exist_ok=True)
    BRANDS_API_DIR.mkdir(parents=True, exist_ok=True)
    BLOGS_API_DIR.mkdir(parents=True, exist_ok=True)

    conn = sqlite3.connect(str(DB_PATH))
    cur = conn.cursor()

    # 1. Export brands list (api/brands.json)
    brands = []
    rows = cur.execute("SELECT id, name, category, desc, bg, logo_path FROM brands").fetchall()
    for row in rows:
        brands.append({
            "id": row[0],
            "name": row[1],
            "category": row[2],
            "desc": row[3],
            "bg": row[4],
            "logo_path": row[5]
        })
    
    with open(API_DIR / 'brands.json', 'w', encoding='utf-8') as f:
        json.dump(brands, f, indent=2, ensure_ascii=False)
    print("Exported api/brands.json")

    # 2. Export brand details & items (api/brands/{brand_id}/items.json)
    for b in brands:
        bid = b['id']
        brand_detail = cur.execute("SELECT * FROM brands WHERE id = ?", (bid,)).fetchone()
        
        # Format brand info
        brand_cols = [col[0] for col in cur.description]
        brand_obj = dict(zip(brand_cols, brand_detail))
        
        # Format items, sizes, options
        items = cur.execute("SELECT * FROM menu_items WHERE brand_id = ?", (bid,)).fetchall()
        sizes = cur.execute("SELECT * FROM brand_sizes WHERE brand_id = ?", (bid,)).fetchall()
        options = cur.execute("SELECT * FROM brand_options WHERE brand_id = ?", (bid,)).fetchall()

        formatted_items = [
            [item[2], item[3], item[4], item[5], item[6], item[7], item[8], item[0]]
            for item in items
        ]
        formatted_sizes = [[s[2], s[3], s[0]] for s in sizes]
        formatted_options = [[o[2], o[3], o[0]] for o in options]

        data = {
            "brand": brand_obj,
            "items": formatted_items,
            "sizes": formatted_sizes,
            "options": formatted_options
        }
        
        brand_folder = BRANDS_API_DIR / bid
        brand_folder.mkdir(parents=True, exist_ok=True)
        with open(brand_folder / 'items.json', 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"Exported api/brands/{bid}/items.json")

    # 3. Export blogs list (api/blogs.json)
    blogs = []
    blog_rows = cur.execute("SELECT * FROM blogs ORDER BY created_at DESC").fetchall()
    blog_cols = [col[0] for col in cur.description]
    
    for brow in blog_rows:
        blog_obj = dict(zip(blog_cols, brow))
        blogs.append(blog_obj)
        
        # 4. Export single blog (api/blogs/{slug}.json)
        slug = blog_obj['slug']
        with open(BLOGS_API_DIR / f"{slug}.json", 'w', encoding='utf-8') as f:
            json.dump(blog_obj, f, indent=2, ensure_ascii=False)
        print(f"Exported api/blogs/{slug}.json")

    with open(API_DIR / 'blogs.json', 'w', encoding='utf-8') as f:
        json.dump(blogs, f, indent=2, ensure_ascii=False)
    print("Exported api/blogs.json")

    conn.close()
    print("Static API generation complete!")

if __name__ == '__main__':
    main()
