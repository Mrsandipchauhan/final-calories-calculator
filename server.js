const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const siteConfig = require('./site_config.json');
const { getCanonicalUrl } = require('./canonical_helper');
const { getHomepageSchemaGraph, getBrandPageSchemaGraph, getBlogPostSchemaGraph } = require('./schema_helper');
const { getSocialMetaTags } = require('./meta_helper');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { db, initDb } = require('./db');

const baseDir = __dirname.endsWith('api') ? path.join(__dirname, '..') : __dirname;

const app = express();
const PORT = process.env.PORT || 8089;

// ── Multer config for image uploads ──
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(baseDir, 'uploads')),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|svg|ico/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype.split('/')[1]);
    if (ext || mime) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  }
});

// ── Middlewares ──
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(session({
  secret: 'nutriroute-secret-key-1337',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// Serve uploaded images and static assets with long-term caching
const staticCacheOptions = {
  maxAge: '1y',
  etag: true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    } else if (filePath.match(/\.(css|js|woff2?|png|jpg|jpeg|gif|webp|svg|ico)$/)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  }
};
app.use('/uploads', express.static(path.join(baseDir, 'uploads'), staticCacheOptions));
app.use('/brands/images', express.static(path.join(baseDir, 'brands', 'images'), staticCacheOptions));
// Skip index.html in static so dynamic homepage route handles it
app.use((req, res, next) => {
  if (req.path === '/index.html') return next();
  express.static(baseDir, { ...staticCacheOptions, index: false })(req, res, next);
});

// X-Robots-Tag header middleware for APIs
app.use('/api', (req, res, next) => {
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  next();
});

// Helper to determine Robots Meta tag
function getRobotsTag(req, isPublicPage = true) {
  const host = req.get('host') || '';
  const isProd = host.includes('organizeddesignva.com');
  if (isProd && isPublicPage) {
    return '<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">';
  }
  return '<meta name="robots" content="noindex, nofollow">';
}

// Admin Auth Middleware
function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) next();
  else res.status(401).json({ error: 'Unauthorized. Admin access required.' });
}

// ── Helper: Get all site settings as object ──
async function getSettings() {
  const rows = await db.allAsync('SELECT key, value FROM site_settings');
  const obj = {};
  rows.forEach(r => obj[r.key] = r.value);
  return obj;
}

// ── Helper: Inject code into HTML string ──
async function injectIntoHtml(html) {
  const settings = await getSettings();
  const headCode = settings.head_code || '';
  const bodyCode = settings.body_code || '';
  const analyticsId = settings.analytics_id || '';
  const scCode = settings.search_console_code || '';
  const adsenseCode = settings.adsense_code || '';

  let injectedHead = '';
  if (analyticsId) {
    injectedHead += `<script async src="https://www.googletagmanager.com/gtag/js?id=${analyticsId}"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${analyticsId}');</script>\n`;
  }
  if (scCode) injectedHead += `${scCode}\n`;
  if (adsenseCode) injectedHead += `${adsenseCode}\n`;
  if (headCode) injectedHead += `${headCode}\n`;

  if (injectedHead) {
    html = html.replace('</head>', injectedHead + '</head>');
  }
  if (bodyCode) {
    html = html.replace('</body>', bodyCode + '\n</body>');
  }
  return html;
}

// ── Helper: Generate Schema JSON-LD ──
function schemaScript(schemaObj) {
  return `<script type="application/ld+json">${JSON.stringify(schemaObj)}</script>`;
}

// ══════════════════════════════════════════
// PUBLIC API ENDPOINTS
// ══════════════════════════════════════════

