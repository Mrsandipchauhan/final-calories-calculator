import sqlite3
from pathlib import Path

# Paths
ROOT = Path(__file__).resolve().parents[1]
DB_PATH = ROOT / 'nutriroute.db'

# CAVA Brand Data
cava_brand = {
    'id': 'cava',
    'name': 'CAVA',
    'category': 'MEDITERRANEAN FAST CASUAL',
    'desc': 'Build your customizable Mediterranean bowls & pitas',
    'bg': '#f5f0eb',
    'meta_title': "CAVA Calorie Calculator — Mediterranean Bowls & Pitas | NutriRoute",
    'meta_description': "Calculate exact calories, protein, carbs, and fat for your custom CAVA bowl or pita. Choose your greens, grains, proteins, dips, and dressings.",
    'seo_content': """
    <div class="seo-section">
      <h2>How to Use the CAVA Calorie Calculator</h2>
      <p>Select your base (like a Greens & Grains bowl or Pita), choose your protein (such as Grilled Chicken or Spicy Lamb Meatballs), and add your favorite dips, toppings, and dressings. The calorie and macronutrient totals will update in real-time based on CAVA's official nutrition information.</p>
      
      <div class="info-card tip">
        <strong>Healthy Eating Tip</strong>
        <p>CAVA's dressings and dips can add substantial calories. Swapping a heavy Garlic Dressing (130 cal) for Yogurt Dill (40 cal) or Tzatziki (30 cal) is a great way to cut down calories without losing the creamy texture.</p>
      </div>

      <h2>CAVA Nutrition Guide</h2>
      <p>CAVA offers some of the most customizable and nutrient-dense options in fast-casual dining. A typical salad bowl with grilled chicken, hummus, cucumber, tomato, and a light dressing can be as low as 350-400 calories, packed with high-quality protein and fiber.</p>
      
      <h2>Low-Calorie CAVA Ordering Strategies</h2>
      <ul>
        <li><strong>Choose a Salad Base:</strong> Opting for Supergreens instead of Rice saves about 150-200 calories.</li>
        <li><strong>Go lean on proteins:</strong> Grilled Chicken (170 cal) and Falafel (190 cal) are lighter than Spicy Lamb Meatballs (240 cal).</li>
        <li><strong>Dip smart:</strong> Tzatziki (30 cal) and Harissa (45 cal) are lower calorie options than Crazy Feta (70 cal) or Hummus (70 cal).</li>
      </ul>
    </div>
    """
}

cava_items = [
    # Bases
    ['🥣', 'Greens + Grains Bowl Base', 200, 4, 38, 3, 'Base'],
    ['🥣', 'Grain Bowl Base', 280, 6, 52, 4, 'Base'],
    ['🥗', 'Salad Bowl Base', 45, 2, 8, 1, 'Base'],
    ['🫓', 'Pita Base', 220, 7, 43, 2, 'Base'],
    # Proteins
    ['🍗', 'Grilled Chicken', 170, 26, 1, 6, 'Protein'],
    ['🍗', 'Harissa Honey Chicken', 215, 25, 7, 9, 'Protein'],
    ['🥩', 'Spicy Lamb Meatballs', 240, 17, 5, 17, 'Protein'],
    ['🥩', 'Grilled Steak', 160, 21, 0, 8, 'Protein'],
    ['🧆', 'Falafel', 190, 5, 19, 10, 'Protein'],
    ['🥔', 'Roasted White Sweet Potato', 120, 2, 24, 2, 'Protein'],
    # Dips & Spreads
    ['🧀', 'Crazy Feta', 70, 2, 1, 6, 'Dips'],
    ['🥣', 'Tzatziki', 30, 1, 2, 2, 'Dips'],
    ['🥣', 'Hummus', 70, 2, 6, 4, 'Dips'],
    ['🌶️', 'Harissa', 45, 1, 3, 3, 'Dips'],
    ['🥣', 'Red Pepper Hummus', 80, 2, 6, 5, 'Dips'],
    # Toppings
    ['🧀', 'Crumbled Feta', 75, 5, 1, 6, 'Toppings'],
    ['🧅', 'Pickled Onions', 15, 0, 3, 0, 'Toppings'],
    ['🥒', 'Tomato + Cucumber', 15, 0, 3, 0, 'Toppings'],
    ['🥨', 'Pita Chips', 115, 2, 16, 5, 'Toppings'],
    # Dressings
    ['🧴', 'Garlic Dressing', 130, 0, 1, 14, 'Dressings'],
    ['🧴', 'Lemon Herb Tahini', 110, 2, 3, 10, 'Dressings'],
    ['🧴', 'Greek Vinaigrette', 140, 0, 1, 15, 'Dressings'],
    ['🧴', 'Yogurt Dill', 40, 1, 2, 3, 'Dressings']
]

cava_sizes = [
    ['Regular Bowl', 0],
    ['Double Protein Bowl', 150]
]

cava_options = [
    ['No Pita', 0],
    ['Include Pita on Side', 220]
]

def main():
    if not DB_PATH.exists():
        print("Database not found!")
        return

    conn = sqlite3.connect(str(DB_PATH))
    cur = conn.cursor()

    # 1. Insert CAVA brand
    cur.execute("DELETE FROM brands WHERE id = 'cava'")
    cur.execute(
        "INSERT INTO brands (id, name, category, desc, bg, meta_title, meta_description, seo_content, logo_path) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (cava_brand['id'], cava_brand['name'], cava_brand['category'], cava_brand['desc'],
         cava_brand['bg'], cava_brand['meta_title'], cava_brand['meta_description'], cava_brand['seo_content'],
         "brands/images/cava.png")
    )
    print("Inserted CAVA brand.")

    # 2. Insert CAVA items
    cur.execute("DELETE FROM menu_items WHERE brand_id = 'cava'")
    for item in cava_items:
        cur.execute(
            "INSERT INTO menu_items (brand_id, emoji, name, calories, protein, carbs, fat, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            ('cava', item[0], item[1], item[2], item[3], item[4], item[5], item[6])
        )
    print(f"Inserted {len(cava_items)} CAVA menu items.")

    # 3. Insert CAVA sizes
    cur.execute("DELETE FROM brand_sizes WHERE brand_id = 'cava'")
    for size in cava_sizes:
        cur.execute(
            "INSERT INTO brand_sizes (brand_id, name, calorie_adjust) VALUES (?, ?, ?)",
            ('cava', size[0], size[1])
        )
    print("Inserted CAVA sizes.")

    # 4. Insert CAVA options
    cur.execute("DELETE FROM brand_options WHERE brand_id = 'cava'")
    for opt in cava_options:
        cur.execute(
            "INSERT INTO brand_options (brand_id, name, calorie_adjust) VALUES (?, ?, ?)",
            ('cava', opt[0], opt[1])
        )
    print("Inserted CAVA options.")

    conn.commit()
    conn.close()
    print("CAVA seeded successfully!")

if __name__ == '__main__':
    main()
