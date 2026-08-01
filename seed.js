const { db, initDb } = require('./db');

const brands = [
  { id: "starbucks", name: "Starbucks", category: "COFFEE & CAFÉ", desc: "Drinks, bakery & breakfast", bg: "#dcebc9" },
  { id: "subway", name: "Subway", category: "SANDWICHES", desc: "Build your perfect sub", bg: "#ffe0ac" },
  { id: "mcdonalds", name: "McDonald’s", category: "QUICK SERVICE", desc: "Meals, sides & drinks", bg: "#ffcec4" },
  { id: "chipotle", name: "Chipotle", category: "MEXICAN GRILL", desc: "Burritos, bowls & salads", bg: "#fbece6" },
  { id: "tacobell", name: "Taco Bell", category: "MEXICAN FAST FOOD", desc: "Tacos, burritos & specialties", bg: "#f6effb" },
  { id: "dunkin", name: "Dunkin'", category: "COFFEE & DONUTS", desc: "Donuts, coffee & breakfast", bg: "#fff0e6" },
  { id: "chickfila", name: "Chick-fil-A", category: "CHICKEN", desc: "Sandwiches, nuggets & fries", bg: "#fdf0f1" },
  { id: "panera", name: "Panera Bread", category: "BAKERY & CAFÉ", desc: "Soups, salads & sandwiches", bg: "#f2f6ee" },
  { id: "pandaexpress", name: "Panda Express", category: "CHINESE FAST FOOD", desc: "Orange chicken, bowls & sides", bg: "#fdeeee" },
  { id: "qdoba", name: "Qdoba", category: "MEXICAN EATS", desc: "Bowls, burritos & tacos", bg: "#fef1e8" }
];

