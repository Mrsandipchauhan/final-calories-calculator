import shutil
import sqlite3
from pathlib import Path

# Paths
ROOT = Path(__file__).resolve().parents[1]
DB_PATH = ROOT / 'nutriroute.db'
IMAGES_DIR = ROOT / 'brands' / 'images'
ARTIFACTS_DIR = Path(r"C:\Users\Hp\.gemini\antigravity-ide\brain\6161bd78-92d5-49e6-bcd7-04c4220b6798")

# Moe's Brand Data
moes_brand = {
    'id': 'moes',
    'name': "Moe's Southwest Grill",
    'category': 'SOUTHWESTERN FAST FOOD',
    'desc': "Welcome to Moe's! Customize burritos, bowls, tacos & stacks.",
    'bg': '#fbf6ec',
    'meta_title': "Moe's Southwest Grill Calorie Calculator — Custom Macros | NutriRoute",
    'meta_description': "Calculate exact calories, protein, carbs, and fat for your custom Moe's burritos, bowls, tacos, and stacks. Free interactive nutrition calculator.",
    'seo_content': """
    <div class="seo-section">
      <h2>Moe's Southwest Grill Nutrition & Macro Tracking Guide</h2>
      <p>Moe's Southwest Grill is famous for its customizable southwestern food, signature salsas, and welcoming catchphrase: <em>"Welcome to Moe's!"</em>. Because every burrito, bowl, and stack is made to order, calorie counts can fluctuate wildly depending on your selections. Our independent Moe's calorie calculator helps you build the perfect southwestern meal, track your macros in real-time, and make smart swaps. Looking to compare southwestern options? Check out our <a href="chipotle.html">Chipotle Calorie Calculator</a> or our <a href="qdoba.html">Qdoba Calorie Calculator</a>.</p>

      <h3>How to Use the Moe's Calorie Calculator</h3>
      <p>Calculating your macros at Moe's is quick and simple. Here is how to build your meal:</p>
      <ul>
        <li><strong>Select Your Base:</strong> Choose a Homewrecker Burrito, a Homewrecker Bowl, a Stack, or Tacos.</li>
        <li><strong>Choose Your Protein:</strong> Compare values for Grilled Steak, White Meat Chicken, organic Tofu, or Carnitas.</li>
        <li><strong>Add Toppings & Salsas:</strong> See how toppings like Moe's Famous Queso, guacamole, cheese, and fresh salsas affect your calorie and fat limits.</li>
      </ul>

      <h3>Popular Moe's Menu Items & Their Macros</h3>
      <p>Plan your southwestern cravings with confidence by checking these base estimates (excluding extra toppings/sauces):</p>
      <div class="seo-table-wrap">
        <table class="seo-table">
          <thead>
            <tr>
              <th>Menu Item</th>
              <th>Calories</th>
              <th>Protein</th>
              <th>Carbs</th>
              <th>Fat</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Homewrecker Burrito Base (with Tortilla)</td>
              <td>310</td>
              <td>9g</td>
              <td>50g</td>
              <td>9g</td>
            </tr>
            <tr>
              <td>Homewrecker Bowl Base (no Tortilla)</td>
              <td>45</td>
              <td>1g</td>
              <td>9g</td>
              <td>0.5g</td>
            </tr>
            <tr>
              <td>Adobo Chicken Portion</td>
              <td>160</td>
              <td>19g</td>
              <td>1g</td>
              <td>9g</td>
            </tr>
            <tr>
              <td>Sirloin Steak Portion</td>
              <td>130</td>
              <td>17g</td>
              <td>1g</td>
              <td>6g</td>
            </tr>
            <tr>
              <td>Organics Tofu Portion</td>
              <td>110</td>
              <td>9g</td>
              <td>3g</td>
              <td>7g</td>
            </tr>
            <tr>
              <td>Moe's Famous Queso (Side)</td>
              <td>230</td>
              <td>7g</td>
              <td>6g</td>
              <td>20g</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3>Making Healthy Choices at Moe's</h3>
      <p>Moe's makes eating healthy easy with fresh ingredients, but signature items like queso and chips can double your calories. Keep these tips in mind:</p>
      <div class="seo-callout-box">
        <h4>Bowl Over Burrito</h4>
        <p>A standard flour tortilla adds 310 calories and 50g of carbs to your burrito. Choosing a Burrito Bowl instead instantly saves you those calories, allowing you to load up on healthy toppings like black beans and corn salsa.</p>
      </div>
      <div class="seo-callout-box">
        <h4>Smart Sauce & Queso Management</h4>
        <p>Moe's Famous Queso is legendary, but a standard side serving adds 230 calories and 20g of fat. If you want to cut down on fat, stick to fresh salsas like Pico de Gallo (5 cal) or Kaiser Salsa (10 cal) for bold flavor with almost zero calories.</p>
      </div>
      <div class="seo-callout-box">
        <h4>Watch the Chips</h4>
        <p>Every meal at Moe's comes with free chips, but a standard basket of chips adds 370 calories and 19g of fat. Skip the chips or split them with a friend to keep your macros clean.</p>
      </div>
    </div>
    """
}

