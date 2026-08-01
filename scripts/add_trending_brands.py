import os
import sqlite3
import sys
from pathlib import Path

# Add parent directory to path so we can import from scripts/
SCRIPTS_DIR = Path(__file__).resolve().parent
ROOT = SCRIPTS_DIR.parent
sys.path.append(str(SCRIPTS_DIR))

DB_PATH = ROOT / 'nutriroute.db'
IMAGES_DIR = ROOT / 'brands' / 'images'
BRANDS_DIR = ROOT / 'brands'

trending_brands = [
    {
        'id': 'crumbl',
        'name': 'Crumbl Cookies',
        'category': 'COOKIES & SWEETS',
        'desc': 'Weekly rotating gourmet cookies, frosting & dessert boxes.',
        'bg': '#fff0f3',
        'meta_title': 'Crumbl Cookies Calorie Calculator — Macros | NutriRoute',
        'meta_description': 'Calculate calories and macros for Crumbl milk chocolate chip, pink sugar, and weekly rotating cookies. Free interactive nutrition tracker.',
        'svg': """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="50" fill="#fec5d9"/><circle cx="50" cy="50" r="30" fill="#fff" stroke="#ff8da1" stroke-width="4"/><circle cx="42" cy="40" r="3" fill="#ff8da1"/><circle cx="58" cy="42" r="3" fill="#ff8da1"/><circle cx="48" cy="55" r="3" fill="#ff8da1"/><circle cx="54" cy="58" r="3" fill="#ff8da1"/></svg>""",
        'seo_title': 'Crumbl Cookies Nutrition & Macro Tracking Guide',
        'seo_text': 'Crumbl Cookies is legendary for its massive, rotating gourmet cookie flavors. Since a single cookie can easily range from 600 to 900+ calories, our calculator helps you estimate custom serving portions (like a quarter or mini cookies) to fit these delicious treats into your macro plan.',
        'items': [
            ['🍪', 'Milk Chocolate Chip Cookie', 720, 8, 92, 36, 'Cookies'],
            ['🍪', 'Classic Pink Sugar Cookie', 760, 8, 100, 36, 'Cookies'],
            ['🧁', 'Churro Cookie', 680, 6, 86, 34, 'Cookies'],
            ['🍪', 'Buckeye Brownie Cookie', 800, 10, 104, 38, 'Cookies'],
            ['🍪', 'Key Lime Pie Cookie', 640, 6, 82, 30, 'Cookies']
        ],
        'sizes': [['Whole Cookie', 0], ['Single Serving (1/4 Cookie)', -540], ['Crumbl Mini Cookie', -320]],
        'options': [['Standard', 0], ['Add Extra Cream Cheese Frosting', 120]]
    },
    {
        'id': 'dutchbros',
        'name': 'Dutch Bros Coffee',
        'category': 'COFFEE & DRINKS',
        'desc': 'Espresso drinks, Blue Rebel energy, freezes, teas & cold brews.',
        'bg': '#eef5fc',
        'meta_title': 'Dutch Bros Calorie Calculator — Rebels & Golden Eagle | NutriRoute',
        'meta_description': 'Calculate custom calories and macros for Dutch Bros Rebels, Golden Eagle, freezes, and shakes. Live interactive nutrition calculator.',
        'svg': """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="50" fill="#0c2340"/><path d="M50 20 L30 45 L70 45 Z" fill="#ffc72c"/><path d="M40 45 L40 75 L60 75 L60 45 Z" fill="#ffc72c"/><rect x="43" y="50" width="14" height="20" fill="#015294"/></svg>""",
        'seo_title': 'Dutch Bros Coffee Nutrition & Macro Tracking Guide',
        'seo_text': 'Dutch Bros Coffee is rapidly expanding and highly popular for its creative, sweet coffee and Rebel energy drinks. Swapping standard whole milk for almond/coconut milk and choosing sugar-free syrups is the fastest way to slash empty carbs and calories while keeping the taste.',
        'items': [
            ['☕', 'Double Torture (Iced)', 390, 11, 48, 17, 'Coffee'],
            ['☕', 'Golden Eagle (Iced)', 480, 9, 58, 24, 'Coffee'],
            ['⚡', 'Blue Rebel Energy Drink', 160, 0, 40, 0, 'Rebel'],
            ['🥤', 'Picture Perfect Freeze', 680, 12, 102, 24, 'Freeze'],
            ['🍵', 'Peach Green Tea', 140, 0, 36, 0, 'Tea']
        ],
        'sizes': [['Medium (24oz)', 0], ['Small (16oz)', -100], ['Large (32oz)', 120]],
        'options': [['Standard', 0], ['Add Soft Top (Whipped)', 90], ['Sugar-Free Syrup Swap', -80]]
    },
    {
        'id': 'texasroadhouse',
        'name': 'Texas Roadhouse',
        'category': 'STEAKHOUSE',
        'desc': 'USDA Choice steaks, fresh-baked rolls, ribs & southern sides.',
        'bg': '#fcf8ee',
        'meta_title': 'Texas Roadhouse Calorie Calculator — Steaks & Rolls | NutriRoute',
        'meta_description': 'Calculate custom calories and macros for Texas Roadhouse sirloin steaks, ribs, and fresh bread rolls with honey butter. Free nutrition tool.',
        'svg': """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="50" fill="#c41230"/><path d="M25 50 L50 25 L75 50 L50 75 Z" fill="#ffffff"/><path d="M45 40 L55 40 L55 60 L45 60 Z" fill="#005a36"/></svg>""",
        'seo_title': 'Texas Roadhouse Nutrition & Macro Tracking Guide',
        'seo_text': 'Texas Roadhouse is famous for USDA choice steaks and bottomless rolls. Steaks are excellent for clean protein, but butter glazes and sides add up. Use our calculator to track sirloin, ribeye, and legendary rolls with cinnamon butter.',
        'items': [
            ['🥩', '6 oz USDA Choice Sirloin', 250, 46, 3, 6, 'Steaks'],
            ['🥩', 'Ft. Worth Ribeye 12 oz', 960, 84, 8, 64, 'Steaks'],
            ['🥖', 'Fresh-Baked Bread Roll (1pc)', 120, 3, 20, 3, 'Sides'],
            ['🍟', 'Steak Fries', 360, 5, 48, 16, 'Sides'],
            ['🥗', 'House Salad with Ranch', 310, 6, 8, 28, 'Salads']
        ],
        'sizes': [['Regular Portion', 0], ['Shareable / Full Size', 180]],
        'options': [['Standard', 0], ['Add Cinnamon Honey Butter', 80], ['Smother Steak (Mushrooms & Onions)', 120]]
    },
    {
        'id': 'wawa',
        'name': 'Wawa',
        'category': 'SANDWICHES & DELI',
        'desc': 'Custom-made Hoagies, breakfast sizzlis, mac & cheese, and coffees.',
        'bg': '#fcfcf2',
        'meta_title': 'Wawa Calorie Calculator — Hoagies & Breakfast | NutriRoute',
        'meta_description': 'Track custom calories and macros for Wawa turkey and Italian hoagies, Sizzlis, and drinks. Interactive deli nutrition calculator.',
        'svg': """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="50" fill="#c8102e"/><path d="M30 60 C35 45 65 45 70 60 Z" fill="#fff"/><circle cx="50" cy="35" r="10" fill="#ffcd00"/></svg>""",
        'seo_title': 'Wawa Nutrition & Macro Tracking Guide',
        'seo_text': 'Wawa hoagies and deli foods offer highly customizable meal options. Swapping white bread for wheat, skipping heavy mayo, and requesting light cheese lets you assemble a high-protein, calorie-friendly meal.',
        'items': [
            ['🥪', 'Classic Turkey Hoagie (10")', 780, 45, 92, 26, 'Hoagies'],
            ['🥪', 'Italian Hoagie (10")', 890, 48, 94, 35, 'Hoagies'],
            ['🍳', 'Sizzli Sausage Egg Cheese Bagel', 520, 24, 40, 30, 'Breakfast'],
            ['🥤', 'Mac & Cheese (Medium)', 470, 18, 54, 20, 'Sides'],
            ['☕', 'Iced Caramel Macchiato (16oz)', 310, 8, 48, 9, 'Beverages']
        ],
        'sizes': [['Classic (10")', 0], ['Junior (6")', -280], ['Shorti (12")', 180]],
        'options': [['Standard', 0], ['Add Mayo & Oil', 150], ['Add Extra Cheese', 80]]
    },
    {
        'id': 'cheesecakefactory',
        'name': 'The Cheesecake Factory',
        'category': 'RESTAURANT',
        'desc': 'Famous cheesecakes, glazed pastas, club salads & burger classics.',
        'bg': '#fffaf2',
        'meta_title': 'The Cheesecake Factory Calorie Calculator — Cheesecake & Pasta | NutriRoute',
        'meta_description': 'Calculate custom calories and macros for Cheesecake Factory slices, pastas, and salads. Interactive cheat meal tracker.',
        'svg': """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="50" fill="#fdf0d5"/><path d="M30 65 L50 25 L70 65 Z" fill="#c18c5d"/><path d="M50 20 C50 15 50 15 50 20 Z" stroke="#c18c5d" stroke-width="4"/></svg>""",
        'seo_title': 'The Cheesecake Factory Nutrition Guide',
        'seo_text': 'The Cheesecake Factory is famous for massive portion sizes and high calorie counts. Our calculator simplifies tracking so you can fit your favorite cheesecakes, pasta dishes, and salads into your lifestyle.',
        'items': [
            ['🍰', 'Original Cheesecake Slice', 830, 12, 62, 58, 'Cheesecake'],
            ['🍰', 'Ultimate Red Velvet Cheesecake', 1580, 18, 142, 105, 'Cheesecake'],
            ['🍔', 'Classic Burger', 990, 52, 64, 56, 'Entrees'],
            ['🍝', 'Louisiana Chicken Pasta', 2050, 78, 172, 118, 'Entrees'],
            ['🥗', 'Sheila\'s Chicken Avocado Salad', 920, 42, 34, 68, 'Salads']
        ],
        'sizes': [['Standard Portion', 0], ['Lunch / Light Portion', -320]],
        'options': [['Standard', 0], ['Add Whipped Cream Extra', 110]]
    }
]

