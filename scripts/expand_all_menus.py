import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DB_PATH = ROOT / 'nutriroute.db'

# Define comprehensive menu data for the 18 target brands
expanded_menu_data = {
    'starbucks': [
        # Drinks
        ['☕', 'Caffè Latte', 190, 13, 18, 7, 'Drinks'],
        ['🧊', 'Iced Brown Sugar Oatmilk Shaken Espresso', 120, 2, 23, 1, 'Drinks'],
        ['🍫', 'White Chocolate Mocha', 430, 14, 56, 18, 'Drinks'],
        ['☕', 'Caramel Macchiato', 250, 10, 35, 7, 'Drinks'],
        ['🧊', 'Cold Brew with Salted Caramel Cold Foam', 240, 2, 25, 14, 'Drinks'],
        ['🍓', 'Pink Drink', 140, 1, 28, 2.5, 'Drinks'],
        ['🍵', 'Iced Matcha Latte', 200, 9, 34, 5, 'Drinks'],
        ['☕', 'Caffè Mocha', 370, 13, 44, 15, 'Drinks'],
        ['☕', 'Flat White', 220, 12, 18, 11, 'Drinks'],
        ['☕', 'Caffè Americano', 15, 1, 3, 0, 'Drinks'],
        ['🧊', 'Iced Caramel Macchiato', 250, 10, 35, 7, 'Drinks'],
        ['🧊', 'Iced Caffè Americano', 15, 1, 3, 0, 'Drinks'],
        ['🍵', 'Chai Tea Latte', 240, 8, 45, 4.5, 'Drinks'],
        ['🍓', 'Strawberry Açaí Lemonade Refresher', 140, 0, 35, 0, 'Drinks'],
        ['🥭', 'Mango Dragonfruit Refresher', 90, 0, 22, 0, 'Drinks'],
        ['☕', 'Pumpkin Spice Latte', 390, 14, 52, 14, 'Drinks'],
        ['🧊', 'Vanilla Sweet Cream Cold Brew', 110, 1, 14, 6, 'Drinks'],
        # Food & Bakery
        ['🥐', 'Butter Croissant', 250, 5, 32, 13, 'Food & Bakery'],
        ['🥚', 'Egg White Sous Vide Egg Bites', 170, 12, 11, 8, 'Food & Bakery'],
        ['🥪', 'Turkey Bacon & Egg White Sandwich', 230, 17, 28, 5, 'Food & Bakery'],
        ['🥯', 'Sprouted Grain Bagel', 330, 12, 64, 1.5, 'Food & Bakery'],
        ['🥐', 'Chocolate Croissant', 300, 5, 34, 16, 'Food & Bakery'],
        ['🥪', 'Bacon, Gouda & Egg Sandwich', 360, 19, 33, 18, 'Food & Bakery'],
        ['🥪', 'Double-Smoked Bacon, Cheddar & Egg Sandwich', 500, 21, 42, 28, 'Food & Bakery'],
        ['🧁', 'Birthday Cake Pop', 160, 1, 23, 8, 'Food & Bakery']
    ],
    'tacobell': [
        ['🌮', 'Crunchwrap Supreme', 540, 16, 71, 21, 'Specialties'],
        ['🌮', 'Cheesy Gordita Crunch', 500, 20, 41, 28, 'Tacos & Burritos'],
        ['🌯', 'Bean Burrito', 350, 13, 54, 9, 'Tacos & Burritos'],
        ['🥨', 'Cinnamon Twists', 170, 1, 27, 6, 'Sides & Sweets'],
        ['🌮', 'Soft Taco (Beef)', 180, 9, 18, 9, 'Tacos & Burritos'],
        ['🌮', 'Crunchy Taco (Beef)', 170, 8, 13, 10, 'Tacos & Burritos'],
        ['🌮', 'Soft Taco (Chicken)', 160, 12, 16, 6, 'Tacos & Burritos'],
        ['🌮', 'Doritos Locos Tacos (Nacho Cheese)', 170, 8, 13, 10, 'Tacos & Burritos'],
        ['🌯', 'Beefy 5-Layer Burrito', 490, 18, 63, 18, 'Tacos & Burritos'],
        ['🌯', 'Burrito Supreme (Beef)', 400, 17, 51, 15, 'Tacos & Burritos'],
        ['🌯', 'Chipotle Ranch Grilled Chicken Burrito', 510, 17, 47, 29, 'Tacos & Burritos'],
        ['🧀', 'Cheese Quesadilla', 460, 19, 38, 27, 'Specialties'],
        ['🧀', 'Chicken Quesadilla', 510, 26, 38, 28, 'Specialties'],
        ['🧀', 'Steak Quesadilla', 520, 26, 38, 29, 'Specialties'],
        ['🌮', 'Chalupa Supreme (Beef)', 360, 12, 31, 21, 'Specialties'],
        ['🥣', 'Power Menu Bowl (Chicken)', 460, 26, 51, 20, 'Specialties'],
        ['🥣', 'Power Menu Bowl (Steak)', 470, 26, 51, 21, 'Specialties'],
        ['🍟', 'Nacho Fries', 320, 4, 35, 18, 'Sides & Sweets'],
        ['🧀', 'Chips and Nacho Cheese Sauce', 220, 3, 23, 13, 'Sides & Sweets'],
        ['🥤', 'Baja Blast (Medium)', 220, 0, 59, 0, 'Drinks'],
        ['🌯', 'Cheesy Toasted Breakfast Burrito (Bacon)', 350, 13, 37, 16, 'Breakfast'],
        ['🌯', 'Grande Toasted Breakfast Burrito (Sausage)', 570, 21, 50, 32, 'Breakfast'],
        ['🥞', 'Cinnabon Delights (4pc)', 330, 3, 36, 19, 'Breakfast'],
        ['🌮', 'Double Stacked Taco', 320, 11, 32, 17, 'Tacos & Burritos'],
        ['🌯', 'Cheesy Double Beef Burrito', 620, 22, 65, 29, 'Tacos & Burritos']
    ],
    'dunkin': [
        ['🍩', 'Boston Kreme Donut', 300, 4, 39, 15, 'Donuts & Bakery'],
        ['🍩', 'Glazed Donut', 240, 3, 33, 11, 'Donuts & Bakery'],
        ['🥐', 'Sausage Egg & Cheese Croissant', 720, 21, 43, 52, 'Breakfast Sandwiches'],
        ['☕', 'Original Blend Hot Coffee', 5, 0, 0, 0, 'Drinks'],
        ['☕', 'Iced Caramel Latte', 350, 9, 54, 11, 'Drinks'],
        ['🍩', 'Chocolate Frosted Donut', 280, 3, 34, 15, 'Donuts & Bakery'],
        ['🍩', 'Strawberry Frosted with Sprinkles Donut', 290, 3, 37, 15, 'Donuts & Bakery'],
        ['🍩', 'Jelly Donut', 250, 4, 35, 11, 'Donuts & Bakery'],
        ['🧁', 'Munchkins Donut Holes (3 count)', 210, 3, 24, 11, 'Donuts & Bakery'],
        ['🥐', 'Bacon Egg & Cheese Croissant', 570, 19, 41, 37, 'Breakfast Sandwiches'],
        ['🥪', 'Egg & Cheese Wake-Up Wrap', 180, 9, 15, 10, 'Breakfast Sandwiches'],
        ['🥪', 'Bacon Egg & Cheese Wake-Up Wrap', 210, 10, 15, 13, 'Breakfast Sandwiches'],
        ['🥪', 'Sausage Egg & Cheese Wake-Up Wrap', 290, 11, 16, 20, 'Breakfast Sandwiches'],
        ['🥯', 'Plain Bagel with Cream Cheese', 440, 12, 67, 14, 'Donuts & Bakery'],
        ['🥓', 'Sweet Black Pepper Bacon Sandwich', 620, 22, 53, 35, 'Breakfast Sandwiches'],
        ['🥤', 'Cold Brew with Sweet Cold Foam', 110, 1, 14, 6, 'Drinks'],
        ['🥤', 'Frozen Coffee (Original, Medium)', 610, 7, 122, 11, 'Drinks'],
        ['🥤', 'Dunkin Energy Punch', 180, 0, 46, 0, 'Drinks'],
        ['🥨', 'Hash Browns (6 count)', 130, 2, 16, 6, 'Breakfast Sandwiches'],
        ['🥐', 'Plain Croissant', 340, 6, 38, 18, 'Donuts & Bakery']
    ],
    'chickfila': [
        ['🍔', 'Chick-fil-A Chicken Sandwich', 440, 28, 41, 19, 'Entrees'],
        ['🍔', 'Spicy Deluxe Sandwich', 540, 34, 43, 25, 'Entrees'],
        ['🍟', 'Waffle Potato Fries', 420, 5, 45, 24, 'Sides & Salads'],
        ['🥤', 'Freshly-Brewed Iced Tea Sweet', 120, 0, 31, 0, 'Drinks'],
        ['🍗', 'Chick-fil-A Nuggets (8 count)', 250, 28, 11, 11, 'Entrees'],
        ['🍗', 'Grilled Nuggets (8 count)', 130, 25, 1, 3, 'Entrees'],
        ['🍔', 'Chick-fil-A Deluxe Sandwich', 500, 30, 42, 23, 'Entrees'],
        ['🍔', 'Spicy Chicken Sandwich', 490, 28, 41, 22, 'Entrees'],
        ['🍗', 'Chick-n-Strips (3 count)', 310, 29, 17, 14, 'Entrees'],
        ['🍔', 'Grilled Chicken Sandwich', 385, 28, 41, 12, 'Entrees'],
        ['🥗', 'Cobb Salad with Grilled Chicken', 400, 40, 22, 19, 'Sides & Salads'],
        ['🥗', 'Market Salad', 330, 27, 26, 14, 'Sides & Salads'],
        ['🍟', 'Waffle Potato Chips', 220, 3, 28, 11, 'Sides & Salads'],
        ['🥣', 'Chicken Noodle Soup (Bowl)', 220, 14, 27, 5, 'Sides & Salads'],
        ['🍪', 'Chocolate Chunk Cookie', 370, 4, 49, 18, 'Sides & Salads'],
        ['🥤', 'Chick-fil-A Lemonade (Medium)', 220, 0, 55, 0, 'Drinks'],
        ['🥤', 'Frosted Lemonade', 330, 6, 65, 6, 'Drinks'],
        ['🥚', 'Chicken Biscuit (Breakfast)', 460, 19, 46, 22, 'Breakfast'],
        ['🥚', 'Egg White Grill', 290, 26, 29, 8, 'Breakfast'],
        ['🥚', 'Hash Brown Scramble Bowl (Sausage)', 470, 30, 19, 31, 'Breakfast']
    ],
    'panera': [
        ['🥣', 'Broccoli Cheddar Soup', 370, 15, 30, 21, 'Soups & Salads'],
        ['🥪', 'Bacon Turkey Bravo Sandwich', 720, 41, 63, 33, 'Sandwiches & Bowls'],
        ['🥯', 'Cinnamon Crunch Bagel', 420, 10, 82, 7, 'Bakery'],
        ['🥣', 'Homestyle Chicken Noodle Soup', 180, 13, 21, 5, 'Soups & Salads'],
        ['🥣', 'Bistro French Onion Soup', 310, 11, 33, 15, 'Soups & Salads'],
        ['🥗', 'Fuji Apple Salad with Chicken', 560, 34, 36, 34, 'Soups & Salads'],
        ['🥗', 'Green Goddess Cobb Salad with Chicken', 500, 43, 16, 32, 'Soups & Salads'],
        ['🥗', 'Caesar Salad with Chicken', 440, 32, 18, 27, 'Soups & Salads'],
        ['🥪', 'Toasted Frontega Chicken Sandwich', 820, 47, 79, 35, 'Sandwiches & Bowls'],
        ['🥪', 'Green Goddess Caprese Melt', 860, 34, 82, 44, 'Sandwiches & Bowls'],
        ['🥪', 'Roasted Turkey & Avocado BLT', 860, 41, 79, 42, 'Sandwiches & Bowls'],
        ['🥣', 'Mac & Cheese (Bowl)', 950, 33, 80, 56, 'Sandwiches & Bowls'],
        ['🥣', 'Mediterranean Warm Grain Bowl', 680, 21, 79, 31, 'Sandwiches & Bowls'],
        ['🥯', 'Asiago Cheese Bagel', 330, 12, 57, 5, 'Bakery'],
        ['🥯', 'Everything Bagel', 300, 10, 58, 2.5, 'Bakery'],
        ['🥐', 'Butter Croissant', 270, 5, 29, 15, 'Bakery'],
        ['🍪', 'Kitchen Sink Cookie', 800, 9, 98, 43, 'Bakery'],
        ['🥤', 'Charged Lemonade (Strawberry Lemon Mint, Medium)', 260, 0, 65, 0, 'Drinks'],
        ['🥤', 'Passion Papaya Green Tea (Medium)', 130, 0, 32, 0, 'Drinks'],
        ['☕', 'Caffè Latte (Medium)', 140, 9, 15, 5, 'Drinks']
    ],
    'subway': [
        ['🥪', 'Turkey Cali Club', 530, 34, 50, 24, 'Classic Subs'],
        ['🥪', 'Veggie Delite', 230, 8, 44, 3, 'Classic Subs'],
        ['🥪', 'Italian B.M.T.', 410, 20, 45, 18, 'Classic Subs'],
        ['🥪', 'Tuna Sub', 480, 20, 44, 25, 'Classic Subs'],
        ['🥪', 'Meatball Marinara', 480, 22, 59, 18, 'Classic Subs'],
        ['🍪', 'Chocolate Chip Cookie', 210, 2, 30, 10, 'Sides & Sweets'],
        ['🍟', 'Lay\'s Potato Chips', 230, 3, 23, 15, 'Sides & Sweets'],
        ['🥪', 'The Monster (Signature Series #3)', 540, 38, 45, 25, 'Signature Series'],
        ['🥪', 'The Outlaw (Signature Series #2)', 460, 33, 44, 18, 'Signature Series'],
        ['🥪', 'The Boss (Signature Series #6)', 560, 32, 59, 23, 'Signature Series'],
        ['🥪', 'All-Pro Sweet Onion Teriyaki', 410, 33, 56, 7, 'Signature Series'],
        ['🥪', 'Spicy Italian', 480, 20, 46, 25, 'Classic Subs'],
        ['🥪', 'Subway Club', 310, 26, 45, 4.5, 'Classic Subs'],
        ['🥪', 'Steak & Cheese', 320, 26, 45, 5, 'Classic Subs'],
        ['🥪', 'Oven Roasted Turkey', 270, 23, 44, 4, 'Classic Subs'],
        ['🥗', 'Chicken & Bacon Ranch Salad', 460, 36, 12, 32, 'Salads & Bowls'],
        ['🥗', 'Turkey Breast Protein Bowl', 310, 31, 10, 15, 'Salads & Bowls'],
        ['🍪', 'Raspberry Cheesecake Cookie', 210, 2, 29, 9, 'Sides & Sweets'],
        ['🍪', 'White Chip Macadamia Nut Cookie', 220, 2, 29, 11, 'Sides & Sweets'],
        ['🥨', 'Subway Footlong Soft Pretzel', 330, 8, 70, 2, 'Sides & Sweets']
    ],
    'chipotle': [
        ['🥣', 'Chicken Burrito Bowl', 510, 42, 57, 15, 'Entrees'],
        ['🌯', 'Steak Burrito', 830, 43, 102, 30, 'Entrees'],
        ['🧀', 'Carnitas Quesadilla', 950, 46, 75, 51, 'Entrees'],
        ['🥑', 'Chips & Guacamole', 730, 8, 73, 46, 'Sides & Drinks'],
        ['🥩', 'Barbacoa Burrito/Bowl', 170, 24, 2, 7, 'Fillings'],
        ['🥩', 'Carnitas Burrito/Bowl', 210, 23, 0, 12, 'Fillings'],
        ['🥩', 'Chicken Burrito/Bowl', 180, 32, 0, 7, 'Fillings'],
        ['🥩', 'Steak Burrito/Bowl', 150, 21, 1, 6, 'Fillings'],
        ['🌱', 'Sofritas (Plant-Based)', 150, 8, 9, 10, 'Fillings'],
        ['🍚', 'Cilantro-Lime White Rice', 210, 4, 40, 4, 'Sides & Drinks'],
        ['🍚', 'Cilantro-Lime Brown Rice', 210, 4, 36, 6, 'Sides & Drinks'],
        ['🥫', 'Black Beans', 130, 8, 22, 1.5, 'Sides & Drinks'],
        ['🥫', 'Pinto Beans', 130, 8, 21, 1.5, 'Sides & Drinks'],
        ['🧅', 'Fajita Vegetables', 20, 1, 5, 0, 'Sides & Drinks'],
        ['🍅', 'Fresh Tomato Salsa', 25, 0, 4, 0, 'Sides & Drinks']
    ],
    'arbys': [
        ['🥪', 'Classic Roast Beef', 360, 23, 37, 14, 'Sandwiches'],
        ['🥪', 'Double Roast Beef', 510, 38, 38, 24, 'Sandwiches'],
        ['🥪', 'Beef n Cheddar Classic', 450, 23, 45, 20, 'Sandwiches'],
        ['🍟', 'Curly Fries', 410, 5, 49, 21, 'Sides'],
        ['🧀', 'Mozzarella Sticks (4pc)', 440, 15, 37, 25, 'Sides'],
        ['🥪', 'Half Pound Roast Beef', 610, 48, 38, 30, 'Sandwiches'],
        ['🥪', 'Classic Beef n Cheddar Double', 560, 33, 45, 27, 'Sandwiches'],
        ['🥪', 'Classic French Dip & Swiss', 540, 34, 51, 22, 'Sandwiches'],
        ['🥪', 'Greek Gyro', 710, 23, 55, 44, 'Sandwiches'],
        ['🥪', 'Smokehouse Brisket', 600, 35, 42, 29, 'Sandwiches'],
        ['🍗', 'Classic Crispy Chicken Sandwich', 510, 24, 49, 25, 'Chicken'],
        ['🍗', 'Chicken Bacon Swiss Sandwich', 610, 32, 50, 31, 'Chicken'],
        ['🍗', 'Crispy Chicken Tenders (3pc)', 370, 23, 28, 18, 'Chicken'],
        ['🍟', 'Crinkle Fries (Medium)', 410, 5, 49, 21, 'Sides'],
        ['🥗', 'Side Salad', 70, 5, 4, 5, 'Sides'],
        ['🥤', 'Jamocha Shake (Medium)', 830, 15, 137, 24, 'Beverages'],
        ['🥪', 'Roast Beef Slider', 210, 12, 21, 9, 'Sliders & Snacks'],
        ['🥪', 'Buffalo Chicken Slider', 290, 12, 31, 13, 'Sliders & Snacks'],
        ['🥪', 'Jalapeño Roast Beef Slider', 220, 12, 21, 9, 'Sliders & Snacks'],
        ['🥤', 'Market Fresh Peach Lemonade', 190, 0, 49, 0, 'Beverages']
    ],
    'sweetgreen': [
        ['🥣', 'Harvest Bowl', 705, 36, 48, 41, 'Warm Bowls'],
        ['🥣', 'Crispy Rice Bowl', 520, 14, 66, 23, 'Warm Bowls'],
        ['🥗', 'Guacamole Greens', 530, 24, 26, 38, 'Salads'],
        ['🥣', 'Buffalo Chicken Bowl', 630, 38, 42, 34, 'Warm Bowls'],
        ['🥗', 'Kale Caesar', 400, 19, 12, 30, 'Salads'],
        ['🥗', 'Hummus Crunch Salad', 380, 12, 31, 24, 'Salads'],
        ['🥗', 'Garden Cobb', 490, 22, 17, 39, 'Salads'],
        ['🥣', 'Hot Honey Chicken Plate', 690, 48, 64, 22, 'Warm Bowls'],
        ['🥣', 'Chicken Pesto Parm', 525, 34, 38, 22, 'Warm Bowls'],
        ['🥗', 'Super Green Goddess', 380, 18, 19, 28, 'Salads'],
        ['🍲', 'Chicken & Brussels Bowl', 610, 36, 38, 33, 'Warm Bowls'],
        ['🌱', 'Sweet Potato & Tofu Plate', 580, 22, 59, 26, 'Warm Bowls'],
        ['🧴', 'Sweetgreen Hot Sauce', 5, 0, 1, 0, 'Dressings'],
        ['🧴', 'Pesto Vinaigrette', 140, 1, 2, 15, 'Dressings'],
        ['🧴', 'Green Goddess Ranch', 80, 1, 2, 8, 'Dressings']
    ],
    'shakeshack': [
        ['🍔', 'ShackBurger Single', 500, 29, 26, 30, 'Burgers'],
        ['🍔', 'ShackBurger Double', 770, 50, 27, 52, 'Burgers'],
        ['🍔', 'SmokeShack Single', 570, 34, 28, 35, 'Burgers'],
        ['🍟', 'Crinkle Cut Fries', 420, 5, 56, 19, 'Sides'],
        ['🥤', 'Classic Shake Chocolate', 750, 15, 88, 38, 'Shakes'],
        ['🍔', 'ShackBurger Triple', 1040, 71, 28, 74, 'Burgers'],
        ['🍔', 'Hamburger Single', 370, 22, 25, 19, 'Burgers'],
        ['🍔', 'Cheeseburger Single', 450, 26, 26, 26, 'Burgers'],
        ['🍔', 'Shroom Burger (Vegetarian)', 550, 18, 49, 31, 'Burgers'],
        ['🍔', 'Shack Stack', 800, 41, 53, 49, 'Burgers'],
        ['🍗', 'Chicken Shack', 550, 33, 39, 31, 'Chicken'],
        ['🍗', 'Chicken Bites (6pc)', 300, 24, 15, 15, 'Chicken'],
        ['🍟', 'Cheese Fries', 560, 9, 60, 31, 'Sides'],
        ['🥤', 'Classic Shake Vanilla', 680, 13, 79, 34, 'Shakes'],
        ['🥤', 'Classic Shake Strawberry', 710, 13, 83, 35, 'Shakes']
    ],
    'mcdonalds': [
        ['🍔', 'Big Mac', 590, 25, 46, 34, 'Burgers & Chicken'],
        ['🍔', 'Quarter Pounder with Cheese', 520, 30, 42, 26, 'Burgers & Chicken'],
        ['🍔', 'Double Cheeseburger', 450, 25, 34, 24, 'Burgers & Chicken'],
        ['🍗', '10 pc. Chicken McNuggets', 410, 23, 25, 25, 'Burgers & Chicken'],
        ['🍔', 'McChicken', 400, 14, 39, 21, 'Burgers & Chicken'],
        ['🥚', 'Egg McMuffin', 310, 17, 30, 13, 'Breakfast'],
        ['🍟', 'Medium Fries', 320, 4, 43, 15, 'Sides & Snacks'],
        ['🥧', 'Baked Apple Pie', 230, 2, 32, 11, 'Sides & Snacks'],
        ['🥤', 'Coca-Cola (Medium)', 220, 0, 59, 0, 'Drinks & Shakes'],
        ['🍔', 'Hamburger', 250, 12, 31, 9, 'Burgers & Chicken'],
        ['🍔', 'Cheeseburger', 300, 15, 32, 13, 'Burgers & Chicken'],
        ['🍔', 'McDouble', 400, 22, 33, 20, 'Burgers & Chicken'],
        ['🍔', 'Quarter Pounder with Cheese Double', 740, 48, 43, 48, 'Burgers & Chicken'],
        ['🍔', 'Spicy McChicken', 400, 14, 39, 21, 'Burgers & Chicken'],
        ['🐟', 'Filet-O-Fish', 390, 16, 39, 19, 'Burgers & Chicken'],
        ['🍗', '4 pc. Chicken McNuggets', 170, 9, 10, 10, 'Burgers & Chicken'],
        ['🥚', 'Sausage McMuffin with Egg', 480, 20, 30, 30, 'Breakfast'],
        ['🥚', 'Sausage Biscuit with Egg', 530, 17, 38, 34, 'Breakfast'],
        ['🥚', 'Bacon, Egg & Cheese Biscuit', 460, 17, 39, 26, 'Breakfast'],
        ['🥞', 'Sausage McGriddles', 430, 11, 42, 24, 'Breakfast'],
        ['🥞', 'Hotcakes (3 count with Butter & Syrup)', 580, 9, 101, 15, 'Breakfast'],
        ['🍟', 'Hash Browns', 140, 1, 15, 8, 'Breakfast'],
        ['🍟', 'Large Fries', 480, 5, 65, 23, 'Sides & Snacks'],
        ['🥤', 'Chocolate Shake (Medium)', 520, 12, 85, 14, 'Drinks & Shakes'],
        ['🥤', 'McFlurry with Oreo Cookies', 510, 12, 80, 16, 'Drinks & Shakes']
    ],
    'dutchbros': [
        ['☕', 'Double Torture (Iced)', 390, 11, 48, 17, 'Coffee'],
        ['☕', 'Golden Eagle (Iced)', 480, 9, 58, 24, 'Coffee'],
        ['⚡', 'Blue Rebel Energy Drink', 160, 0, 40, 0, 'Rebel'],
        ['🥤', 'Picture Perfect Freeze', 680, 12, 102, 24, 'Freeze'],
        ['🍵', 'Peach Green Tea', 140, 0, 36, 0, 'Tea'],
        ['☕', 'Kicker (Iced)', 430, 9, 51, 20, 'Coffee'],
        ['☕', 'Caramelizer (Iced)', 440, 10, 56, 19, 'Coffee'],
        ['☕', 'Annihilator (Iced)', 440, 9, 53, 20, 'Coffee'],
        ['☕', '911 (Iced)', 410, 14, 46, 18, 'Coffee'],
        ['☕', 'Cocomo (Iced)', 420, 9, 53, 19, 'Coffee'],
        ['🥤', 'Golden Eagle Freeze', 620, 9, 90, 24, 'Freeze'],
        ['🥤', 'Kicker Freeze', 600, 9, 88, 22, 'Freeze'],
        ['🥤', 'Caramelizer Freeze', 610, 10, 90, 23, 'Freeze'],
        ['⚡', 'Aftershock Rebel (Iced)', 170, 0, 42, 0, 'Rebel'],
        ['⚡', 'Electric Berry Rebel (Iced)', 160, 0, 41, 0, 'Rebel'],
        ['🍵', 'Passion Fruit Black Tea', 130, 0, 33, 0, 'Tea'],
        ['🥤', 'Vanilla Shake', 580, 11, 84, 21, 'Shakes & Cocoa'],
        ['🍫', 'Hot Cocoa', 420, 12, 59, 14, 'Shakes & Cocoa'],
        ['🧁', 'Chocolate Chip Muffin Top', 280, 4, 39, 12, 'Snacks'],
        ['🧁', 'Lemon Poppyseed Muffin Top', 290, 4, 41, 13, 'Snacks']
    ],
    'texasroadhouse': [
        ['🥩', '6 oz USDA Choice Sirloin', 250, 46, 3, 6, 'Steaks'],
        ['🥩', 'Ft. Worth Ribeye 12 oz', 960, 84, 8, 64, 'Steaks'],
        ['🥖', 'Fresh-Baked Bread Roll (1pc)', 120, 3, 20, 3, 'Sides'],
        ['🍟', 'Steak Fries', 360, 5, 48, 16, 'Sides'],
        ['🥗', 'House Salad with Ranch', 310, 6, 8, 28, 'Salads'],
        ['🥩', '8 oz USDA Choice Sirloin', 340, 61, 4, 8, 'Steaks'],
        ['🥩', '11 oz USDA Choice Sirloin', 460, 84, 6, 11, 'Steaks'],
        ['🥩', 'Dallas Filet 6 oz', 270, 45, 2, 9, 'Steaks'],
        ['🥩', 'Dallas Filet 8 oz', 360, 60, 3, 12, 'Steaks'],
        ['🥩', 'Ft. Worth Ribeye 16 oz', 1280, 112, 10, 85, 'Steaks'],
        ['🍖', 'Half Slab Ribs', 900, 55, 35, 60, 'Ribs & Combos'],
        ['🍖', 'Full Slab Ribs', 1450, 90, 55, 95, 'Ribs & Combos'],
        ['🍗', 'Herb Crusted Chicken', 300, 47, 5, 10, 'Chicken & Fish'],
        ['🐟', 'Grilled Salmon (8 oz)', 470, 45, 2, 32, 'Chicken & Fish'],
        ['🥔', 'Baked Potato (Plain)', 260, 6, 60, 1, 'Sides'],
        ['🥔', 'Sweet Potato with Cinnamon Butter', 380, 5, 75, 7, 'Sides'],
        ['🥦', 'Fresh Vegetables (Steamed)', 90, 3, 10, 4, 'Sides'],
        ['🥗', 'Caesar Salad', 240, 4, 9, 21, 'Salads'],
        ['🍗', 'Chicken Critters (Entree)', 480, 38, 24, 26, 'Chicken & Fish'],
        ['🥩', 'Roadhouse Roadkill (10 oz Chop)', 720, 58, 8, 50, 'Steaks']
    ],
    'wawa': [
        ['🥪', 'Classic Turkey Hoagie (10")', 780, 45, 92, 26, 'Hoagies'],
        ['🥪', 'Italian Hoagie (10")', 890, 48, 94, 35, 'Hoagies'],
        ['🍳', 'Sizzli Sausage Egg Cheese Bagel', 520, 24, 40, 30, 'Breakfast'],
        ['🥤', 'Mac & Cheese (Medium)', 470, 18, 54, 20, 'Sides'],
        ['☕', 'Iced Caramel Macchiato (16oz)', 310, 8, 48, 9, 'Beverages'],
        ['🥪', 'Shorti Turkey Hoagie (6")', 520, 30, 61, 17, 'Hoagies'],
        ['🥪', 'Shorti Italian Hoagie (6")', 590, 32, 63, 23, 'Hoagies'],
        ['🥪', 'Classic Ham & Cheese Hoagie (10")', 750, 42, 90, 24, 'Hoagies'],
        ['🥪', 'Classic Roast Beef Hoagie (10")', 790, 46, 92, 27, 'Hoagies'],
        ['🥣', 'Turkey Hoagie Bowl', 390, 35, 12, 22, 'Hoagies'],
        ['🍳', 'Sizzli Bacon Egg Cheese Biscuit', 450, 16, 36, 27, 'Breakfast'],
        ['🍳', 'Sizzli Sausage Egg Cheese Croissant', 490, 17, 29, 34, 'Breakfast'],
        ['🥚', 'Egg White Breakfast Bowl with Salsa', 150, 16, 5, 7, 'Breakfast'],
        ['🥣', 'Chicken Noodle Soup (Medium)', 180, 11, 23, 4.5, 'Sides'],
        ['🥣', 'Chicken Salad (Medium Cup)', 330, 22, 6, 24, 'Sides'],
        ['🥨', 'Soft Pretzel (1pc)', 290, 7, 61, 1.5, 'Sides'],
        ['☕', 'Cold Brew Coffee (Sweet Cream, 16oz)', 140, 1, 18, 7, 'Beverages'],
        ['🥤', 'Cookies & Cream Smoothie (16oz)', 670, 11, 98, 25, 'Beverages'],
        ['🥤', 'Mango Orange Smoothie (16oz)', 380, 2, 92, 0, 'Beverages'],
        ['🥤', 'Mashed Potatoes (Medium)', 250, 4, 38, 9, 'Sides']
    ],
    'cheesecakefactory': [
        ['🍰', 'Original Cheesecake Slice', 830, 12, 63, 58, 'Cheesecake'],
        ['🍰', 'Oreo Dream Blend Slice', 1620, 21, 155, 102, 'Cheesecake'],
        ['🍝', 'Chicken Madeira', 1180, 62, 94, 60, 'Famous Specialties'],
        ['🥗', 'SkinnyLicious Asian Chicken Salad', 590, 41, 48, 26, 'SkinnyLicious Menu'],
        ['🍔', 'SkinnyLicious Hamburger', 570, 36, 42, 28, 'SkinnyLicious Menu'],
        ['🍰', 'Fresh Strawberry Cheesecake Slice', 1000, 13, 78, 69, 'Cheesecake'],
        ['🍰', 'Godiva Chocolate Cheesecake Slice', 1400, 18, 132, 90, 'Cheesecake'],
        ['🍰', 'Low-Carb Original Cheesecake Slice', 620, 11, 38, 48, 'Cheesecake'],
        ['🍔', 'Classic Burger', 990, 54, 62, 59, 'Burgers & Sandwiches'],
        ['🥪', 'Club Sandwich', 1150, 68, 79, 62, 'Burgers & Sandwiches'],
        ['🥗', 'Luau Salad with Chicken', 970, 48, 88, 47, 'Famous Specialties'],
        ['🥗', 'SkinnyLicious Factory Chopped Salad', 490, 32, 14, 34, 'SkinnyLicious Menu'],
        ['🌮', 'SkinnyLicious Soft Tacos (Chicken)', 520, 38, 46, 20, 'SkinnyLicious Menu'],
        ['🍣', 'SkinnyLicious Salmon', 590, 45, 12, 39, 'SkinnyLicious Menu'],
        ['🍝', 'Louisiana Chicken Pasta', 2050, 78, 168, 115, 'Famous Specialties'],
        ['🍝', 'Fettuccini Alfredo with Chicken', 2150, 85, 144, 138, 'Famous Specialties'],
        ['🍟', 'French Fries Side', 520, 6, 68, 25, 'Sides & Starters'],
        ['🍞', 'Warm Sourdough Bread & Butter (Per Serving)', 220, 6, 38, 5, 'Sides & Starters'],
        ['🥤', 'Peach Smoothie', 240, 2, 58, 0, 'Beverages'],
        ['🥤', 'SkinnyLicious Red Sangria', 130, 0, 14, 0, 'Beverages']
    ],
    'carlsjr': [
        ['🍔', 'Famous Star with Cheese', 670, 28, 50, 39, 'Charbroiled Burgers'],
        ['🍔', 'Super Star with Cheese', 920, 48, 51, 58, 'Charbroiled Burgers'],
        ['🍔', 'Western Bacon Cheeseburger', 750, 34, 75, 34, 'Charbroiled Burgers'],
        ['🍟', 'Natural-Cut French Fries (Medium)', 430, 5, 59, 20, 'Sides'],
        ['🥤', 'Chocolate Hand-Scooped Ice Cream Shake', 690, 14, 95, 28, 'Shakes & Desserts'],
        ['🍔', 'Single Western Bacon Cheeseburger', 750, 34, 75, 34, 'Charbroiled Burgers'],
        ['🍔', 'Double Western Bacon Cheeseburger', 1020, 53, 76, 56, 'Charbroiled Burgers'],
        ['🍔', 'Big Carl', 920, 42, 53, 60, 'Charbroiled Burgers'],
        ['🍔', 'The Charbroiled Chicken Club Sandwich', 620, 36, 48, 31, 'Chicken'],
        ['🍗', 'Hand-Breaded Chicken Tenders (3pc)', 340, 25, 15, 20, 'Chicken'],
        ['🍗', 'Hand-Breaded Chicken Sandwich', 640, 32, 52, 33, 'Chicken'],
        ['🍟', 'Crispy Onion Rings', 410, 5, 48, 22, 'Sides'],
        ['🍟', 'Crisscut Fries (Medium)', 440, 4, 49, 25, 'Sides'],
        ['🥤', 'Vanilla Hand-Scooped Ice Cream Shake', 670, 13, 91, 28, 'Shakes & Desserts'],
        ['🥤', 'Strawberry Hand-Scooped Ice Cream Shake', 680, 13, 93, 28, 'Shakes & Desserts'],
        ['🥚', 'Sausage, Egg & Cheese Biscuit', 600, 20, 38, 41, 'Breakfast'],
        ['🌯', 'Breakfast Burrito (Bacon)', 580, 24, 42, 35, 'Breakfast'],
        ['🍟', 'Hash Rounds (Medium)', 300, 3, 33, 17, 'Breakfast']
    ],
    'crumbl': [
        ['🍪', 'Milk Chocolate Chip Cookie', 720, 8, 92, 36, 'Cookies'],
        ['🍪', 'Classic Pink Sugar Cookie', 760, 8, 100, 36, 'Cookies'],
        ['🧁', 'Churro Cookie', 680, 6, 86, 34, 'Cookies'],
        ['🍪', 'Buckeye Brownie Cookie', 800, 10, 104, 38, 'Cookies'],
        ['🍪', 'Key Lime Pie Cookie', 640, 6, 82, 30, 'Cookies'],
        ['🍪', 'Snickerdoodle Cookie', 640, 6, 84, 30, 'Cookies'],
        ['🍪', 'Cornbread Cookie', 720, 7, 91, 36, 'Cookies'],
        ['🍪', 'Waffle Cookie', 760, 7, 98, 38, 'Cookies'],
        ['🍪', 'Ultimate Peanut Butter Cookie', 780, 12, 88, 42, 'Cookies'],
        ['🍰', 'Tres Leches Cake Cookie', 740, 8, 98, 35, 'Cookies'],
        ['🍪', 'Red Velvet White Chip Cookie', 700, 8, 92, 33, 'Cookies'],
        ['🍪', 'Cookies & Cream Milkshake Cookie', 760, 8, 102, 36, 'Cookies']
    ],
    'innout': [
        ['🍔', 'Double-Double', 670, 37, 41, 41, 'Burgers'],
        ['🍔', 'Cheeseburger', 480, 22, 41, 27, 'Burgers'],
        ['🍔', 'Hamburger', 390, 16, 41, 19, 'Burgers'],
        ['🍟', 'French Fries', 395, 7, 54, 18, 'Sides'],
        ['🥤', 'Chocolate Shake', 590, 10, 92, 18, 'Drinks'],
        ['🍔', 'Double-Double (Protein Style)', 520, 33, 11, 39, 'Burgers'],
        ['🍔', '3x3 Burger', 860, 52, 42, 58, 'Burgers'],
        ['🍔', '4x4 Burger', 1050, 67, 43, 75, 'Burgers'],
        ['🍟', 'Animal Style Fries', 750, 18, 68, 45, 'Sides'],
        ['🥤', 'Vanilla Shake', 570, 10, 88, 18, 'Drinks'],
        ['🥤', 'Strawberry Shake', 590, 10, 92, 18, 'Drinks'],
        ['🥤', 'Neapolitan Shake', 590, 10, 91, 18, 'Drinks']
    ]
}

