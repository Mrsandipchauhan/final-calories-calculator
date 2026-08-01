/**
 * seed_expansion.js — Adds 10 new restaurant brands with full menus,
 * sizes, options, and SEO content to the NutriRoute database.
 * Run once: node seed_expansion.js
 */
const { db, initDb } = require('./db');

async function seedBrand(brand, items, sizes, options) {
  // Check if brand already exists
  const existing = await db.getAsync('SELECT id FROM brands WHERE id = ?', [brand.id]);
  if (existing) {
    console.log(`  ⏭ Brand "${brand.name}" already exists, skipping...`);
    return;
  }

  await db.runAsync(
    'INSERT INTO brands (id, name, category, desc, bg, meta_title, meta_description, seo_content) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [brand.id, brand.name, brand.category, brand.desc, brand.bg,
     brand.meta_title || null, brand.meta_description || null, brand.seo_content || null]
  );

  for (const item of items) {
    await db.runAsync(
      'INSERT INTO menu_items (brand_id, emoji, name, calories, protein, carbs, fat, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [brand.id, item[0], item[1], item[2], item[3], item[4], item[5], item[6]]
    );
  }
  for (const s of sizes) {
    await db.runAsync('INSERT INTO brand_sizes (brand_id, name, calorie_adjust) VALUES (?, ?, ?)', [brand.id, s[0], s[1]]);
  }
  for (const o of options) {
    await db.runAsync('INSERT INTO brand_options (brand_id, name, calorie_adjust) VALUES (?, ?, ?)', [brand.id, o[0], o[1]]);
  }
  console.log(`  ✅ Added ${brand.name} (${items.length} items, ${sizes.length} sizes, ${options.length} options)`);
}

async function updateExistingSEO() {
  const seoData = {
    starbucks: {
      meta_title: "Starbucks Calorie Calculator — Full Menu Nutrition Facts | NutriRoute",
      meta_description: "Check calories in every Starbucks drink and food item. Customize milk, size, and toppings to see exact nutrition info before you order.",
      seo_content: `<div class="seo-section"><h2>How to Use the Starbucks Calorie Calculator</h2><p>Pick any drink or bakery item from the menu above, then choose your preferred size (Tall, Grande, or Venti) and milk option to see the calorie count update instantly. This tool pulls from published Starbucks nutrition data so you can plan ahead before visiting your local store.</p><div class="info-card tip"><strong>Quick Tip</strong><p>Switching from 2% milk to almond milk saves roughly 40 calories on a Grande latte. Over a week of daily coffees, that adds up to nearly 300 fewer calories without changing your drink order.</p></div><h2>Understanding Starbucks Nutrition</h2><p>Starbucks drinks vary widely in calorie content. A plain black coffee has almost zero calories, while a Venti White Chocolate Mocha with whipped cream can top 500 calories — more than many full meals. The biggest calorie drivers are syrups, whipped cream, and whole milk.</p><p>Food items like the Butter Croissant (250 cal) or Turkey Bacon sandwich (230 cal) pair well with lower-calorie drink choices if you want to keep your total order under 400 calories.</p><h2>Best Low-Calorie Starbucks Orders</h2><p>If you are watching your intake, these combinations keep things under 200 calories:</p><ul><li>Tall Caffè Latte with almond milk — roughly 100 calories</li><li>Grande Cold Brew with a splash of oat milk — about 35 calories</li><li>Tall Iced Matcha Latte with almond milk — around 120 calories</li></ul><p>You can also ask for sugar-free syrups or half the usual pumps to reduce the sugar content of any flavored drink.</p></div>`
    },
    mcdonalds: {
      meta_title: "McDonald's Calorie Calculator — Burgers, Fries & More Nutrition | NutriRoute",
      meta_description: "Find out exactly how many calories are in your McDonald's order. Check Big Macs, McNuggets, fries and breakfast items with our free calculator.",
      seo_content: `<div class="seo-section"><h2>McDonald's Nutrition at a Glance</h2><p>McDonald's serves over 69 million customers daily across 100+ countries, making it the world's largest fast food chain by revenue. With a menu ranging from 230-calorie McChickens to 590-calorie Big Macs, knowing the numbers helps you enjoy your favourites while staying on track.</p><div class="info-card tip"><strong>Did You Know?</strong><p>A Medium Fries (320 cal) actually has fewer calories than a Large Coke (290 cal for 30oz). If you swap the soda for water, you save enough calories to add fries without guilt.</p></div><h2>Building a Balanced McDonald's Meal</h2><p>A typical combo meal (burger + medium fries + medium drink) ranges from 800 to 1,200 calories depending on your choices. Here are some strategies to bring that number down:</p><ul><li>Choose a McChicken (400 cal) instead of a Big Mac (590 cal) — you save 190 calories</li><li>Pick a side salad instead of fries — saves about 300 calories</li><li>Go with water or diet soda — saves 200+ calories from a regular medium Coke</li></ul><p>For breakfast, the Egg McMuffin at 310 calories is one of the most balanced fast food breakfast options available anywhere, with 17g of protein and reasonable fat content.</p></div>`
    },
    subway: {
      meta_title: "Subway Calorie Calculator — Subs, Wraps & Sides Nutrition | NutriRoute",
      meta_description: "Calculate exact calories for any Subway sub. Choose your bread, size and fillings to see complete nutrition facts for your custom order.",
      seo_content: `<div class="seo-section"><h2>How Subway Calories Work</h2><p>Subway markets itself as a healthier fast food option, and there is truth to that — a 6-inch Veggie Delite on wheat bread is just 230 calories with 8g of protein. But calorie counts vary dramatically based on bread choice, protein, cheese, sauces, and size.</p><div class="info-card tip"><strong>Bread Matters</strong><p>The difference between Italian bread and a Flatbread is about 20 extra calories. Choosing a 6-inch sub instead of a Footlong immediately halves the calories from bread alone.</p></div><h2>Lowest-Calorie Subway Orders</h2><p>If you are counting calories, stick to these 6-inch options under 350 calories:</p><ul><li>Veggie Delite — 230 cal (add all the vegetables you want at zero extra calories)</li><li>Turkey Breast — 280 cal</li><li>Oven Roasted Chicken — 320 cal</li></ul><p>Keep in mind that sauces are where hidden calories sneak in. Mayo adds about 110 calories per serving. Mustard, vinegar, or a light drizzle of oil and vinegar are lower-calorie alternatives that keep your sub flavourful.</p></div>`
    }
  };

  for (const [brandId, data] of Object.entries(seoData)) {
    await db.runAsync(
      'UPDATE brands SET meta_title = ?, meta_description = ?, seo_content = ? WHERE id = ?',
      [data.meta_title, data.meta_description, data.seo_content, brandId]
    );
    console.log(`  📝 Updated SEO for ${brandId}`);
  }
}

