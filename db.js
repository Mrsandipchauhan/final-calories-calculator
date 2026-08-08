const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const baseDir = __dirname.endsWith('api') ? path.join(__dirname, '..') : __dirname;
const dbPath = path.join(baseDir, 'nutriroute.db');
const db = new sqlite3.Database(dbPath);

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

// Promisified helper functions
db.runAsync = function(sql, params = []) {
  return new Promise((resolve, reject) => {
    this.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

db.allAsync = function(sql, params = []) {
  return new Promise((resolve, reject) => {
    this.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

db.getAsync = function(sql, params = []) {
  return new Promise((resolve, reject) => {
    this.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

// Safe column adder (ignores if column already exists)
async function addColumnSafe(table, column, type) {
  try {
    await db.runAsync(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
  } catch (e) {
    // Column likely already exists — ignore
  }
}

// Initialize DB schema
async function initDb() {
  // ── Core Tables ──

  await db.runAsync(`
    CREATE TABLE IF NOT EXISTS admins (
      username TEXT PRIMARY KEY,
      password_hash TEXT NOT NULL
    )
  `);

  await db.runAsync(`
    CREATE TABLE IF NOT EXISTS brands (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      desc TEXT NOT NULL,
      bg TEXT NOT NULL
    )
  `);

  await db.runAsync(`
    CREATE TABLE IF NOT EXISTS menu_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      brand_id TEXT NOT NULL,
      emoji TEXT NOT NULL,
      name TEXT NOT NULL,
      calories INTEGER NOT NULL,
      protein INTEGER NOT NULL,
      carbs INTEGER NOT NULL,
      fat INTEGER NOT NULL,
      category TEXT NOT NULL,
      FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE
    )
  `);

  await db.runAsync(`
    CREATE TABLE IF NOT EXISTS brand_sizes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      brand_id TEXT NOT NULL,
      name TEXT NOT NULL,
      calorie_adjust INTEGER NOT NULL,
      FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE
    )
  `);

  await db.runAsync(`
    CREATE TABLE IF NOT EXISTS brand_options (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      brand_id TEXT NOT NULL,
      name TEXT NOT NULL,
      calorie_adjust INTEGER NOT NULL,
      FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE
    )
  `);

  await db.runAsync(`
    CREATE TABLE IF NOT EXISTS blogs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      content TEXT NOT NULL,
      summary TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      image_url TEXT
    )
  `);

  // ── New Tables ──

  // Site-wide settings (code injection, site metadata)
  await db.runAsync(`
    CREATE TABLE IF NOT EXISTS site_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL DEFAULT ''
    )
  `);

  // Image / Media library
  await db.runAsync(`
    CREATE TABLE IF NOT EXISTS media (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size_bytes INTEGER DEFAULT 0,
      alt_text TEXT DEFAULT '',
      uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ── Migrations: Add new columns to existing tables ──

  // Blogs SEO expansion
  await addColumnSafe('blogs', 'meta_title', 'TEXT');
  await addColumnSafe('blogs', 'meta_description', 'TEXT');
  await addColumnSafe('blogs', 'canonical_url', 'TEXT');
  await addColumnSafe('blogs', 'schema_type', "TEXT DEFAULT 'Article'");
  await addColumnSafe('blogs', 'status', "TEXT DEFAULT 'published'");
  await addColumnSafe('blogs', 'author', "TEXT DEFAULT 'NutriRoute Team'");
  await addColumnSafe('blogs', 'updated_at', 'TEXT');

  // Brands SEO expansion
  await addColumnSafe('brands', 'meta_title', 'TEXT');
  await addColumnSafe('brands', 'meta_description', 'TEXT');
  await addColumnSafe('brands', 'seo_content', 'TEXT');
  await addColumnSafe('brands', 'logo_path', 'TEXT');

  // ── Seed default settings ──
  const defaultSettings = [
    ['site_title', 'NutriRoute — Restaurant Calorie Calculator'],
    ['site_description', 'Free multi-brand calorie calculator for coffee, sandwiches and fast-casual restaurant orders.'],
    ['site_url', 'https://organizeddesignva.com'],
    ['head_code', ''],
    ['body_code', ''],
    ['analytics_id', ''],
    ['search_console_code', ''],
    ['adsense_code', '']
  ];

  for (const [key, value] of defaultSettings) {
    const existing = await db.getAsync('SELECT key FROM site_settings WHERE key = ?', [key]);
    if (!existing) {
      await db.runAsync('INSERT INTO site_settings (key, value) VALUES (?, ?)', [key, value]);
    }
  }

  // ── Create default admin ──
  const defaultAdmin = await db.getAsync('SELECT * FROM admins WHERE username = ?', ['admin']);
  if (!defaultAdmin) {
    const hash = await bcrypt.hash('adminpassword', 10);
    await db.runAsync('INSERT INTO admins (username, password_hash) VALUES (?, ?)', ['admin', hash]);
    console.log('Default admin account created: admin / adminpassword');
  }

  console.log('Database initialized successfully.');
}

module.exports = {
  db,
  initDb
};