const menuData = {
  qdoba: {
    items: [
      ['🌯', 'Burrito Tortilla', 300, 8, 48, 8, 'Base'],
      ['🌮', 'Taco Shell (Crunchy)', 60, 1, 8, 3, 'Base'],
      ['🌮', 'Soft Flour Tortilla (Taco)', 90, 2, 14, 2, 'Base'],
      ['🥗', 'Salad Shell', 320, 6, 32, 18, 'Base'],
      ['🥩', 'Grilled Adobo Chicken', 190, 28, 1, 7, 'Protein'],
      ['🥩', 'Grilled Adobo Steak', 180, 22, 1, 8, 'Protein'],
      ['🥩', 'Smoked Brisket', 180, 17, 1, 12, 'Protein'],
      ['🥩', 'Impossible Plant-Based', 170, 14, 9, 8, 'Protein'],
      ['🥩', 'Pulled Pork', 160, 16, 2, 9, 'Protein'],
      ['🍚', 'Cilantro Lime Rice', 180, 4, 38, 2, 'Rice & Beans'],
      ['🍚', 'Brown Rice', 170, 4, 34, 3, 'Rice & Beans'],
      ['🥫', 'Black Beans', 140, 9, 23, 1, 'Rice & Beans'],
      ['🥫', 'Pinto Beans', 140, 8, 24, 1, 'Rice & Beans'],
      ['🧀', '3-Cheese Queso', 120, 5, 4, 9, 'Toppings'],
      ['🧀', 'Queso Diablo', 120, 5, 4, 9, 'Toppings'],
      ['🥑', 'Guacamole', 110, 2, 6, 10, 'Toppings'],
      ['🍅', 'Pico de Gallo', 10, 0, 2, 0, 'Salsa'],
      ['🌶️', 'Salsa Verde', 15, 0, 3, 0, 'Salsa'],
      ['🌶️', 'Salsa Roja', 15, 0, 3, 0, 'Salsa'],
      ['🌽', 'Roasted Chile Corn Salsa', 60, 2, 12, 1, 'Salsa'],
      ['🥬', 'Shredded Lettuce', 5, 0, 1, 0, 'Toppings'],
      ['🧀', 'Shredded Cheese', 110, 7, 1, 9, 'Toppings'],
      ['🥛', 'Sour Cream', 110, 2, 2, 10, 'Toppings'],
      ['🧅', 'Fajita Veggies', 30, 1, 5, 1, 'Toppings'],
      ['🌮', 'Tortilla Chips', 390, 5, 49, 19, 'Sides']
    ],
    sizes: [
      ['Regular', 0],
      ['Double', 100]
    ],
    options: [
      ['Half', -50],
      ['Regular', 0],
      ['Extra', 50]
    ]
  },
  pandaexpress: {
    items: [
      ['🥡', 'Teriyaki Sauce', 70, 0, 16, 0, 'Sauces'],
      ['🌯', 'Apple Pie Roll', 150, 2, 30, 3, 'Appetizers & Extras'],
      ['🥡', 'Sweet & Sour Sauce', 70, 0, 21, 0, 'Sauces'],
      ['🥡', 'Chili Sauce', 10, 0, 2, 0, 'Sauces'],
      ['🥡', 'Soy Sauce', 5, 0, 0, 0, 'Sauces'],
      ['🥡', 'Potsticker Sauce', 10, 0, 3, 0, 'Sauces'],
      ['🥡', 'Hot Mustard', 10, 0, 0, 1, 'Entrees'],
      ['🥠', 'Fortune Cookie', 20, 0, 5, 0, 'Appetizers & Extras'],
      ['🥠', 'Tree Top Apple Crisps', 40, 0, 10, 0, 'Appetizers & Extras'],
      ['🥩', 'Beijing Beef', 480, 14, 46, 27, 'Entrees'],
      ['🥩', 'Black Pepper Sirloin Steak', 180, 19, 12, 6, 'Entrees'],
      ['🥩', 'Broccoli Beef', 150, 15, 12, 6, 'Entrees'],
      ['🍗', 'Black Pepper Chicken', 280, 13, 15, 19, 'Entrees'],
      ['🍗', 'Hot Orange Chicken', 550, 17, 59, 27, 'Entrees'],
      ['🍗', 'Kung Pao Chicken', 320, 17, 15, 21, 'Entrees'],
      ['🍗', 'Grilled Teriyaki Chicken', 275, 33, 14, 10, 'Entrees'],
      ['🍗', 'Mushroom Chicken', 220, 13, 10, 14, 'Entrees'],
      ['🍗', 'Orange Chicken', 510, 16, 53, 24, 'Entrees'],
      ['🍗', 'Potato Chicken', 190, 8, 18, 10, 'Entrees'],
      ['🍗', 'Chicken Egg Roll (1 roll)', 200, 6, 20, 10, 'Entrees'],
      ['🍗', 'Chicken Potsticker (3 pcs)', 160, 6, 20, 6, 'Entrees'],
      ['🥡', 'Cream Cheese Rangoon (3 pcs)', 190, 5, 24, 8, 'Entrees'],
      ['🌯', 'Vegetable Spring Roll (2 rolls)', 240, 4, 24, 14, 'Appetizers & Extras'],
      ['🍤', 'Honey Walnut Shrimp', 430, 13, 32, 28, 'Entrees'],
      ['🍤', 'Wok-Fired Shrimp', 190, 17, 19, 5, 'Entrees'],
      ['🍚', 'Chow Mein', 600, 15, 94, 23, 'Sides'],
      ['🍚', 'Fried Rice', 620, 13, 101, 19, 'Sides'],
      ['🍚', 'White Steamed Rice', 520, 10, 118, 0, 'Sides'],
      ['🥡', 'Super Greens', 130, 6, 7, 4, 'Entrees'],
      ['🥡', 'Eggplant Tofu', 340, 7, 3, 24, 'Entrees'],
      ['🍗', 'Honey Sesame Chicken Breast', 340, 16, 35, 15, 'Entrees'],
      ['🍗', 'String Bean Chicken Breast', 210, 12, 13, 12, 'Entrees'],
      ['🍗', 'Sweetfire Chicken Breast', 360, 15, 40, 15, 'Entrees'],
      ['🥤', 'cherry coca-cola - kids', 150, 0, 42, 0, 'Drinks'],
      ['🥤', 'coca-cola - kids', 150, 0, 40, 0, 'Drinks'],
      ['🥤', 'coca-cola zero sugar - kids', 0, 0, 0, 0, 'Drinks'],
      ['🥤', 'glaceau vitaminwater squeezed zero - kids', 0, 0, 1, 0, 'Drinks']
    ],
    sizes: [],
    options: []
  },
  starbucks: {
    items: [
      ['☕', 'Caffè Latte', 190, 13, 18, 7, 'Drinks'],
      ['🧊', 'Iced Brown Sugar Oatmilk Shaken Espresso', 120, 2, 23, 1, 'Drinks'],
      ['🍫', 'White Chocolate Mocha', 430, 14, 56, 18, 'Drinks'],
      ['☕', 'Caramel Macchiato', 250, 10, 35, 7, 'Drinks'],
      ['🧊', 'Cold Brew with Salted Caramel Cold Foam', 240, 2, 25, 14, 'Drinks'],
      ['🍓', 'Pink Drink', 140, 1, 28, 2.5, 'Drinks'],
      ['🍵', 'Iced Matcha Latte', 200, 9, 34, 5, 'Drinks'],
      ['🥐', 'Butter Croissant', 250, 5, 32, 13, 'Food & Bakery'],
      ['🥚', 'Egg White Sous Vide Egg Bites', 170, 12, 11, 8, 'Food & Bakery'],
      ['🥪', 'Turkey Bacon & Egg White Sandwich', 230, 17, 28, 5, 'Food & Bakery'],
      ['🥯', 'Sprouted Grain Bagel', 330, 12, 64, 1.5, 'Food & Bakery']
    ],
    sizes: [['Tall', -30], ['Grande', 0], ['Venti', 50]],
    options: [['2% milk', 0], ['Oat milk', 20], ['Almond milk', -20]]
  },
  subway: {
    items: [
      ['🥪', 'Turkey Cali Club', 530, 34, 50, 24, 'Classic Subs'],
      ['🥪', 'Veggie Delite', 230, 8, 44, 3, 'Classic Subs'],
      ['🥪', 'Italian B.M.T.', 410, 20, 45, 18, 'Classic Subs'],
      ['🥪', 'Tuna Sub', 480, 20, 44, 25, 'Classic Subs'],
      ['🥪', 'Meatball Marinara', 480, 22, 59, 18, 'Classic Subs'],
      ['🍪', 'Chocolate Chip Cookie', 210, 2, 30, 10, 'Sides & Sweets'],
      ['🍟', 'Lay\'s Potato Chips', 230, 3, 23, 15, 'Sides & Sweets']
    ],
    sizes: [['6 inch', 0], ['Footlong', 250]],
    options: [['Italian bread', 0], ['Wheat bread', 10], ['Flatbread', 20]]
  },
  mcdonalds: {
    items: [
      ['🍔', 'Big Mac', 590, 25, 46, 34, 'Burgers & Chicken'],
      ['🍔', 'Quarter Pounder with Cheese', 520, 30, 42, 26, 'Burgers & Chicken'],
      ['🍔', 'Double Cheeseburger', 450, 25, 34, 24, 'Burgers & Chicken'],
      ['🍗', '10 pc. Chicken McNuggets', 410, 23, 25, 25, 'Burgers & Chicken'],
      ['🍔', 'McChicken', 400, 14, 39, 21, 'Burgers & Chicken'],
      ['🥚', 'Egg McMuffin', 310, 17, 30, 13, 'Breakfast'],
      ['🍟', 'Medium Fries', 320, 4, 43, 15, 'Sides & Snacks'],
      ['🥧', 'Baked Apple Pie', 230, 2, 32, 11, 'Sides & Snacks'],
      ['🥤', 'Coca-Cola (Medium)', 220, 0, 59, 0, 'Drinks & Shakes']
    ],
    sizes: [['Regular', 0], ['Large', 150]],
    options: [['Water', 0], ['Diet soda', 0], ['Regular soda', 140]]
  },
  chipotle: {
    items: [
      ['🥣', 'Chicken Burrito Bowl', 510, 42, 57, 15, 'Entrees'],
      ['🌯', 'Steak Burrito', 830, 43, 102, 30, 'Entrees'],
      ['🧀', 'Carnitas Quesadilla', 950, 46, 75, 51, 'Entrees'],
      ['🥑', 'Chips & Guacamole', 730, 8, 73, 46, 'Sides & Drinks']
    ],
    sizes: [['Normal Portion', 0], ['Double Protein', 150]],
    options: [['No Add-ons', 0], ['Add Guacamole', 230], ['Add Queso Blanco', 120]]
  },
  tacobell: {
    items: [
      ['🌮', 'Crunchwrap Supreme', 540, 16, 71, 21, 'Specialties'],
      ['🌮', 'Cheesy Gordita Crunch', 500, 20, 41, 28, 'Tacos & Burritos'],
      ['🌯', 'Bean Burrito', 350, 13, 54, 9, 'Tacos & Burritos'],
      ['🥨', 'Cinnamon Twists', 170, 1, 27, 6, 'Sides & Sweets']
    ],
    sizes: [['Standard', 0], ['Supreme Style', 30]],
    options: [['Seasoned Beef', 0], ['Grilled Chicken', -20], ['Black Beans', -50]]
  },
  dunkin: {
    items: [
      ['🍩', 'Boston Kreme Donut', 300, 4, 39, 15, 'Donuts & Bakery'],
      ['🍩', 'Glazed Donut', 240, 3, 33, 11, 'Donuts & Bakery'],
      ['🥐', 'Sausage Egg & Cheese Croissant', 720, 21, 43, 52, 'Breakfast Sandwiches'],
      ['☕', 'Original Blend Hot Coffee', 5, 0, 0, 0, 'Drinks'],
      ['☕', 'Iced Caramel Latte', 350, 9, 54, 11, 'Drinks']
    ],
    sizes: [['Small', -70], ['Medium', 0], ['Large', 80]],
    options: [['Whole Milk', 0], ['Oat Milk', -20], ['Skim Milk', -50]]
  },
  chickfila: {
    items: [
      ['🍔', 'Chick-fil-A Chicken Sandwich', 440, 28, 41, 19, 'Entrees'],
      ['🍔', 'Spicy Deluxe Sandwich', 540, 34, 43, 25, 'Entrees'],
      ['🍟', 'Waffle Potato Fries', 420, 5, 45, 24, 'Sides & Salads'],
      ['🥤', 'Freshly-Brewed Iced Tea Sweet', 120, 0, 31, 0, 'Drinks']
    ],
    sizes: [['Small', -100], ['Medium', 0], ['Large', 120]],
    options: [['No Sauce', 0], ['Chick-fil-A Sauce', 140], ['Polynesian Sauce', 110]]
  },
  panera: {
    items: [
      ['🥣', 'Broccoli Cheddar Soup', 370, 15, 30, 21, 'Soups & Salads'],
      ['🥪', 'Bacon Turkey Bravo Sandwich', 720, 41, 63, 33, 'Sandwiches & Bowls'],
      ['🥯', 'Cinnamon Crunch Bagel', 420, 10, 82, 7, 'Bakery']
    ],
    sizes: [['Cup / Half', -150], ['Bowl / Whole', 0]],
    options: [['No Side', 0], ['French Baguette', 180], ['Apple', 80]]
  }
};

