import shutil
import sqlite3
from pathlib import Path

# Paths
ROOT = Path(__file__).resolve().parents[1]
DB_PATH = ROOT / 'nutriroute.db'
IMAGES_DIR = ROOT / 'brands' / 'images'
ARTIFACTS_DIR = Path(r"C:\Users\Hp\.gemini\antigravity-ide\brain\6161bd78-92d5-49e6-bcd7-04c4220b6798")

# 7 Brew Brand Data
sevenbrew_brand = {
    'id': 'sevenbrew',
    'name': '7 Brew Coffee',
    'category': 'DRIVE-THRU COFFEE & ENERGY',
    'desc': "Drive-thru coffee, energy mixes, teas, and custom shakes.",
    'bg': '#eef2ff',
    'meta_title': "7 Brew Calorie Calculator — Espresso, Energy & Tea | NutriRoute",
    'meta_description': "Calculate exact calories, protein, carbs, and fat for your custom 7 Brew drinks. Choose your Blondie, Brunette, energy mixes, milks, and sugar-free options.",
    'seo_content': """
    <div class="seo-section">
      <h2>7 Brew Coffee Nutrition & Macro Tracking Guide</h2>
      <p>7 Brew is redefining drive-thru coffee with its fast service, energetic atmosphere, and a massive menu of custom-crafted drinks. Famous for its "Original 7" espresso classics and energy mixes, 7 Brew drinks can contain anywhere from 5 calories to over 600 calories. Because they offer total customizability of milks, syrups, and sizes, tracking your calorie intake is crucial. Our independent 7 Brew calorie calculator updates your nutritional facts instantly. Compare drink macros across cafés with our <a href="starbucks.html">Starbucks Calorie Calculator</a> or our <a href="dunkin.html">Dunkin' Calorie Calculator</a>.</p>

      <h3>How to Use the 7 Brew Calorie Calculator</h3>
      <p>Build your favorite drive-thru pick-me-up and check the nutrition metrics instantly:</p>
      <ul>
        <li><strong>Choose Your Brew:</strong> Start with standard coffee, tea, or one of the Original 7 like the Blondie or Brunette.</li>
        <li><strong>Pick Your Size:</strong> See the macro difference between Small (16 oz), Medium (24 oz), and Large (32 oz) cups.</li>
        <li><strong>Select Your Milk & Syrups:</strong> Swap whole milk for skim or plant-based milks, or choose sugar-free syrups to keep your carbohydrates under control.</li>
      </ul>

      <h3>Original 7 & Popular Drinks Macros Reference</h3>
      <p>Check out the estimated nutritional values for standard Medium (24 oz) 7 Brew drinks made with whole milk:</p>
      <div class="seo-table-wrap">
        <table class="seo-table">
          <thead>
            <tr>
              <th>Drink Name</th>
              <th>Calories</th>
              <th>Protein</th>
              <th>Carbs</th>
              <th>Fat</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>The Blondie (Caramel Blondie)</td>
              <td>480</td>
              <td>12g</td>
              <td>58g</td>
              <td>22g</td>
            </tr>
            <tr>
              <td>The Brunette (Hazelnut Mocha)</td>
              <td>510</td>
              <td>12g</td>
              <td>68g</td>
              <td>21g</td>
            </tr>
            <tr>
              <td>Smooth 7 (Irish Cream Breve)</td>
              <td>540</td>
              <td>10g</td>
              <td>52g</td>
              <td>32g</td>
            </tr>
            <tr>
              <td>White Mac (White Chocolate & Macadamia)</td>
              <td>490</td>
              <td>11g</td>
              <td>60g</td>
              <td>23g</td>
            </tr>
            <tr>
              <td>Cinnamon Roll (Brown Sugar & Cinnamon)</td>
              <td>470</td>
              <td>12g</td>
              <td>55g</td>
              <td>22g</td>
            </tr>
            <tr>
              <td>Seven Energy (Original Energy Blend)</td>
              <td>160</td>
              <td>0g</td>
              <td>40g</td>
              <td>0g</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3>Healthy Customization Tips at 7 Brew</h3>
      <p>You can enjoy the drive-thru experience without derailing your diet. Use these smart strategies:</p>
      <div class="seo-callout-box">
        <h4>Go Sugar-Free (SF)</h4>
        <p>7 Brew offers sugar-free options for almost all of their syrups, including caramel, chocolate, Irish cream, and vanilla. Swapping standard syrup for sugar-free versions can save you 100 to 200 calories per drink and cut out up to 40g of sugar.</p>
      </div>
      <div class="seo-callout-box">
        <h4>Breve vs. Standard Milk</h4>
        <p>Many of the Original 7 drinks are served as "breve" (made with half-and-half cream) which makes them incredibly creamy but triples the fat and calorie content. Swapping half-and-half for almond milk or coconut milk can slash your drink's fat content by 80%.</p>
      </div>
      <div class="seo-callout-box">
        <h4>Watch the Energy Mixes</h4>
        <p>A Large Seven Energy drink contains a significant amount of sugar (up to 80g). Switch to Sugar-Free Seven Energy with sugar-free flavor syrups to get the same caffeine boost for under 20 calories.</p>
      </div>
    </div>
    """
}