async function run() {
  await initDb();
  console.log('\n🚀 Seeding new brands...\n');

  // ── Wendy's ──
  await seedBrand(
    { id: 'wendys', name: "Wendy's", category: 'BURGERS', desc: 'Fresh beef burgers & frosties', bg: '#fde8e8',
      meta_title: "Wendy's Calorie Calculator — Burgers, Chicken & Frosty Nutrition | NutriRoute",
      meta_description: "Check calories in every Wendy's menu item. Baconators, nuggets, Frostys and more — see the full nutrition breakdown.",
      seo_content: `<div class="seo-section"><h2>Wendy's Nutrition Guide</h2><p>Wendy's is known for fresh, never-frozen beef patties and their signature Frosty desserts. Calorie counts range from under 300 for a Jr. Cheeseburger to over 900 for a Baconator. Use this calculator to build your order and check the numbers before you pull up to the drive-through.</p><div class="info-card tip"><strong>Smart Swap</strong><p>A Jr. Cheeseburger (310 cal, 17g protein) is a satisfying option when you want the burger experience at a fraction of the Baconator's 960 calories.</p></div><h2>Best Options Under 500 Calories</h2><ul><li>Jr. Bacon Cheeseburger — 380 cal</li><li>Grilled Chicken Sandwich — 370 cal</li><li>6-Piece Nuggets — 250 cal</li><li>Apple Bites — 35 cal</li></ul></div>` },
    [
      ['🍔', 'Dave\'s Single', 570, 30, 40, 34, 'Burgers'],
      ['🍔', 'Dave\'s Double', 810, 49, 41, 51, 'Burgers'],
      ['🍔', 'Dave\'s Triple', 1070, 69, 42, 69, 'Burgers'],
      ['🍔', 'Baconator', 960, 58, 40, 63, 'Burgers'],
      ['🍔', 'Jr. Bacon Cheeseburger', 380, 20, 26, 23, 'Burgers'],
      ['🍔', 'Jr. Cheeseburger', 310, 17, 27, 15, 'Burgers'],
      ['🍗', 'Classic Chicken Sandwich', 490, 29, 44, 22, 'Chicken'],
      ['🍗', 'Spicy Chicken Sandwich', 490, 29, 44, 22, 'Chicken'],
      ['🥗', 'Grilled Chicken Sandwich', 370, 35, 36, 10, 'Chicken'],
      ['🍗', '4-Piece Nuggets', 170, 10, 10, 10, 'Chicken'],
      ['🍗', '6-Piece Nuggets', 250, 16, 16, 14, 'Chicken'],
      ['🍗', '10-Piece Nuggets', 420, 26, 26, 24, 'Chicken'],
      ['🍟', 'Small French Fries', 260, 3, 34, 13, 'Sides'],
      ['🍟', 'Medium French Fries', 380, 5, 50, 18, 'Sides'],
      ['🍟', 'Large French Fries', 480, 6, 63, 23, 'Sides'],
      ['🥗', 'Caesar Side Salad', 190, 11, 9, 13, 'Sides'],
      ['🍦', 'Small Frosty (Chocolate)', 340, 9, 53, 9, 'Desserts'],
      ['🍦', 'Small Frosty (Vanilla)', 340, 9, 51, 9, 'Desserts'],
      ['🥤', 'Lemonade (Medium)', 310, 0, 79, 0, 'Drinks'],
      ['🥔', 'Baked Potato (Plain)', 270, 7, 61, 0, 'Sides'],
      ['🥔', 'Baked Potato (Sour Cream & Chive)', 310, 8, 63, 4, 'Sides'],
      ['🌯', 'Breakfast Baconator', 730, 34, 41, 49, 'Breakfast'],
      ['🥚', 'Sausage Egg & Cheese Biscuit', 610, 23, 38, 42, 'Breakfast'],
      ['🍟', 'Seasoned Potatoes', 240, 3, 30, 12, 'Breakfast']
    ],
    [['Regular', 0], ['Value Size', -100]],
    [['No Sauce', 0], ['Add Cheese', 70], ['Add Bacon', 80]]
  );

  // ── Burger King ──
  await seedBrand(
    { id: 'burgerking', name: 'Burger King', category: 'BURGERS', desc: 'Flame-grilled burgers & shakes', bg: '#fff3e0',
      meta_title: "Burger King Calorie Calculator — Whopper, Nuggets & Full Menu | NutriRoute",
      meta_description: "Find exact calorie counts for every Burger King item. Whoppers, Chicken Fries, onion rings and more with full macro breakdowns." },
    [
      ['🍔', 'Whopper', 660, 28, 49, 40, 'Burgers'],
      ['🍔', 'Whopper with Cheese', 740, 33, 50, 46, 'Burgers'],
      ['🍔', 'Double Whopper', 900, 48, 49, 57, 'Burgers'],
      ['🍔', 'Bacon King', 1150, 61, 49, 79, 'Burgers'],
      ['🍔', 'Cheeseburger', 300, 17, 27, 13, 'Burgers'],
      ['🍔', 'Double Cheeseburger', 410, 25, 27, 22, 'Burgers'],
      ['🍗', 'Original Chicken Sandwich', 660, 28, 48, 40, 'Chicken'],
      ['🍗', 'Ch\'King Sandwich', 700, 29, 50, 42, 'Chicken'],
      ['🍗', 'Chicken Fries (9 pc)', 280, 14, 20, 17, 'Chicken'],
      ['🍗', '8-Piece Chicken Nuggets', 340, 17, 18, 22, 'Chicken'],
      ['🍟', 'Small French Fries', 240, 3, 29, 13, 'Sides'],
      ['🍟', 'Medium French Fries', 380, 4, 46, 20, 'Sides'],
      ['🍟', 'Large French Fries', 430, 5, 53, 23, 'Sides'],
      ['🧅', 'Onion Rings (Medium)', 410, 5, 44, 24, 'Sides'],
      ['🥗', 'Garden Side Salad', 60, 3, 4, 4, 'Sides'],
      ['🍦', 'Vanilla Shake (Medium)', 560, 11, 80, 22, 'Desserts'],
      ['🍦', 'Hershey Sundae Pie', 310, 3, 32, 19, 'Desserts'],
      ['🥐', 'Croissan\'wich Sausage Egg & Cheese', 570, 23, 30, 40, 'Breakfast'],
      ['🥞', 'Pancake Platter', 610, 10, 73, 30, 'Breakfast'],
      ['🥤', 'Coca-Cola (Medium)', 220, 0, 59, 0, 'Drinks']
    ],
    [['Regular', 0], ['King Size', 180]],
    [['No Sauce', 0], ['Add Mayo', 90], ['Add Ketchup', 20]]
  );

  // ── Domino's Pizza ──
  await seedBrand(
    { id: 'dominos', name: "Domino's", category: 'PIZZA', desc: 'Pizzas, wings & pasta', bg: '#e3f2fd',
      meta_title: "Domino's Calorie Calculator — Pizza, Wings & Pasta Nutrition | NutriRoute",
      meta_description: "How many calories are in your Domino's pizza? Calculate nutrition for any slice, size, crust and topping combination." },
    [
      ['🍕', 'Cheese Pizza (1 slice, Medium Hand Tossed)', 200, 8, 25, 8, 'Pizza'],
      ['🍕', 'Pepperoni Pizza (1 slice, Medium)', 210, 9, 25, 9, 'Pizza'],
      ['🍕', 'MeatZZa Pizza (1 slice, Medium)', 280, 13, 26, 14, 'Pizza'],
      ['🍕', 'ExtravaganZZa Pizza (1 slice, Medium)', 280, 12, 26, 14, 'Pizza'],
      ['🍕', 'Pacific Veggie (1 slice, Medium)', 220, 9, 26, 9, 'Pizza'],
      ['🍕', 'Buffalo Chicken Pizza (1 slice, Medium)', 200, 10, 25, 7, 'Pizza'],
      ['🍕', 'Honolulu Hawaiian (1 slice, Medium)', 220, 10, 27, 8, 'Pizza'],
      ['🍗', 'Boneless Chicken Wings (8 pc)', 580, 32, 52, 26, 'Wings & Sides'],
      ['🍗', 'Hot Buffalo Wings (8 pc)', 440, 36, 8, 28, 'Wings & Sides'],
      ['🍞', 'Garlic Bread Twists (2 pc)', 220, 6, 32, 8, 'Wings & Sides'],
      ['🧀', 'Stuffed Cheesy Bread (2 pc)', 290, 10, 30, 14, 'Wings & Sides'],
      ['🥗', 'Garden Salad (no dressing)', 70, 4, 6, 4, 'Salads'],
      ['🍝', 'Chicken Alfredo Pasta', 630, 28, 64, 28, 'Pasta'],
      ['🍝', 'Italian Sausage Marinara Pasta', 690, 24, 66, 36, 'Pasta'],
      ['🍪', 'Chocolate Lava Crunch Cake (2 pc)', 690, 8, 76, 40, 'Desserts'],
      ['🍪', 'Cinnamon Bread Twists (2 pc)', 250, 4, 30, 12, 'Desserts'],
      ['🍪', 'Marbled Cookie Brownie (1 pc)', 210, 2, 26, 11, 'Desserts'],
      ['🥤', 'Coca-Cola (20oz)', 240, 0, 65, 0, 'Drinks']
    ],
    [['Slice (of 8)', 0], ['Whole Pizza (x8)', 700]],
    [['Hand Tossed', 0], ['Thin Crust', -30], ['Brooklyn Style', -15], ['Pan Pizza', 30]]
  );

  // ── Pizza Hut ──
  await seedBrand(
    { id: 'pizzahut', name: 'Pizza Hut', category: 'PIZZA', desc: 'Pan pizzas, wings & breadsticks', bg: '#fce4ec',
      meta_title: "Pizza Hut Calorie Calculator — Pizza, Wings & Sides Nutrition | NutriRoute",
      meta_description: "Check calories in every Pizza Hut pizza slice, breadstick, wing and pasta dish. Find nutrition facts for your favourite orders." },
    [
      ['🍕', 'Cheese Pizza (1 slice, Medium Pan)', 240, 10, 28, 10, 'Pizza'],
      ['🍕', 'Pepperoni Pizza (1 slice, Medium Pan)', 250, 10, 27, 11, 'Pizza'],
      ['🍕', 'Supreme Pizza (1 slice, Medium Pan)', 260, 11, 28, 12, 'Pizza'],
      ['🍕', 'Meat Lover\'s Pizza (1 slice, Medium Pan)', 310, 14, 27, 16, 'Pizza'],
      ['🍕', 'Veggie Lover\'s Pizza (1 slice, Medium Pan)', 220, 9, 28, 8, 'Pizza'],
      ['🍕', 'Hawaiian Pizza (1 slice, Medium)', 220, 10, 27, 8, 'Pizza'],
      ['🍕', 'BBQ Chicken Pizza (1 slice, Medium)', 230, 12, 29, 7, 'Pizza'],
      ['🍗', 'Bone-Out Wings (6 pc)', 490, 30, 20, 32, 'Wings & Sides'],
      ['🍗', 'Traditional Wings (6 pc)', 450, 33, 1, 34, 'Wings & Sides'],
      ['🍞', 'Breadsticks (2 pc)', 280, 6, 34, 14, 'Wings & Sides'],
      ['🧀', 'Cheese Sticks (2 pc)', 310, 8, 32, 16, 'Wings & Sides'],
      ['🧅', 'Stuffed Garlic Knots (2 pc)', 280, 8, 30, 14, 'Wings & Sides'],
      ['🍝', 'Creamy Chicken Alfredo Pasta', 630, 27, 56, 32, 'Pasta'],
      ['🍝', 'Meaty Marinara Pasta', 660, 25, 56, 36, 'Pasta'],
      ['🥗', 'Caesar Salad', 170, 7, 8, 13, 'Salads'],
      ['🍪', 'HERSHEY\'S Triple Chocolate Brownie', 580, 7, 70, 30, 'Desserts'],
      ['🍪', 'Cinnabon Mini Rolls (2 pc)', 310, 4, 38, 16, 'Desserts'],
      ['🥤', 'Pepsi (20oz)', 250, 0, 69, 0, 'Drinks']
    ],
    [['Slice (of 8)', 0], ['Whole Pizza (x8)', 700]],
    [['Pan Crust', 0], ['Hand Tossed', -20], ['Thin & Crispy', -40], ['Stuffed Crust', 50]]
  );

  // ── Popeyes ──
  await seedBrand(
    { id: 'popeyes', name: 'Popeyes', category: 'CHICKEN', desc: 'Louisiana-style fried chicken', bg: '#fff8e1',
      meta_title: "Popeyes Calorie Calculator — Chicken Sandwich, Tenders & Sides | NutriRoute",
      meta_description: "Find nutrition facts for every Popeyes item. Check calories in the famous chicken sandwich, tenders, biscuits and cajun sides." },
    [
      ['🍗', 'Chicken Sandwich (Classic)', 700, 28, 50, 42, 'Sandwiches'],
      ['🍗', 'Chicken Sandwich (Spicy)', 700, 28, 50, 42, 'Sandwiches'],
      ['🍗', 'Breast (Mild)', 380, 28, 14, 24, 'Chicken Pieces'],
      ['🍗', 'Breast (Spicy)', 360, 27, 11, 24, 'Chicken Pieces'],
      ['🍗', 'Leg (Mild)', 160, 14, 5, 9, 'Chicken Pieces'],
      ['🍗', 'Thigh (Mild)', 280, 17, 9, 20, 'Chicken Pieces'],
      ['🍗', 'Wing (Mild)', 210, 10, 8, 14, 'Chicken Pieces'],
      ['🍗', '3-Piece Tenders (Mild)', 340, 18, 20, 21, 'Chicken Pieces'],
      ['🍗', '5-Piece Tenders (Mild)', 570, 29, 34, 35, 'Chicken Pieces'],
      ['🍞', 'Biscuit', 260, 3, 27, 15, 'Sides'],
      ['🍚', 'Red Beans & Rice (Regular)', 230, 7, 30, 9, 'Sides'],
      ['🌽', 'Cajun Fries (Regular)', 260, 3, 33, 14, 'Sides'],
      ['🥗', 'Coleslaw (Regular)', 170, 1, 14, 13, 'Sides'],
      ['🌽', 'Corn on the Cob', 200, 5, 24, 10, 'Sides'],
      ['🧁', 'Mashed Potatoes (Regular, no gravy)', 110, 2, 17, 4, 'Sides'],
      ['🍗', 'Popcorn Shrimp (Regular)', 340, 12, 28, 20, 'Seafood'],
      ['🍗', 'Butterfly Shrimp (8 pc)', 310, 12, 27, 17, 'Seafood'],
      ['🍩', 'Cinnamon Apple Pie', 230, 2, 26, 14, 'Desserts']
    ],
    [['Regular', 0], ['Combo (add fries + drink)', 520]],
    [['Mild', 0], ['Spicy', 0], ['Cajun Sparkle', 5]]
  );

  // ── Sonic Drive-In ──
  await seedBrand(
    { id: 'sonic', name: 'Sonic Drive-In', category: 'DRIVE-IN', desc: 'Burgers, hot dogs & slushies', bg: '#e1f5fe',
      meta_title: "Sonic Drive-In Calorie Calculator — Burgers, Shakes & Slushies | NutriRoute",
      meta_description: "Check Sonic menu calorie counts for burgers, coney dogs, tater tots, shakes, and slushies with full nutrition facts." },
    [
      ['🍔', 'Sonic Cheeseburger', 630, 27, 52, 36, 'Burgers'],
      ['🍔', 'SuperSonic Double Cheeseburger', 930, 46, 55, 58, 'Burgers'],
      ['🍔', 'Jr. Burger', 310, 15, 30, 14, 'Burgers'],
      ['🌭', 'All-American Hot Dog', 470, 14, 36, 30, 'Hot Dogs'],
      ['🌭', 'Chili Cheese Coney', 460, 17, 32, 30, 'Hot Dogs'],
      ['🌭', 'Footlong Quarter Pound Coney', 700, 24, 49, 45, 'Hot Dogs'],
      ['🍗', 'Jumbo Popcorn Chicken', 440, 22, 28, 26, 'Chicken'],
      ['🍗', 'Crispy Chicken Sandwich', 490, 22, 44, 24, 'Chicken'],
      ['🍟', 'Medium Tater Tots', 330, 3, 35, 20, 'Sides'],
      ['🍟', 'Large Tater Tots', 490, 5, 52, 30, 'Sides'],
      ['🍟', 'Medium French Fries', 330, 3, 40, 18, 'Sides'],
      ['🧅', 'Medium Onion Rings', 440, 6, 53, 22, 'Sides'],
      ['🥤', 'Cherry Limeade (Medium)', 170, 0, 45, 0, 'Drinks'],
      ['🥤', 'Ocean Water (Medium)', 200, 0, 52, 0, 'Drinks'],
      ['🍦', 'Vanilla Shake (Medium)', 550, 11, 74, 24, 'Shakes & Desserts'],
      ['🍦', 'Oreo Blast (Medium)', 620, 13, 84, 26, 'Shakes & Desserts'],
      ['🍦', 'Sonic Blast (M&M, Medium)', 680, 14, 88, 30, 'Shakes & Desserts'],
      ['🧁', 'Single Wacky Pack (Kids Meal)', 420, 15, 42, 21, 'Kids']
    ],
    [['Regular', 0], ['Large', 180]],
    [['Standard', 0], ['Add Chili', 50], ['Add Cheese', 70]]
  );

  // ── Five Guys ──
  await seedBrand(
    { id: 'fiveguys', name: 'Five Guys', category: 'BURGERS', desc: 'Custom burgers & famous fries', bg: '#fef9e7',
      meta_title: "Five Guys Calorie Calculator — Burgers, Fries & Milkshakes | NutriRoute",
      meta_description: "Find calorie counts for Five Guys burgers, fries, hot dogs and milkshakes. Customize toppings to see your exact nutrition totals." },
    [
      ['🍔', 'Hamburger', 700, 39, 39, 43, 'Burgers'],
      ['🍔', 'Cheeseburger', 840, 47, 40, 55, 'Burgers'],
      ['🍔', 'Bacon Cheeseburger', 920, 51, 40, 62, 'Burgers'],
      ['🍔', 'Little Hamburger', 480, 23, 39, 26, 'Burgers'],
      ['🍔', 'Little Cheeseburger', 550, 27, 40, 32, 'Burgers'],
      ['🍔', 'Little Bacon Cheeseburger', 630, 31, 40, 39, 'Burgers'],
      ['🌭', 'Hot Dog', 545, 18, 40, 35, 'Hot Dogs'],
      ['🌭', 'Cheese Dog', 615, 22, 41, 41, 'Hot Dogs'],
      ['🌭', 'Bacon Cheese Dog', 695, 26, 41, 48, 'Hot Dogs'],
      ['🥪', 'Veggie Sandwich', 440, 16, 60, 15, 'Sandwiches'],
      ['🥪', 'Grilled Cheese', 470, 11, 41, 26, 'Sandwiches'],
      ['🥪', 'BLT', 430, 20, 38, 22, 'Sandwiches'],
      ['🍟', 'Regular Fries (Little)', 526, 7, 60, 30, 'Fries'],
      ['🍟', 'Regular Fries (Regular)', 953, 12, 109, 54, 'Fries'],
      ['🍟', 'Cajun Fries (Little)', 526, 7, 60, 30, 'Fries'],
      ['🍦', 'Vanilla Milkshake (Regular)', 710, 15, 78, 37, 'Milkshakes']
    ],
    [['Little', -200], ['Regular', 0]],
    [['No Extras', 0], ['Add Lettuce/Tomato', 5], ['Add Bacon', 80], ['Add Mushrooms', 10]]
  );

  // ── Wingstop ──
  await seedBrand(
    { id: 'wingstop', name: 'Wingstop', category: 'WINGS', desc: 'Chicken wings & tenders', bg: '#e8f5e9',
      meta_title: "Wingstop Calorie Calculator — Wings, Tenders & Sides Nutrition | NutriRoute",
      meta_description: "How many calories in Wingstop wings? Check nutrition for classic wings, boneless wings, chicken tenders and sides." },
    [
      ['🍗', 'Classic Wings (2 pc, Plain)', 180, 18, 0, 12, 'Classic Wings'],
      ['🍗', 'Classic Wings (2 pc, Atomic)', 190, 18, 1, 13, 'Classic Wings'],
      ['🍗', 'Classic Wings (2 pc, Lemon Pepper)', 200, 18, 1, 14, 'Classic Wings'],
      ['🍗', 'Classic Wings (2 pc, Garlic Parmesan)', 210, 18, 2, 15, 'Classic Wings'],
      ['🍗', 'Classic Wings (2 pc, Mango Habanero)', 200, 18, 5, 12, 'Classic Wings'],
      ['🍗', 'Classic Wings (2 pc, Original Hot)', 190, 18, 1, 13, 'Classic Wings'],
      ['🍗', 'Boneless Wings (3 pc, Plain)', 190, 12, 14, 10, 'Boneless Wings'],
      ['🍗', 'Boneless Wings (3 pc, Lemon Pepper)', 210, 12, 14, 12, 'Boneless Wings'],
      ['🍗', 'Boneless Wings (3 pc, Mango Habanero)', 210, 12, 18, 10, 'Boneless Wings'],
      ['🍗', 'Crispy Tenders (3 pc)', 350, 25, 20, 18, 'Tenders'],
      ['🍗', 'Crispy Tenders (5 pc)', 580, 42, 33, 30, 'Tenders'],
      ['🍗', 'Thigh Bites (Regular)', 400, 26, 22, 22, 'Thigh Bites'],
      ['🍟', 'Regular Fries', 330, 3, 42, 17, 'Sides'],
      ['🍟', 'Large Fries', 490, 5, 63, 25, 'Sides'],
      ['🥗', 'Coleslaw', 190, 1, 14, 15, 'Sides'],
      ['🧁', 'Cajun Corn', 200, 3, 22, 12, 'Sides'],
      ['🍞', 'Roll', 240, 6, 38, 7, 'Sides'],
      ['🫘', 'Ranch Beans', 290, 8, 30, 16, 'Sides'],
      ['🥤', 'Sweet Tea (Large)', 220, 0, 58, 0, 'Drinks']
    ],
    [['2 Piece', 0], ['6 Piece', 200], ['10 Piece', 400]],
    [['Plain', 0], ['Lemon Pepper', 10], ['Garlic Parmesan', 20], ['Mango Habanero', 15], ['Atomic', 5]]
  );

  // ── Jersey Mike's ──
  await seedBrand(
    { id: 'jerseymikes', name: "Jersey Mike's", category: 'SUBS', desc: 'Fresh-sliced subs & wraps', bg: '#e8eaf6',
      meta_title: "Jersey Mike's Calorie Calculator — Subs & Wraps Nutrition | NutriRoute",
      meta_description: "Check calorie counts for every Jersey Mike's sub. Cold subs, hot subs, and wraps with full nutrition breakdowns." },
    [
      ['🥪', '#13 The Original Italian (Regular)', 680, 32, 55, 37, 'Cold Subs'],
      ['🥪', '#2 Jersey Shore\'s Favorite (Regular)', 570, 26, 56, 27, 'Cold Subs'],
      ['🥪', '#7 Turkey & Provolone (Regular)', 520, 28, 54, 22, 'Cold Subs'],
      ['🥪', '#3 Ham & Provolone (Regular)', 540, 28, 55, 23, 'Cold Subs'],
      ['🥪', '#6 Roast Beef & Provolone (Regular)', 540, 30, 54, 23, 'Cold Subs'],
      ['🥪', '#9 Club Supreme (Regular)', 640, 34, 55, 32, 'Cold Subs'],
      ['🥪', '#17 Mike\'s Famous Philly (Regular)', 670, 38, 56, 32, 'Hot Subs'],
      ['🥪', '#42 Chipotle Cheese Steak (Regular)', 720, 38, 58, 36, 'Hot Subs'],
      ['🍗', '#43 Chipotle Chicken Cheese Steak (Regular)', 670, 35, 58, 32, 'Hot Subs'],
      ['🥪', '#56 Big Kahuna Chicken Cheese Steak (Regular)', 740, 42, 60, 36, 'Hot Subs'],
      ['🍗', '#99 Grilled Chicken & Pepperjack (Regular)', 590, 36, 56, 24, 'Hot Subs'],
      ['🍪', 'Chocolate Chip Cookie', 350, 4, 46, 17, 'Sides & Desserts'],
      ['🍪', 'Sugar Cookie', 340, 3, 48, 16, 'Sides & Desserts'],
      ['🍟', 'Regular Chips', 230, 2, 24, 14, 'Sides & Desserts'],
      ['🥤', 'Fountain Drink (Medium)', 200, 0, 54, 0, 'Drinks']
    ],
    [['Mini', -200], ['Regular', 0], ['Giant', 300]],
    [['White Sub Roll', 0], ['Wheat Sub Roll', 10], ['Sub in a Tub (no bread)', -200]]
  );

  // ── Raising Cane's ──
  await seedBrand(
    { id: 'raisingcanes', name: "Raising Cane's", category: 'CHICKEN FINGERS', desc: 'Chicken fingers, fries & Texas toast', bg: '#fff9c4',
      meta_title: "Raising Cane's Calorie Calculator — Chicken Fingers, Fries & Combos | NutriRoute",
      meta_description: "Check calories in Raising Cane's chicken fingers, combos, Texas toast, coleslaw and Cane's sauce." },
    [
      ['🍗', '3 Chicken Fingers', 390, 27, 18, 24, 'Chicken Fingers'],
      ['🍗', '4 Chicken Fingers', 520, 36, 24, 32, 'Chicken Fingers'],
      ['🍗', '6 Chicken Fingers', 780, 54, 36, 48, 'Chicken Fingers'],
      ['🍞', 'Texas Toast (1 slice)', 150, 3, 17, 8, 'Sides'],
      ['🍟', 'Crinkle-Cut Fries (Regular)', 350, 4, 40, 19, 'Sides'],
      ['🍟', 'Crinkle-Cut Fries (Large)', 530, 6, 60, 29, 'Sides'],
      ['🥗', 'Coleslaw (Regular)', 200, 1, 17, 15, 'Sides'],
      ['🫙', "Cane's Sauce (1 serving)", 190, 1, 5, 18, 'Sauces'],
      ['🥤', 'Lemonade (Regular)', 200, 0, 50, 0, 'Drinks'],
      ['🥤', 'Sweet Tea (Regular)', 170, 0, 44, 0, 'Drinks']
    ],
    [['Regular', 0]],
    [['With Cane\'s Sauce', 0], ['No Sauce', -190]]
  );

  // ── Update SEO for existing brands ──
  console.log('\n📝 Updating SEO content for existing brands...\n');
  await updateExistingSEO();

  console.log('\n✅ Brand expansion complete!\n');
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