const blogsData = [
  {
    title: "5 Simple Swaps to Lower Starbucks Calories",
    slug: "5-simple-swaps-starbucks-calories",
    summary: "Love Starbucks coffee but want to cut down on extra calories? Discover five easy and delicious drink customization tricks to keep your fitness goals on track.",
    content: "Customizing your coffee is one of the easiest ways to save calories without sacrificing taste. Here are the top 5 simple swaps you can make at Starbucks:\n\n1. **Swap Whole Milk for Almond Milk**: Almond milk has about 60 calories per cup, compared to 150 calories for whole milk.\n2. **Choose Sugar-Free Syrups**: Swapping standard syrup for sugar-free vanilla saves about 20 calories and 5g of sugar per pump.\n3. **Skip the Whipped Cream**: Whipped cream on a Grande mocha adds roughly 80 to 110 calories.\n4. **Downsize Your Cup**: Simply swapping from Venti to Grande or Tall reduces calorie intake automatically.\n5. **Go for Cold Brew**: Cold brews naturally taste sweeter and require less cream and syrup than hot drip coffees.",
    image_url: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&q=80&w=600"
  },
  {
    title: "Understanding Macros: Protein, Carbs, and Fat",
    slug: "understanding-macros-nutrition-guide",
    summary: "Calorie counting is useful, but tracking macronutrients gives you the complete picture. Learn what protein, carbs, and fat actually do for your body.",
    content: "A healthy diet is about more than just a number. It's about what types of calories you eat. The three primary macronutrients are:\n\n- **Protein (4 calories/gram)**: Essential for repairing muscles and keeping you full.\n- **Carbs (4 calories/gram)**: The body's primary source of energy, fuel for active lifestyles.\n- **Fat (9 calories/gram)**: Vital for hormone production, vitamin absorption, and brain health.\n\nNutriRoute helps you track these ratios in real-time.",
    image_url: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&q=80&w=600"
  }
];