html_template = """<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="description" content="{meta_description}">
  <title>{meta_title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Manrope:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@0,700;0,800;1,700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../styles.css">
  <link rel="stylesheet" href="calculator.css?v=1785535307635">
</head>
<body class="calc-page {brand_id}-page" data-brand="{brand_id}">
  <header class="nav wrap">
    <a class="logo" href="../index.html"><i>n</i> nutri<span>route</span></a>
    <nav>
      <a href="../index.html">Home</a>
      <a href="../blog.html">Blog</a>
      <a href="../index.html#brands">All brands</a>
      <a class="pill small" href="#calculator">Build an order <b>↓</b></a>
    </nav>
    <button class="menu" aria-label="Toggle menu">☰</button>
  </header>

  <main>
    <section class="calc-hero wrap">
      <div class="eyebrow">
        <span></span> Fresh stats in real-time. Make healthy choices.
      </div>
      <h1>{brand_name} Calories &<br><em>Nutrition Calculator</em></h1>
      <p>{brand_desc}</p>
    </section>

    <section id="calculator" class="calculator-shell">
      <div class="wrap calc-layout">
        <div class="builder">
          <div class="builder-head">
            <div>
              <small>STEP 1 OF 2</small>
              <h2>Build your order</h2>
            </div>
            <div class="brand-badge-vertical" data-brand="{brand_id}">
              <div class="badge-logo-circle"></div>
              <span class="badge-text">{brand_name}</span>
            </div>
          </div>
          
          <label class="label">Choose an item</label>
          <div class="item-grid" id="items"></div>
          
          <div class="customize" id="customize">
            <div>
              <label class="label">Portion Size</label>
              <div class="chips" id="sizes"></div>
            </div>
            <div>
              <label class="label">Customisation</label>
              <div class="chips" id="milks"></div>
            </div>
          </div>
          <p class="disclaimer">Results are estimates based on common US menu nutrition data. Location recipes and portions may vary.</p>
        </div>

        <aside class="order-card">
          <span class="order-label">YOUR ORDER</span>
          <div class="order-empty" id="orderEmpty">Pick an item to<br>see the details <span>↑</span></div>
          <div id="orderContent" hidden>
            <div class="order-title">
              <span id="orderIcon">🍔</span>
              <div>
                <h3 id="orderName">My Order</h3>
                <p id="orderOptions"></p>
              </div>
            </div>
            <div class="calories">
              <span>Estimated calories</span>
              <strong id="calories">0</strong>
              <small>kcal</small>
            </div>
            <div class="macro-bars">
              <div><span>Protein <b id="protein">0g</b></span><i><em id="proteinBar"></em></i></div>
              <div><span>Carbs <b id="carbs">0g</b></span><i><em id="carbsBar"></em></i></div>
              <div><span>Fat <b id="fat">0g</b></span><i><em id="fatBar"></em></i></div>
            </div>
            <button class="reset" id="reset">↺ Start again</button>
          </div>
        </aside>
      </div>
    </section>

    <section class="seo-article wrap">
      <h2>{seo_title}</h2>
      <p>{seo_text}</p>
      
      <h3>Healthy Customization Tips</h3>
      <div class="seo-callout-box">
        <h4>Base Smartly</h4>
        <p>Swap out refined flour buns or heavy sauces for lighter toppings like extra fresh greens, low-calorie salsas, or vinegar dressings to naturally control macros.</p>
      </div>

      <h3>Frequently Asked Questions (FAQs)</h3>
      <div class="seo-faq-accordion">
        <details>
          <summary>How accurate is this calorie calculator?</summary>
          <p>All values are based on official brand nutritional documentation, providing estimates that are highly reliable for daily tracking.</p>
        </details>
        <details>
          <summary>Can I customize my meals for keto or vegan diets?</summary>
          <p>Yes. By picking high-protein/fat choices (no buns) or switching to pure vegan items (vegetables & bean bases), you can tailor your meal to fit any dietary plan.</p>
        </details>
      </div>
    </section>

    <section class="brand-content wrap">
      <div>
        <div class="eyebrow"><span></span> {brand_name} calories, simply</div>
        <h2>Premium Flavors.<br><em>Clear information.</em></h2>
      </div>
      <div>
        <p>This {brand_name} calorie calculator helps you quickly check the nutrition of your custom orders. Choose proteins, sizes, and customizations to see changes in real-time.</p>
        <p>Actual values can vary depending on local food assembly and menu changes. Check official websites for exact current allergen and nutrition information.</p>
      </div>
    </section>

    <section id="faq" class="faq wrap mini">
      <div>
        <div class="eyebrow"><span></span> FAQs</div>
        <h2>{brand_name}<br><em>questions.</em></h2>
      </div>
      <div class="questions">
        <details open>
          <summary>Is this an official calculator?<b>+</b></summary>
          <p>No. NutriRoute is independent and is not affiliated with {brand_name}. This page is for information only.</p>
        </details>
      </div>
    </section>
    <div class="wrap" style="margin-top: 50px; margin-bottom: 45px;">
      <nav class="breadcrumbs" aria-label="breadcrumb" style="margin-bottom: 0;">
        <a href="../index.html">Home</a> › 
        <a href="../index.html#brands">Calculators</a> › 
        <span class="active-crumb">{brand_name} Calorie Calculator</span>
      </nav>
    </div>
  </main>
  <footer data-site-footer></footer>
  <script src="../footer.js"></script>
  <script src="calculator.js"></script>
</body>
</html>
"""