sevenbrew_items = [
    # Original 7 Classics
    ['☕', 'The Blondie', 480, 12, 58, 22, 'Original 7'],
    ['☕', 'The Brunette', 510, 12, 68, 21, 'Original 7'],
    ['☕', 'Smooth 7', 540, 10, 52, 32, 'Original 7'],
    ['☕', 'White Mac', 490, 11, 60, 23, 'Original 7'],
    ['☕', 'Cinnamon Roll', 470, 12, 55, 22, 'Original 7'],
    ['☕', 'German Chocolate', 510, 12, 66, 22, 'Original 7'],
    ['☕', 'Midnight Mint', 520, 12, 68, 22, 'Original 7'],
    # Resets (Energy)
    ['🥤', 'Seven Energy (Original)', 160, 0, 40, 0, 'Energy Drinks'],
    ['🥤', 'Seven Energy Sugar-Free', 0, 0, 0, 0, 'Energy Drinks'],
    # Coffee & Classics
    ['☕', 'House Blend Coffee', 5, 0, 1, 0, 'Coffee & Tea'],
    ['🧊', 'Cold Brew', 5, 0, 1, 0, 'Coffee & Tea'],
    ['🍵', 'Matcha Latte', 240, 8, 45, 4, 'Coffee & Tea'],
    ['🥤', 'Iced Tea (Sweet)', 120, 0, 30, 0, 'Coffee & Tea'],
    ['🥤', 'Iced Tea (Unsweet)', 0, 0, 0, 0, 'Coffee & Tea']
]

sevenbrew_sizes = [
    ['Small (16 oz)', -120],
    ['Medium (24 oz)', 0],
    ['Large (32 oz)', 140]
]

sevenbrew_options = [
    ['Whole Milk', 0],
    ['Almond Milk', -90],
    ['Oat Milk', -50],
    ['Breve (Half & Half)', 120],
    ['Sugar-Free Syrup Swap', -140]
]

def main():
    # 1. Copy 7 Brew logo
    matching_files = list(ARTIFACTS_DIR.glob("sevenbrew_logo_*.png"))
    if not matching_files:
        print("No generated 7 Brew logo found.")
        return
        
    src_file = max(matching_files, key=lambda p: p.stat().st_mtime)
    dest_file = IMAGES_DIR / 'sevenbrew.png'
    
    shutil.copy(src_file, dest_file)
    print(f"Copied {src_file.name} to {dest_file.relative_to(ROOT)}")

    # 2. Seed database
    if not DB_PATH.exists():
        print("Database not found!")
        return

    conn = sqlite3.connect(str(DB_PATH))
    cur = conn.cursor()

    cur.execute("DELETE FROM brands WHERE id = 'sevenbrew'")
    cur.execute(
        "INSERT INTO brands (id, name, category, desc, bg, meta_title, meta_description, seo_content, logo_path) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (sevenbrew_brand['id'], sevenbrew_brand['name'], sevenbrew_brand['category'], sevenbrew_brand['desc'],
         sevenbrew_brand['bg'], sevenbrew_brand['meta_title'], sevenbrew_brand['meta_description'], sevenbrew_brand['seo_content'],
         "brands/images/sevenbrew.png")
    )
    print("Inserted 7 Brew brand.")

    cur.execute("DELETE FROM menu_items WHERE brand_id = 'sevenbrew'")
    for item in sevenbrew_items:
        cur.execute(
            "INSERT INTO menu_items (brand_id, emoji, name, calories, protein, carbs, fat, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            ('sevenbrew', item[0], item[1], item[2], item[3], item[4], item[5], item[6])
        )
    print(f"Inserted {len(sevenbrew_items)} 7 Brew menu items.")

    cur.execute("DELETE FROM brand_sizes WHERE brand_id = 'sevenbrew'")
    for size in sevenbrew_sizes:
        cur.execute(
            "INSERT INTO brand_sizes (brand_id, name, calorie_adjust) VALUES (?, ?, ?)",
            ('sevenbrew', size[0], size[1])
        )
    print("Inserted 7 Brew sizes.")

    cur.execute("DELETE FROM brand_options WHERE brand_id = 'sevenbrew'")
    for opt in sevenbrew_options:
        cur.execute(
            "INSERT INTO brand_options (brand_id, name, calorie_adjust) VALUES (?, ?, ?)",
            ('sevenbrew', opt[0], opt[1])
        )
    print("Inserted 7 Brew options.")

    conn.commit()
    conn.close()
    print("7 Brew seeded in DB successfully!")

    # 3. Regenerate Static API
    print("Regenerating static API files...")
    import generate_static_api
    generate_static_api.main()

if __name__ == '__main__':
    main()
