import os
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DB_PATH = ROOT / 'nutriroute.db'
IMAGES_DIR = ROOT / 'brands' / 'images'
BRANDS_DIR = ROOT / 'brands'

# Brand definitions
new_brands = [
    {
        'id': 'innout',
        'name': 'In-N-Out Burger',
        'category': 'BURGERS',
        'desc': 'Freshly prepared West Coast burger classics & Animal Style fries.',
        'bg': '#fff4e6',
        'meta_title': 'In-N-Out Burger Calorie Calculator — Macros | NutriRoute',
        'meta_description': 'Calculate exact calories and macros for In-N-Out burgers, cheeseburgers, Animal Style fries, and shakes. Fully interactive nutrition tool.',
        'svg': """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="50" fill="#fff"/><path d="M20 70 L80 30 L50 20 Z" fill="#dd1320"/><path d="M30 65 L70 35" stroke="#f6c216" stroke-width="8" stroke-linecap="round"/></svg>""",
        'seo_title': 'In-N-Out Burger Nutrition & Macro Tracking Guide',
        'seo_text': 'In-N-Out Burger is legendary for its fresh ingredients, custom burgers, and secret menu options. Use our calculator to check the nutritional difference between standard burgers and Animal Style upgrades. Try swapping regular buns for Lettuce Wraps (Protein Style) to save on carbs.',
        'items': [
            ['🍔', 'Double-Double', 670, 37, 41, 41, 'Burgers'],
            ['🍔', 'Cheeseburger', 480, 22, 41, 27, 'Burgers'],
            ['🍔', 'Hamburger', 390, 16, 41, 19, 'Burgers'],
            ['🍟', 'French Fries', 395, 7, 54, 18, 'Sides'],
            ['🥤', 'Chocolate Shake', 590, 10, 92, 18, 'Drinks']
        ],
        'sizes': [['Standard Portion', 0]],
        'options': [['Standard', 0], ['Animal Style Sauce Add', 80]]
    },
    {
        'id': 'arbys',
        'name': "Arby's",
        'category': 'SANDWICHES',
        'desc': "Famous Roast Beef sandwiches, curly fries & cheddar sauce.",
        'bg': '#fbebe8',
        'meta_title': "Arby's Calorie Calculator — Roast Beef & Curly Fries | NutriRoute",
        'meta_description': "Track exact calories and macros for Arby's classic roast beef sandwiches, curly fries, and cheddar cheese. Free interactive nutrition calculator.",
        'svg': """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="50" fill="#ffffff"/><path d="M50 15 C35 15 35 45 35 60 C35 75 40 85 50 85 C60 85 65 75 65 60 C65 45 65 15 50 15 Z" fill="#dd1320"/></svg>""",
        'seo_title': "Arby's Nutrition & Macro Tracking Guide",
        'seo_text': "Arby's boasts 'We Have The Meats', offering a massive range of protein-packed sandwiches. From the Classic Roast Beef to their seasoned Curly Fries, check our interactive calculator to see how adding extra cheese sauce alters your daily macro budget.",
        'items': [
            ['🥪', 'Classic Roast Beef', 360, 23, 37, 14, 'Sandwiches'],
            ['🥪', 'Double Roast Beef', 510, 38, 38, 24, 'Sandwiches'],
            ['🥪', 'Beef n Cheddar Classic', 450, 23, 45, 20, 'Sandwiches'],
            ['🍟', 'Curly Fries', 410, 5, 49, 21, 'Sides'],
            ['🧀', 'Mozzarella Sticks (4pc)', 440, 15, 37, 25, 'Sides']
        ],
        'sizes': [['Small', -80], ['Medium', 0], ['Large', 120]],
        'options': [['Standard', 0], ['Extra Cheddar Cheese Sauce', 60]]
    },
    {
        'id': 'sweetgreen',
        'name': 'Sweetgreen',
        'category': 'SALADS & BOWLS',
        'desc': 'Organic warm grain bowls, fresh salads & healthy plates.',
        'bg': '#eef6f0',
        'meta_title': 'Sweetgreen Calorie Calculator — Warm Bowls & Salads | NutriRoute',
        'meta_description': 'Calculate custom macros and calories for Sweetgreen harvest bowls, salads, and vinaigrettes. Perfect for healthy meal prep tracking.',
        'svg': """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="50" fill="#134e3a"/><text x="50" y="62" font-family="'DM Mono', monospace" font-size="36" font-weight="bold" fill="#fff" text-anchor="middle">sg</text></svg>""",
        'seo_title': 'Sweetgreen Nutrition & Macro Tracking Guide',
        'seo_text': 'Sweetgreen is a premium destination for healthy, custom-made salad and warm bowls. Packed with whole grains, seeds, and fresh proteins, our calorie calculator tracks your exact vitamins, macros, and diet lifestyles in real-time.',
        'items': [
            ['🥣', 'Harvest Bowl', 705, 36, 48, 41, 'Warm Bowls'],
            ['🥣', 'Crispy Rice Bowl', 520, 14, 66, 23, 'Warm Bowls'],
            ['🥗', 'Guacamole Greens', 530, 24, 26, 38, 'Salads'],
            ['🥣', 'Buffalo Chicken Bowl', 630, 38, 42, 34, 'Warm Bowls'],
            ['🥗', 'Kale Caesar', 400, 19, 12, 30, 'Salads']
        ],
        'sizes': [['Standard Portion', 0]],
        'options': [['Standard', 0], ['Double Protein Add', 180]]
    },
    {
        'id': 'shakeshack',
        'name': 'Shake Shack',
        'category': 'BURGERS',
        'desc': 'Premium Angus beef burgers, crinkle-cut fries & classic shakes.',
        'bg': '#f5faf3',
        'meta_title': 'Shake Shack Calorie Calculator — ShackBurger & Fries | NutriRoute',
        'meta_description': 'Find calories and macros for Shake Shack single & double burgers, cheese fries, and shakes. Interactive custom order calculator.',
        'svg': """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="50" fill="#000"/><path d="M30 45 C30 30 70 30 70 45 Z" fill="#5bab46"/><rect x="25" y="48" width="50" height="8" rx="2" fill="#ffb300"/><path d="M25 60 C25 68 75 68 75 60 Z" fill="#5bab46"/></svg>""",
        'seo_title': 'Shake Shack Nutrition & Macro Tracking Guide',
        'seo_text': 'Shake Shack serves elevated versions of American fast-food classics. Made with premium Angus beef, tracking their calorie and macronutrient counts helps you fit ShackBurgers into your flexible dieting schedule.',
        'items': [
            ['🍔', 'ShackBurger Single', 500, 29, 26, 30, 'Burgers'],
            ['🍔', 'ShackBurger Double', 770, 50, 27, 52, 'Burgers'],
            ['🍔', 'SmokeShack Single', 570, 34, 28, 35, 'Burgers'],
            ['🍟', 'Crinkle Cut Fries', 420, 5, 56, 19, 'Sides'],
            ['🥤', 'Classic Shake Chocolate', 750, 15, 88, 38, 'Shakes']
        ],
        'sizes': [['Single Portion', 0], ['Double Burger Upgrade', 270]],
        'options': [['Standard', 0], ['Add Smoked Bacon', 70]]
    },
    {
        'id': 'carlsjr',
        'name': "Carl's Jr.",
        'category': 'BURGERS',
        'desc': 'Charbroiled thickburgers, chicken clubs & seasoned fries.',
        'bg': '#fffdeb',
        'meta_title': "Carl's Jr. Calorie Calculator — Charbroiled Burgers | NutriRoute",
        'meta_description': "Find calorie counts and nutritional values for Carl's Jr. Charbroiled burgers, tenders, and waffle fries. Dynamic macros tracker.",
        'svg': """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="50" fill="#fff"/><path d="M50 15 L59 38 L84 38 L64 53 L72 76 L50 61 L28 76 L36 53 L16 38 L41 38 Z" fill="#ffc107"/></svg>""",
        'seo_title': "Carl's Jr. Nutrition & Macro Tracking Guide",
        'seo_text': "Carl's Jr. is legendary for flame-charbroiled Thickburgers and Western Bacon Cheeseburgers. Check how different bun configurations and extra cheese selections affect your calorie intake using our calculator.",
        'items': [
            ['🍔', 'Famous Star with Cheese', 670, 28, 50, 38, 'Burgers'],
            ['🍔', 'Super Star with Cheese', 920, 47, 50, 59, 'Burgers'],
            ['🍔', 'Western Bacon Cheeseburger', 750, 34, 75, 34, 'Burgers'],
            ['🥪', 'Charbroiled Chicken Club', 620, 38, 48, 30, 'Sandwiches'],
            ['🍟', 'Waffle Fries', 360, 4, 44, 19, 'Sides']
        ],
        'sizes': [['Medium', 0], ['Large Upgrade', 140]],
        'options': [['Standard', 0], ['Add Extra Cheese Slice', 60]]
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
  </header>

  <main>
    <section class="calc-hero wrap">
      <nav class="breadcrumbs" aria-label="breadcrumb">
        <a href="../index.html">Home</a> › 
        <a href="../index.html#brands">Calculators</a> › 
        <span class="active-crumb">{brand_name} Calculator</span>
      </nav>
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
  </main>

  <footer data-site-footer></footer>
  <script src="../footer.js?v=1785571469076"></script>
  <script src="calculator.js?v=1785535923024"></script>
</body>
</html>
"""

def main():
    # 1. Create directories
    IMAGES_DIR.mkdir(parents=True, exist_ok=True)
    BRANDS_DIR.mkdir(parents=True, exist_ok=True)

    conn = sqlite3.connect(str(DB_PATH))
    cur = conn.cursor()

    for brand in new_brands:
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
    print("All 5 major brands added & static API compiled successfully!")

if __name__ == '__main__':
    main()
