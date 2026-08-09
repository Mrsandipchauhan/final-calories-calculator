import os
import sqlite3
import re
import xml.sax.saxutils as saxutils
from datetime import datetime
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]
DB_PATH = ROOT / 'nutriroute.db'
SITEMAPS_DIR = ROOT / 'sitemaps'

def get_site_url():
    config_path = ROOT / 'site_config.json'
    if config_path.exists():
        try:
            with open(config_path, 'r', encoding='utf-8') as f:
                config = json.load(f)
                return config.get('SITE_URL', 'https://organizeddesignva.com')
        except Exception as e:
            print(f"Error reading site_config.json: {e}")
    return 'https://organizeddesignva.com'

def get_canonical_url(raw_path, site_url):
    if not raw_path:
        return site_url
    clean_path = raw_path.split('?')[0].split('#')[0]
    clean_path = clean_path.lower()
    clean_path = re.sub(r'/+', '/', clean_path)
    if clean_path.endswith('.html'):
        clean_path = clean_path[:-5]
    if clean_path.endswith('/') and clean_path != '/':
        clean_path = clean_path[:-1]
    if not clean_path.startswith('/'):
        clean_path = '/' + clean_path
    if clean_path == '/':
        clean_path = ''
    return f"{site_url}{clean_path}"

def main():
    if not DB_PATH.exists():
        print(f"Database not found at {DB_PATH}")
        return

    site_url = get_site_url()
    today = datetime.utcnow().strftime('%Y-%m-%d')
    
    # Create sitemaps directory
    SITEMAPS_DIR.mkdir(parents=True, exist_ok=True)
    
    conn = sqlite3.connect(str(DB_PATH))
    cur = conn.cursor()

    # 1. Generate sitemap.xml (Root index)
    root_xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>{site_url}/sitemaps/sitemap-pages.xml</loc>
    <lastmod>{today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>{site_url}/sitemaps/sitemap-brands.xml</loc>
    <lastmod>{today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>{site_url}/sitemaps/sitemap-blog.xml</loc>
    <lastmod>{today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>{site_url}/sitemaps/sitemap-images.xml</loc>
    <lastmod>{today}</lastmod>
  </sitemap>
</sitemapindex>"""
    
    with open(ROOT / 'sitemap.xml', 'w', encoding='utf-8') as f:
        f.write(root_xml.strip())
    print("Generated sitemap.xml")

    # 2. Generate sitemaps/sitemap-pages.xml
    pages_xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>{get_canonical_url('/', site_url)}</loc>
    <lastmod>{today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>{get_canonical_url('/blog', site_url)}</loc>
    <lastmod>{today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>"""
    
    with open(SITEMAPS_DIR / 'sitemap-pages.xml', 'w', encoding='utf-8') as f:
        f.write(pages_xml.strip())
    print("Generated sitemaps/sitemap-pages.xml")

    # 3. Generate sitemaps/sitemap-brands.xml
    brands = cur.execute("SELECT id FROM brands").fetchall()
    brands_xml = """<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">"""
    
    for brand in brands:
        bid = brand[0]
        brands_xml += f"""
  <url>
    <loc>{get_canonical_url('/brands/' + bid, site_url)}</loc>
    <lastmod>{today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>"""
        
    brands_xml += "\n</urlset>"
    with open(SITEMAPS_DIR / 'sitemap-brands.xml', 'w', encoding='utf-8') as f:
        f.write(brands_xml.strip())
    print("Generated sitemaps/sitemap-brands.xml")

    # 4. Generate sitemaps/sitemap-blog.xml
    blogs = cur.execute("SELECT slug, updated_at, created_at FROM blogs").fetchall()
    blog_xml = """<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">"""
    
    for blog in blogs:
        slug, updated_at, created_at = blog
        blog_date = (updated_at or created_at or today).split('T')[0].split(' ')[0]
        blog_xml += f"""
  <url>
    <loc>{get_canonical_url('/blog/' + slug, site_url)}</loc>
    <lastmod>{blog_date}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>"""
        
    blog_xml += "\n</urlset>"
    with open(SITEMAPS_DIR / 'sitemap-blog.xml', 'w', encoding='utf-8') as f:
        f.write(blog_xml.strip())
    print("Generated sitemaps/sitemap-blog.xml")

    # 5. Generate sitemaps/sitemap-images.xml
    brands_data = cur.execute("SELECT id, name, desc, logo_path FROM brands").fetchall()
    blogs_data = cur.execute("SELECT slug, title, summary, image_url FROM blogs").fetchall()
    
    images_xml = """<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">"""
        
    for brand in brands_data:
        bid, name, desc, logo_path = brand
        lpath = logo_path or f"brands/images/{bid}.png"
        if not lpath.startswith('/'):
            lpath = '/' + lpath
        
        escaped_name = saxutils.escape(name)
        images_xml += f"""
  <url>
    <loc>{get_canonical_url('/brands/' + bid, site_url)}</loc>
    <image:image>
      <image:loc>{site_url}{lpath}</image:loc>
      <image:title>{escaped_name} Logo</image:title>
      <image:caption>Calorie calculator and custom order helper for {escaped_name}.</image:caption>
    </image:image>
  </url>"""

    for blog in blogs_data:
        slug, title, summary, image_url = blog
        if image_url:
            escaped_title = saxutils.escape(title)
            escaped_summary = saxutils.escape(summary or '')
            escaped_url = saxutils.escape(image_url)
            images_xml += f"""
  <url>
    <loc>{get_canonical_url('/blog/' + slug, site_url)}</loc>
    <image:image>
      <image:loc>{escaped_url}</image:loc>
      <image:title>{escaped_title}</image:title>
      <image:caption>{escaped_summary}</image:caption>
    </image:image>
  </url>"""
            
    images_xml += "\n</urlset>"
    with open(SITEMAPS_DIR / 'sitemap-images.xml', 'w', encoding='utf-8') as f:
        f.write(images_xml.strip())
    print("Generated sitemaps/sitemap-images.xml")
    
    conn.close()
    print("Sitemap generation completed successfully!")

if __name__ == '__main__':
    main()