async function seed() {
  await initDb();
  console.log('Seeding brands...');

  for (const brand of brands) {
    await db.runAsync(
      `INSERT OR IGNORE INTO brands (id, name, category, desc, bg) VALUES (?, ?, ?, ?, ?)`,
      [brand.id, brand.name, brand.category, brand.desc, brand.bg]
    );

    const data = menuData[brand.id];
    if (data) {
      console.log(`Seeding items and configurations for ${brand.name}...`);
      
      // Clear existing first
      await db.runAsync(`DELETE FROM menu_items WHERE brand_id = ?`, [brand.id]);
      await db.runAsync(`DELETE FROM brand_sizes WHERE brand_id = ?`, [brand.id]);
      await db.runAsync(`DELETE FROM brand_options WHERE brand_id = ?`, [brand.id]);

      // Seed items
      for (const item of data.items) {
        await db.runAsync(
          `INSERT INTO menu_items (brand_id, emoji, name, calories, protein, carbs, fat, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [brand.id, item[0], item[1], item[2], item[3], item[4], item[5], item[6]]
        );
      }

      // Seed sizes
      for (const size of data.sizes) {
        await db.runAsync(
          `INSERT INTO brand_sizes (brand_id, name, calorie_adjust) VALUES (?, ?, ?)`,
          [brand.id, size[0], size[1]]
        );
      }

      // Seed options
      for (const option of data.options) {
        await db.runAsync(
          `INSERT INTO brand_options (brand_id, name, calorie_adjust) VALUES (?, ?, ?)`,
          [brand.id, option[0], option[1]]
        );
      }
    }
  }

  console.log('Seeding blog articles...');
  for (const blog of blogsData) {
    await db.runAsync(
      `INSERT OR IGNORE INTO blogs (title, slug, summary, content, image_url) VALUES (?, ?, ?, ?, ?)`,
      [blog.title, blog.slug, blog.summary, blog.content, blog.image_url]
    );
  }

  console.log('Database seeding completed successfully!');
  process.exit(0);
}

seed().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