// Get all brands
app.get('/api/brands', async (req, res) => {
  try {
    const brands = await db.allAsync('SELECT id, name, category, desc, bg, logo_path FROM brands');
    res.json(brands);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get brand details and items
app.get('/api/brands/:id/items', async (req, res) => {
  try {
    const brandId = req.params.id;
    const brand = await db.getAsync('SELECT * FROM brands WHERE id = ?', [brandId]);
    if (!brand) return res.status(404).json({ error: 'Brand not found' });

    const items = await db.allAsync('SELECT * FROM menu_items WHERE brand_id = ?', [brandId]);
    const sizes = await db.allAsync('SELECT * FROM brand_sizes WHERE brand_id = ?', [brandId]);
    const options = await db.allAsync('SELECT * FROM brand_options WHERE brand_id = ?', [brandId]);

    const formattedItems = items.map(item => [
      item.emoji, item.name, item.calories, item.protein,
      item.carbs, item.fat, item.category, item.id
    ]);
    const formattedSizes = sizes.map(s => [s.name, s.calorie_adjust, s.id]);
    const formattedOptions = options.map(o => [o.name, o.calorie_adjust, o.id]);

    res.json({ brand, items: formattedItems, sizes: formattedSizes, options: formattedOptions });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get all published blogs
app.get('/api/blogs', async (req, res) => {
  try {
    const posts = await db.allAsync("SELECT * FROM blogs WHERE COALESCE(status,'published')='published' ORDER BY created_at DESC");
    res.json(posts);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get single blog post by slug
app.get('/api/blogs/:slug', async (req, res) => {
  try {
    const post = await db.getAsync('SELECT * FROM blogs WHERE slug = ?', [req.params.slug]);
    if (!post) return res.status(404).json({ error: 'Blog post not found' });
    res.json(post);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get site settings (public subset)
app.get('/api/settings/public', async (req, res) => {
  try {
    const settings = await getSettings();
    res.json({
      site_title: settings.site_title || '',
      site_description: settings.site_description || '',
      site_url: settings.site_url || ''
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ══════════════════════════════════════════
// ADMIN AUTH API
// ══════════════════════════════════════════

app.post('/api/admin/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const admin = await db.getAsync('SELECT * FROM admins WHERE username = ?', [username]);
    if (admin && await bcrypt.compare(password, admin.password_hash)) {
      req.session.isAdmin = true;
      req.session.username = username;
      res.json({ success: true, message: 'Logged in successfully' });
    } else {
      res.status(401).json({ error: 'Invalid username or password' });
    }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/admin/check', (req, res) => {
  if (req.session && req.session.isAdmin) {
    res.json({ loggedIn: true, username: req.session.username });
  } else {
    res.json({ loggedIn: false });
  }
});

app.post('/api/admin/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ error: 'Logout failed' });
    res.clearCookie('connect.sid');
    res.json({ success: true });
  });
});

app.post('/api/admin/change-password', requireAdmin, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const admin = await db.getAsync('SELECT * FROM admins WHERE username = ?', [req.session.username]);
    if (admin && await bcrypt.compare(currentPassword, admin.password_hash)) {
      const hash = await bcrypt.hash(newPassword, 10);
      await db.runAsync('UPDATE admins SET password_hash = ? WHERE username = ?', [hash, req.session.username]);
      res.json({ success: true, message: 'Password updated successfully' });
    } else {
      res.status(400).json({ error: 'Current password is incorrect' });
    }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ══════════════════════════════════════════
// ADMIN CRUD — BRANDS
// ══════════════════════════════════════════

app.post('/api/admin/brands', requireAdmin, async (req, res) => {
  const { id, name, category, desc, bg } = req.body;
  try {
    await db.runAsync(
      'INSERT INTO brands (id, name, category, desc, bg) VALUES (?, ?, ?, ?, ?)',
      [id.toLowerCase().replace(/\s+/g, '-'), name, category, desc, bg || '#f0f0f0']
    );
    res.json({ success: true, message: 'Brand added successfully' });
  } catch (err) { res.status(400).json({ error: 'Brand ID already exists or invalid data.' }); }
});

app.put('/api/admin/brands/:id', requireAdmin, async (req, res) => {
  const { name, category, desc, bg } = req.body;
  try {
    await db.runAsync(
      'UPDATE brands SET name = ?, category = ?, desc = ?, bg = ? WHERE id = ?',
      [name, category, desc, bg, req.params.id]
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/admin/brands/:id', requireAdmin, async (req, res) => {
  try {
    await db.runAsync('DELETE FROM brands WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Brand SEO content update
app.put('/api/admin/brands/:id/seo', requireAdmin, async (req, res) => {
  const { meta_title, meta_description, seo_content } = req.body;
  try {
    await db.runAsync(
      'UPDATE brands SET meta_title = ?, meta_description = ?, seo_content = ? WHERE id = ?',
      [meta_title || null, meta_description || null, seo_content || null, req.params.id]
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Brand logo upload
app.post('/api/admin/brands/:id/logo', requireAdmin, upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const logoPath = '/uploads/' + req.file.filename;
    await db.runAsync('UPDATE brands SET logo_path = ? WHERE id = ?', [logoPath, req.params.id]);
    res.json({ success: true, logo_path: logoPath });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ══════════════════════════════════════════
// ADMIN CRUD — MENU ITEMS
// ══════════════════════════════════════════

app.post('/api/admin/items', requireAdmin, async (req, res) => {
  const { brand_id, emoji, name, calories, protein, carbs, fat, category } = req.body;
  try {
    await db.runAsync(
      'INSERT INTO menu_items (brand_id, emoji, name, calories, protein, carbs, fat, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [brand_id, emoji || '🍔', name, calories, protein, carbs, fat, category || 'Entrees']
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/admin/items/:id', requireAdmin, async (req, res) => {
  const { emoji, name, calories, protein, carbs, fat, category } = req.body;
  try {
    await db.runAsync(
      'UPDATE menu_items SET emoji = ?, name = ?, calories = ?, protein = ?, carbs = ?, fat = ?, category = ? WHERE id = ?',
      [emoji, name, calories, protein, carbs, fat, category, req.params.id]
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/admin/items/:id', requireAdmin, async (req, res) => {
  try {
    await db.runAsync('DELETE FROM menu_items WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ══════════════════════════════════════════
// ADMIN CRUD — SIZES & OPTIONS
// ══════════════════════════════════════════

app.post('/api/admin/configs', requireAdmin, async (req, res) => {
  const { brand_id, type, name, calorie_adjust } = req.body;
  try {
    const table = type === 'sizes' ? 'brand_sizes' : 'brand_options';
    await db.runAsync(`INSERT INTO ${table} (brand_id, name, calorie_adjust) VALUES (?, ?, ?)`, [brand_id, name, calorie_adjust || 0]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/admin/configs/:type/:id', requireAdmin, async (req, res) => {
  try {
    const table = req.params.type === 'sizes' ? 'brand_sizes' : 'brand_options';
    await db.runAsync(`DELETE FROM ${table} WHERE id = ?`, [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ══════════════════════════════════════════
// ADMIN CRUD — BLOGS (with SEO fields)
// ══════════════════════════════════════════

// Get all blogs for admin (including drafts)
app.get('/api/admin/blogs', requireAdmin, async (req, res) => {
  try {
    const posts = await db.allAsync('SELECT * FROM blogs ORDER BY created_at DESC');
    res.json(posts);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/admin/blogs', requireAdmin, async (req, res) => {
  const { title, slug, summary, content, image_url, meta_title, meta_description, canonical_url, schema_type, status, author } = req.body;
  const finalSlug = (slug || title).toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
  try {
    await db.runAsync(
      `INSERT INTO blogs (title, slug, summary, content, image_url, meta_title, meta_description, canonical_url, schema_type, status, author)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, finalSlug, summary, content, image_url,
       meta_title || null, meta_description || null, canonical_url || null,
       schema_type || 'Article', status || 'published', author || 'NutriRoute Team']
    );
    res.json({ success: true });
  } catch (err) { res.status(400).json({ error: 'Blog with this slug already exists.' }); }
});

app.put('/api/admin/blogs/:id', requireAdmin, async (req, res) => {
  const { title, slug, summary, content, image_url, meta_title, meta_description, canonical_url, schema_type, status, author } = req.body;
  const finalSlug = (slug || title).toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
  try {
    await db.runAsync(
      `UPDATE blogs SET title=?, slug=?, summary=?, content=?, image_url=?,
       meta_title=?, meta_description=?, canonical_url=?, schema_type=?, status=?, author=?, updated_at=CURRENT_TIMESTAMP
       WHERE id=?`,
      [title, finalSlug, summary, content, image_url,
       meta_title || null, meta_description || null, canonical_url || null,
       schema_type || 'Article', status || 'published', author || 'NutriRoute Team',
       req.params.id]
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/admin/blogs/:id', requireAdmin, async (req, res) => {
  try {
    await db.runAsync('DELETE FROM blogs WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ══════════════════════════════════════════
// ADMIN — SITE SETTINGS
// ══════════════════════════════════════════

app.get('/api/admin/settings', requireAdmin, async (req, res) => {
  try {
    const settings = await getSettings();
    res.json(settings);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/admin/settings', requireAdmin, async (req, res) => {
  try {
    const updates = req.body;
    for (const [key, value] of Object.entries(updates)) {
      await db.runAsync(
        'INSERT INTO site_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?',
        [key, value, value]
      );
    }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ══════════════════════════════════════════
// ADMIN — MEDIA LIBRARY
// ══════════════════════════════════════════

app.post('/api/admin/upload', requireAdmin, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    await db.runAsync(
      'INSERT INTO media (filename, original_name, mime_type, size_bytes, alt_text) VALUES (?, ?, ?, ?, ?)',
      [req.file.filename, req.file.originalname, req.file.mimetype, req.file.size, req.body.alt_text || '']
    );
    res.json({ success: true, url: '/uploads/' + req.file.filename, filename: req.file.filename });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/admin/media', requireAdmin, async (req, res) => {
  try {
    const media = await db.allAsync('SELECT * FROM media ORDER BY uploaded_at DESC');
    res.json(media);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/admin/media/:id', requireAdmin, async (req, res) => {
  try {
    const file = await db.getAsync('SELECT * FROM media WHERE id = ?', [req.params.id]);
    if (file) {
      const filepath = path.join(__dirname, 'uploads', file.filename);
      if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
      await db.runAsync('DELETE FROM media WHERE id = ?', [req.params.id]);
    }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ══════════════════════════════════════════
// SEO ROUTES — sitemap.xml, robots.txt
// ══════════════════════════════════════════

app.get('/sitemap.xml', async (req, res) => {
  try {
    const settings = await getSettings();
    const siteUrl = (settings.site_url || 'https://nutriroute.com').replace(/\/$/, '');
    const brands = await db.allAsync('SELECT id FROM brands');
    const posts = await db.allAsync("SELECT slug, updated_at, created_at FROM blogs WHERE COALESCE(status,'published')='published'");

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${siteUrl}/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>
  <url><loc>${siteUrl}/blog</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`;

    brands.forEach(b => {
      xml += `\n  <url><loc>${siteUrl}/brands/${b.id}.html</loc><changefreq>monthly</changefreq><priority>0.9</priority></url>`;
    });
    posts.forEach(p => {
      const lastmod = p.updated_at || p.created_at || new Date().toISOString();
      xml += `\n  <url><loc>${siteUrl}/blog/${p.slug}</loc><lastmod>${lastmod.split('T')[0] || lastmod.split(' ')[0]}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>`;
    });

    xml += '\n</urlset>';
    res.set('Content-Type', 'application/xml');
    res.send(xml);
  } catch (err) { res.status(500).send('Error generating sitemap'); }
});

app.get('/robots.txt', async (req, res) => {
  const settings = await getSettings();
  const siteUrl = (settings.site_url || 'https://nutriroute.com').replace(/\/$/, '');
  res.set('Content-Type', 'text/plain');
  res.send(`User-agent: *
Allow: /
Disallow: /admin
Disallow: /admin.html
Disallow: /api/

Sitemap: ${siteUrl}/sitemap.xml
`);
});

// ══════════════════════════════════════════
// SERVER-RENDERED BLOG CLEAN URLs
// ══════════════════════════════════════════

// Blog listing page
app.get('/blog', (req, res) => {
  res.sendFile(path.join(baseDir, 'blog.html'));
});

// Clean URLs for EEAT & Legal Pages
const cleanUrlPages = [
  'about',
  'contact',
  'editorial-policy',
  'methodology',
  'privacy',
  'terms',
  'disclaimer',
  'accessibility',
  'team'
];

cleanUrlPages.forEach(page => {
  app.get(`/${page}`, (req, res) => {
    res.sendFile(path.join(baseDir, `${page}.html`));
  });
});

// Individual blog post — serve blog.html with injected meta
app.get('/blog/:slug', async (req, res) => {
  try {
    const post = await db.getAsync('SELECT * FROM blogs WHERE slug = ?', [req.params.slug]);
    if (!post) return res.status(404).sendFile(path.join(baseDir, 'blog.html'));

    let html = fs.readFileSync(path.join(baseDir, 'blog.html'), 'utf8');
    const siteUrl = siteConfig.SITE_URL;

    // Replace meta tags for SEO
    const metaTitle = post.meta_title || `${post.title} — ${siteConfig.SITE_NAME} Blog`;
    const metaDesc = post.meta_description || post.summary;
    const canonical = getCanonicalUrl(post.canonical_url || ('/blog/' + post.slug));

    html = html.replace(/<title>.*?<\/title>/, `<title>${metaTitle}</title>`);
    html = html.replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${metaDesc.replace(/"/g, '&quot;')}">`);

    // Strip existing OG/Twitter tags to prevent duplicates
    html = html.replace(/<meta property="og:[^>]*>/gi, '');
    html = html.replace(/<meta name="twitter:[^>]*>/gi, '');

    const socialMeta = getSocialMetaTags({
      title: metaTitle,
      description: metaDesc,
      canonicalUrl: canonical,
      type: "article",
      imageUrl: post.image_url || siteConfig.DEFAULT_OG_IMAGE,
      imageAlt: `${post.title} Featured Image`
    });

    const ogTags = `
  ${getRobotsTag(req, true)}
  <link rel="canonical" href="${canonical}">
  ${socialMeta}
`;
    const blogGraphSchema = schemaScript(getBlogPostSchemaGraph(post, canonical));

    // Inject a data attribute so client JS can auto-load the post
    html = html.replace('<body>', `<body data-blog-slug="${post.slug}">`);

    html = html.replace('</head>', ogTags + blogGraphSchema + '\n</head>');

    // Apply code injection
    html = await injectIntoHtml(html);
    res.send(html);
  } catch (err) {
    res.status(500).send('Error loading blog post');
  }
});

// ══════════════════════════════════════════
// SERVER-RENDERED BRAND PAGES WITH SEO
// ══════════════════════════════════════════

// Serve static files EXCEPT brands/* (we want to intercept those)
app.use((req, res, next) => {
  // Let brands/* be handled by our custom route (both with and without .html)
  if (req.path.match(/^\/brands\/[^/]+(\.html)?$/)) return next();
  // Let homepage be handled by the dynamic route
  if (req.path === '/' || req.path === '/index.html') return next();
  express.static(path.join(baseDir))(req, res, next);
});

// Dynamic brand page serving with SEO injection
app.get(['/brands/:brandId.html', '/brands/:brandId'], async (req, res) => {
  try {
    const brandId = req.params.brandId.replace(/\.html$/, '');
    const brand = await db.getAsync('SELECT * FROM brands WHERE id = ?', [brandId]);
    const siteUrl = siteConfig.SITE_URL;

    // Determine which HTML file to serve
    let htmlFile;
    const specificFile = path.join(baseDir, 'brands', `${brandId}.html`);
    const templateFile = path.join(baseDir, 'brands', 'brand_template.html');

    if (fs.existsSync(specificFile) && brandId !== 'brand_template') {
      htmlFile = specificFile;
    } else {
      htmlFile = templateFile;
    }

    let html = fs.readFileSync(htmlFile, 'utf8');

    if (brand) {
      const metaTitle = brand.meta_title || `${brand.name} Calorie Calculator — Nutrition Facts & Macros | ${siteConfig.SITE_NAME}`;
      const metaDesc = brand.meta_description || `Use the free ${brand.name} calorie calculator to check calories, protein, carbs and fat for every menu item. Customize your order and make smarter choices.`;
      const canonical = getCanonicalUrl('/brands/' + brandId);

      // Replace/inject title and description
      html = html.replace(/<title>.*?<\/title>/, `<title>${metaTitle}</title>`);
      if (html.includes('name="description"')) {
        html = html.replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${metaDesc.replace(/"/g, '&quot;')}">`);
      } else {
        html = html.replace('</head>', `<meta name="description" content="${metaDesc.replace(/"/g, '&quot;')}">\n</head>`);
      }

      // Pre-render brand parameters inside HTML body
      html = html.replace(/<div class="eyebrow">[\s\S]*?Make your (?:order|.*?) work for you\.[\s\S]*?<\/div>/, `<div class="eyebrow"><span></span> Make your ${brand.name} order work for you.</div>`);
      html = html.replace(/<h1>[\s\S]*?Calories[\s\S]*?<\/h1>/, `<h1>${brand.name} Calories &amp;<br><em>Nutrition Calculator</em></h1>`);
      html = html.replace(/<p>Use our interactive calorie calculator[\s\S]*?<\/p>/, `<p>Use our interactive ${brand.name} calorie calculator to customize your orders. Select sizes, options, and track calories, protein, carbs, and fat in real-time to plan your healthy runs.</p>`);
      html = html.replace(/<span class="badge-text">.*?<\/span>/, `<span class="badge-text">${brand.name}</span>`);
      
      let logoPath = brand.logo_path || `brands/images/${brand.id}.png`;
      if (!logoPath.startsWith('/')) {
        logoPath = '/' + logoPath;
      }
      html = html.replace(/<div class="badge-logo-circle">[\s\S]*?<\/div>/, `<div class="badge-logo-circle"><img src="${logoPath}" alt="${brand.name} logo" width="80" height="80" fetchpriority="high" decoding="async"></div>`);
      html = html.replace(/<span class="active-crumb">.*?<\/span>/, `<span class="active-crumb">${brand.name} Calorie Calculator</span>`);
      
      if (brand.seo_content) {
        html = html.replace(/<section class="brand-content wrap">[\s\S]*?<\/section>/, `<section class="brand-content wrap">${brand.seo_content}</section>`);
      }

      // Strip existing OG/Twitter tags to prevent duplicates
      html = html.replace(/<meta property="og:[^>]*>/gi, '');
      html = html.replace(/<meta name="twitter:[^>]*>/gi, '');

      const socialMeta = getSocialMetaTags({
        title: metaTitle,
        description: metaDesc,
        canonicalUrl: canonical,
        type: "website",
        imageUrl: logoPath,
        imageAlt: `${brand.name} Logo`
      });

      // Inject canonical + OG + schema
      const seoHead = `
  ${getRobotsTag(req, true)}
  <link rel="canonical" href="${canonical}">
  ${socialMeta}
`;
      // Dynamic FAQ Extraction from HTML content
      const faqList = [];
      const detailsBlocks = html.match(/<details[^>]*>[\s\S]*?<\/details>/gi) || [];
      for (const block of detailsBlocks) {
        const summaryMatch = block.match(/<summary[^>]*>([\s\S]*?)<\/summary>/i);
        const pMatch = block.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
        if (summaryMatch && pMatch) {
          const q = summaryMatch[1].replace(/<[^>]+>/g, '').replace(/\+/g, '').trim();
          const a = pMatch[1].replace(/<[^>]+>/g, '').replace(/\+/g, '').trim();
          faqList.push({
            "@type": "Question",
            "name": q,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": a
            }
          });
        }
      }

      // Clean all existing schema script blocks from HTML to prevent duplicates
      html = html.replace(/\s*<script type="application\/ld\+json">[\s\S]*?<\/script>/gi, '');

      // Generate single consolidated entity graph schema
      const brandGraphSchema = schemaScript(getBrandPageSchemaGraph(brand, canonical, faqList));

      html = html.replace('</head>', seoHead + brandGraphSchema + '\n</head>');

      // Set data-brand attribute
      if (!html.includes('data-brand=')) {
        html = html.replace('<body', `<body data-brand="${brandId}"`);
      }
    }

    html = await injectIntoHtml(html);
    res.send(html);
  } catch (err) {
    res.status(500).send('Error loading brand page');
  }
});

// ══════════════════════════════════════════
// HOMEPAGE WITH SEO INJECTION
// ══════════════════════════════════════════

app.get(['/', '/index.html'], async (req, res) => {
  try {
    let html = fs.readFileSync(path.join(baseDir, 'index.html'), 'utf8');
    const settings = await getSettings();
    const siteUrl = siteConfig.SITE_URL;

    // Pre-render brand list cards
    const brands = await db.allAsync('SELECT id, name, category, desc, bg, logo_path FROM brands');
    const brandCardsHtml = brands.map(brand => {
      let logoSrc = brand.logo_path || `brands/images/${brand.id}.png`;
      if (!logoSrc.startsWith('/')) {
        logoSrc = '/' + logoSrc;
      }
      return `
      <a class="brand-card" href="brands/${brand.id}.html" style="background: ${brand.bg};">
        <span class="brand-icon" style="background: none; overflow: visible; display: flex; align-items: center; justify-content: center; border-radius: 50%;">
          <img src="${logoSrc}" alt="${brand.name} logo" width="50" height="50" loading="lazy" decoding="async" style="width: 100%; height: 100%; object-fit: contain; border-radius: 50%; display: block;" onerror="if(this.src.includes('.png')){this.src=this.src.replace('.png','.svg');}else{this.style.display='none';this.parentElement.innerHTML='<span style=\\'font-size:28px;font-weight:800;color:var(--ink)\\'>${brand.name[0]}</span>';}">
        </span>
        <div>
          <small>${brand.category}</small>
          <h3>${brand.name}</h3>
          <p>${brand.desc}</p>
        </div>
        <b>→</b>
      </a>`;
    }).join('');

    // Replace entire brand-grid contents (greedy to capture all nested divs)
    html = html.replace(/<div class="brand-grid" id="brandGrid">[\s\S]*?<\/div>\s*<\/section>/, `<div class="brand-grid" id="brandGrid">${brandCardsHtml}</div></section>`);

    // Dynamic FAQ list for homepage
    const faqList = [
      { "@type": "Question", "name": "How accurate are the calorie estimates?", "acceptedAnswer": { "@type": "Answer", "text": "Our calculator uses published brand nutrition information and applies the selections you make. Recipes and portions can vary by location, so treat every result as a helpful estimate." }},
      { "@type": "Question", "name": "Is NutriRoute affiliated with these restaurants?", "acceptedAnswer": { "@type": "Answer", "text": "No. NutriRoute is an independent educational tool. Brand names are used only to help you identify the menu you want to explore." }},
      { "@type": "Question", "name": "Can I calculate customisations?", "acceptedAnswer": { "@type": "Answer", "text": "Yes — our brand calculators include common choices such as size, milk, bread and add-ons, with results updated as you build." }},
      { "@type": "Question", "name": "Why don't I see every menu item?", "acceptedAnswer": { "@type": "Answer", "text": "We are growing the database in carefully reviewed batches. Check back often: new options are added to existing brands regularly." }}
    ];

    // Clean all existing schema script blocks from HTML to prevent duplicates
    html = html.replace(/\s*<script type="application\/ld\+json">[\s\S]*?<\/script>/gi, '');

    const homepageGraphSchema = schemaScript(getHomepageSchemaGraph(faqList));

    // Strip existing OG/Twitter tags to prevent duplicates
    html = html.replace(/<meta property="og:[^>]*>/gi, '');
    html = html.replace(/<meta name="twitter:[^>]*>/gi, '');

    const socialMeta = getSocialMetaTags({
      title: siteConfig.SITE_NAME,
      description: settings.site_description || "Free restaurant calorie and macros calculator.",
      canonicalUrl: getCanonicalUrl('/'),
      type: "website",
      imageUrl: siteConfig.DEFAULT_OG_IMAGE,
      imageAlt: `${siteConfig.SITE_NAME} Home`
    });

    const canonicalTag = `${getRobotsTag(req, true)}\n<link rel="canonical" href="${getCanonicalUrl('/')}">\n${socialMeta}`;
    html = html.replace('</head>', canonicalTag + '\n' + homepageGraphSchema + '\n</head>');
    html = await injectIntoHtml(html);
    res.send(html);
  } catch (err) {
    // Fallback to static file
    res.sendFile(path.join(baseDir, 'index.html'));
  }
});

// Helper to escape XML special characters
function xmlEscape(str) {
  if (!str) return '';
  return str.replace(/[<>&'"]/g, c => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
    }
  });
}

// 1. Root Sitemap Index
app.get('/sitemap.xml', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const siteUrl = siteConfig.SITE_URL;
  
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${siteUrl}/sitemaps/sitemap-pages.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${siteUrl}/sitemaps/sitemap-brands.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${siteUrl}/sitemaps/sitemap-blog.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${siteUrl}/sitemaps/sitemap-images.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
</sitemapindex>`;
  
  res.header('Content-Type', 'application/xml');
  res.send(xml);
});

// 2. Sub-Sitemap: Pages (homepage, blog index)
app.get('/sitemaps/sitemap-pages.xml', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${getCanonicalUrl('/')}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${getCanonicalUrl('/blog')}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>`;

  res.header('Content-Type', 'application/xml');
  res.send(xml);
});

// 3. Sub-Sitemap: Brands & Calculators
app.get('/sitemaps/sitemap-brands.xml', async (req, res) => {
  try {
    const brands = await db.allAsync('SELECT id FROM brands');
    const today = new Date().toISOString().split('T')[0];
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

    for (const brand of brands) {
      xml += `
  <url>
    <loc>${getCanonicalUrl('/brands/' + brand.id)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`;
    }

    xml += '\n</urlset>';
    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (err) {
    res.status(500).send('Error generating brands sitemap');
  }
});

// 4. Sub-Sitemap: Blog posts
app.get('/sitemaps/sitemap-blog.xml', async (req, res) => {
  try {
    const blogs = await db.allAsync('SELECT slug, updated_at, created_at FROM blogs');
    const today = new Date().toISOString().split('T')[0];
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

    for (const blog of blogs) {
      const blogDate = (blog.updated_at || blog.created_at || today).split('T')[0].split(' ')[0];
      xml += `
  <url>
    <loc>${getCanonicalUrl('/blog/' + blog.slug)}</loc>
    <lastmod>${blogDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
    }

    xml += '\n</urlset>';
    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (err) {
    res.status(500).send('Error generating blog sitemap');
  }
});

// 5. Sub-Sitemap: Images
app.get('/sitemaps/sitemap-images.xml', async (req, res) => {
  try {
    const brands = await db.allAsync('SELECT id, name, desc, logo_path FROM brands');
    const blogs = await db.allAsync('SELECT slug, title, summary, image_url FROM blogs');
    const siteUrl = siteConfig.SITE_URL;
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">`;

    // Add brand logos
    for (const brand of brands) {
      let logoPath = brand.logo_path || `brands/images/${brand.id}.png`;
      if (!logoPath.startsWith('/')) {
        logoPath = '/' + logoPath;
      }
      xml += `
  <url>
    <loc>${getCanonicalUrl('/brands/' + brand.id)}</loc>
    <image:image>
      <image:loc>${siteUrl}${logoPath}</image:loc>
      <image:title>${xmlEscape(brand.name)} Logo</image:title>
      <image:caption>Calorie calculator and custom order helper for ${xmlEscape(brand.name)}.</image:caption>
    </image:image>
  </url>`;
    }

    // Add blog featured images
    for (const blog of blogs) {
      if (blog.image_url) {
        xml += `
  <url>
    <loc>${getCanonicalUrl('/blog/' + blog.slug)}</loc>
    <image:image>
      <image:loc>${xmlEscape(blog.image_url)}</image:loc>
      <image:title>${xmlEscape(blog.title)}</image:title>
      <image:caption>${xmlEscape(blog.summary)}</image:caption>
    </image:image>
  </url>`;
      }
    }

    xml += '\n</urlset>';
    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (err) {
    res.status(500).send('Error generating images sitemap');
  }
});

// Dynamic environment-aware robots.txt
app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  const host = req.get('host') || '';
  const isProd = host.includes('organizeddesignva.com');
  
  if (!isProd) {
    // Block all crawlers in non-production environments (e.g. localhost, staging, dev)
    res.send(`User-agent: *
Disallow: /
`);
    return;
  }
  
  // Production robots.txt rules
  res.send(`User-agent: *
Allow: /
Allow: /brands/
Allow: /blog/
Allow: /api/brands.json
Allow: /api/blogs.json
Allow: /api/brands/*/items.json
Allow: /api/blogs/*.json

Disallow: /admin
Disallow: /admin/
Disallow: /api/admin/
Disallow: /uploads/
Disallow: /scripts/
Disallow: /node_modules/
Disallow: /outputs/
Disallow: /work/
Disallow: /*?*

# Block duplicate tracking and parameter URLs
Disallow: /*?utm_*
Disallow: /*?fbclid
Disallow: /*?gclid
Disallow: /*?ref
Disallow: /*?sort
Disallow: /*?filter
Disallow: /*?q=

# Block backup/temporary extensions
Disallow: /*.bak$
Disallow: /*.log$
Disallow: /*.tmp$

Sitemap: ${getCanonicalUrl('/sitemap.xml')}
`);
});

// Admin dashboard route
app.get('/admin', (req, res) => {
  res.sendFile(path.join(baseDir, 'admin.html'));
});

// ── Start Server ──
async function startServer() {
  await initDb();
  if (!process.env.VERCEL) {
    app.listen(PORT, () => {
      console.log(`Server is running at http://localhost:${PORT}`);
    });
  }
}

startServer();

module.exports = app;