moes_items = [
    # Bases
    ['🌯', 'Homewrecker Burrito Base', 310, 9, 50, 9, 'Base'],
    ['🥣', 'Homewrecker Bowl Base', 45, 1, 9, 0.5, 'Base'],
    ['🌮', 'Soft Flour Taco Base', 90, 3, 14, 2, 'Base'],
    ['🌮', 'Crunchy Corn Taco Base', 60, 1, 8, 3, 'Base'],
    ['🌮', 'Quesadilla Base', 310, 15, 38, 12, 'Base'],
    ['🌯', 'Stack Base', 420, 18, 58, 16, 'Base'],
    ['🥗', 'Salad Bowl Base', 20, 1, 4, 0, 'Base'],
    # Proteins
    ['🍗', 'Adobo Chicken', 160, 19, 1, 9, 'Protein'],
    ['🥩', 'Sirloin Steak', 130, 17, 1, 6, 'Protein'],
    ['🥩', 'Carnitas (Shredded Pork)', 155, 16, 0, 10, 'Protein'],
    ['🥩', 'Ground Beef', 180, 14, 1, 13, 'Protein'],
    ['🧆', 'Organic Tofu', 110, 9, 3, 7, 'Protein'],
    # Beans & Rice
    ['🍚', 'White Rice', 160, 3, 35, 0, 'Rice & Beans'],
    ['🍚', 'Seasoned Brown Rice', 150, 3, 32, 1, 'Rice & Beans'],
    ['🥫', 'Black Beans', 120, 7, 22, 0.5, 'Rice & Beans'],
    ['🥫', 'Pinto Beans', 115, 6, 21, 0.5, 'Rice & Beans'],
    # Toppings
    ['🧀', 'Moe\'s Famous Queso', 230, 7, 6, 20, 'Toppings'],
    ['🥑', 'Guacamole', 100, 2, 8, 8, 'Toppings'],
    ['🧀', 'Shredded Cheese', 110, 6, 1, 9, 'Toppings'],
    ['🥛', 'Sour Cream', 110, 2, 2, 10, 'Toppings'],
    ['🍅', 'Pico de Gallo', 5, 0, 1, 0, 'Salsa'],
    ['🌽', 'Corn Salsa', 40, 1, 9, 0.5, 'Salsa'],
    ['🥨', 'Tortilla Chips', 370, 5, 44, 19, 'Sides']
]

moes_sizes = [
    ['Regular Portion', 0],
    ['Double Protein', 130]
]

moes_options = [
    ['Standard Portions', 0],
    ['Add Moe\'s Famous Queso', 230]
]

def main():
    # 1. Copy Moe's logo
    matching_files = list(ARTIFACTS_DIR.glob("moes_logo_*.png"))
    if not matching_files:
        print("No generated Moe's logo found.")
        return
        
    src_file = max(matching_files, key=lambda p: p.stat().st_mtime)
    dest_file = IMAGES_DIR / 'moes.png'
    
    shutil.copy(src_file, dest_file)
    print(f"Copied {src_file.name} to {dest_file.relative_to(ROOT)}")

    # 2. Seed database
    if not DB_PATH.exists():
        print("Database not found!")
        return

    conn = sqlite3.connect(str(DB_PATH))
    cur = conn.cursor()

    cur.execute("DELETE FROM brands WHERE id = 'moes'")
    cur.execute(
        "INSERT INTO brands (id, name, category, desc, bg, meta_title, meta_description, seo_content, logo_path) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (moes_brand['id'], moes_brand['name'], moes_brand['category'], moes_brand['desc'],
         moes_brand['bg'], moes_brand['meta_title'], moes_brand['meta_description'], moes_brand['seo_content'],
         "brands/images/moes.png")
    )
    print("Inserted Moe's brand.")

    cur.execute("DELETE FROM menu_items WHERE brand_id = 'moes'")
    for item in moes_items:
        cur.execute(
            "INSERT INTO menu_items (brand_id, emoji, name, calories, protein, carbs, fat, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            ('moes', item[0], item[1], item[2], item[3], item[4], item[5], item[6])
        )
    print(f"Inserted {len(moes_items)} Moe's menu items.")

    cur.execute("DELETE FROM brand_sizes WHERE brand_id = 'moes'")
    for size in moes_sizes:
        cur.execute(
            "INSERT INTO brand_sizes (brand_id, name, calorie_adjust) VALUES (?, ?, ?)",
            ('moes', size[0], size[1])
        )
    print("Inserted Moe's sizes.")

    cur.execute("DELETE FROM brand_options WHERE brand_id = 'moes'")
    for opt in moes_options:
        cur.execute(
            "INSERT INTO brand_options (brand_id, name, calorie_adjust) VALUES (?, ?, ?)",
            ('moes', opt[0], opt[1])
        )
    print("Inserted Moe's options.")

    conn.commit()
    conn.close()
    print("Moe's seeded in DB successfully!")

    # 3. Regenerate Static API
    print("Regenerating static API files...")
    import generate_static_api
    generate_static_api.main()

if __name__ == '__main__':
    main()