def main():
    # 1. Create directories
    IMAGES_DIR.mkdir(parents=True, exist_ok=True)
    BRANDS_DIR.mkdir(parents=True, exist_ok=True)

    conn = sqlite3.connect(str(DB_PATH))
    cur = conn.cursor()

    for brand in trending_brands:
        bid = brand['id']
        
        # Write SVG logo
        svg_path = IMAGES_DIR / f"{bid}.svg"
        with open(svg_path, 'w', encoding='utf-8') as f:
            f.write(brand['svg'])
        print(f"Created SVG logo at {svg_path.relative_to(ROOT)}")

        # Create HTML Page
        html_content = html_template.format(
            brand_id=bid,
            brand_name=brand['name'],
            brand_desc=brand['desc'],
            meta_title=brand['meta_title'],
            meta_description=brand['meta_description'],
            seo_title=brand['seo_title'],
            seo_text=brand['seo_text']
        )
        html_path = BRANDS_DIR / f"{bid}.html"
        with open(html_path, 'w', encoding='utf-8') as f:
            f.write(html_content)
        print(f"Created HTML page at {html_path.relative_to(ROOT)}")

        # Seed Database
        cur.execute("DELETE FROM brands WHERE id = ?", (bid,))
        cur.execute(
            "INSERT INTO brands (id, name, category, desc, bg, meta_title, meta_description, seo_content, logo_path) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (bid, brand['name'], brand['category'], brand['desc'], brand['bg'],
             brand['meta_title'], brand['meta_description'], f"<div class='seo-section'><h2>{brand['seo_title']}</h2><p>{brand['seo_text']}</p></div>",
             f"brands/images/{bid}.svg")
        )

        cur.execute("DELETE FROM menu_items WHERE brand_id = ?", (bid,))
        for item in brand['items']:
            cur.execute(
                "INSERT INTO menu_items (brand_id, emoji, name, calories, protein, carbs, fat, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                (bid, item[0], item[1], item[2], item[3], item[4], item[5], item[6])
            )

        cur.execute("DELETE FROM brand_sizes WHERE brand_id = ?", (bid,))
        for size in brand['sizes']:
            cur.execute(
                "INSERT INTO brand_sizes (brand_id, name, calorie_adjust) VALUES (?, ?, ?)",
                (bid, size[0], size[1])
            )

        cur.execute("DELETE FROM brand_options WHERE brand_id = ?", (bid,))
        for opt in brand['options']:
            cur.execute(
                "INSERT INTO brand_options (brand_id, name, calorie_adjust) VALUES (?, ?, ?)",
                (bid, opt[0], opt[1])
            )
        
        print(f"Successfully seeded {brand['name']} in database.")

    conn.commit()
    conn.close()

    # Regenerate Static API
    print("Regenerating static API files...")
    import generate_static_api
    generate_static_api.main()
    
    # Run the JSON-LD schema injector on the new pages
    print("Injecting SEO schemas...")
    import inject_seo_schemas
    inject_seo_schemas.main()
    
    # Run the breadcrumbs mover on the new pages
    print("Moving breadcrumbs to bottom...")
    import move_breadcrumbs
    move_breadcrumbs.main()
    
    print("All 5 trending brands added, schemas injected & static API compiled successfully!")

if __name__ == '__main__':
    main()