import sys

def main():
    # Force UTF-8 stdout to prevent Windows CP1252 encoding errors
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')

    if not DB_PATH.exists():
        print(f"Error: Database not found at {DB_PATH}")
        return

    conn = sqlite3.connect(str(DB_PATH))
    cur = conn.cursor()

    print("Starting database menu items update...")

    for brand_id, items in expanded_menu_data.items():
        # Confirm brand exists in brands table
        brand_exists = cur.execute("SELECT id FROM brands WHERE id = ?", (brand_id,)).fetchone()
        if not brand_exists:
            print(f"Brand '{brand_id}' not found in database. Skipping...")
            continue
        
        # Delete existing items for the brand
        cur.execute("DELETE FROM menu_items WHERE brand_id = ?", (brand_id,))
        print(f"Cleared old menu items for brand: {brand_id}")

        # Insert new expanded menu items
        for item in items:
            cur.execute(
                """INSERT INTO menu_items (brand_id, emoji, name, calories, protein, carbs, fat, category) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                (brand_id, item[0], item[1], item[2], item[3], item[4], item[5], item[6])
            )
        print(f"Inserted {len(items)} expanded menu items for brand: {brand_id}")

    conn.commit()
    conn.close()
    print("Database update completed successfully!")

if __name__ == '__main__':
    main()
