const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { db, initDb } = require('./db');

const app = express();
const PORT = process.env.PORT || 8089;

// ── Multer config for image uploads ──
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, 'uploads')),
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

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
  res.sendFile(path.join(__dirname, 'blog.html'));
});

// Individual blog post — serve blog.html with injected meta
app.get('/blog/:slug', async (req, res) => {
  try {
    const post = await db.getAsync('SELECT * FROM blogs WHERE slug = ?', [req.params.slug]);
    if (!post) return res.status(404).sendFile(path.join(__dirname, 'blog.html'));

    let html = fs.readFileSync(path.join(__dirname, 'blog.html'), 'utf8');
    const settings = await getSettings();
    const siteUrl = (settings.site_url || 'https://nutriroute.com').replace(/\/$/, '');

    // Replace meta tags for SEO
    const metaTitle = post.meta_title || `${post.title} — NutriRoute Blog`;
    const metaDesc = post.meta_description || post.summary;
    const canonical = post.canonical_url || `${siteUrl}/blog/${post.slug}`;

    html = html.replace(/<title>.*?<\/title>/, `<title>${metaTitle}</title>`);
    html = html.replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${metaDesc.replace(/"/g, '&quot;')}">`);

    // Inject OG tags + canonical + schema
    const ogTags = `
  <link rel="canonical" href="${canonical}">
  <meta property="og:title" content="${metaTitle}">
  <meta property="og:description" content="${metaDesc.replace(/"/g, '&quot;')}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${canonical}">
  ${post.image_url ? `<meta property="og:image" content="${post.image_url}">` : ''}
`;
    const articleSchema = schemaScript({
      "@context": "https://schema.org",
      "@type": post.schema_type || "Article",
      "headline": post.title,
      "description": post.summary,
      "author": { "@type": "Person", "name": post.author || "NutriRoute Team" },
      "datePublished": post.created_at,
      "dateModified": post.updated_at || post.created_at,
      "image": post.image_url || "",
      "publisher": { "@type": "Organization", "name": "NutriRoute" }
    });

    const breadcrumbSchema = schemaScript({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": siteUrl },
        { "@type": "ListItem", "position": 2, "name": "Blog", "item": `${siteUrl}/blog` },
        { "@type": "ListItem", "position": 3, "name": post.title, "item": canonical }
      ]
    });

    // Inject a data attribute so client JS can auto-load the post
    html = html.replace('<body>', `<body data-blog-slug="${post.slug}">`);

    html = html.replace('</head>', ogTags + articleSchema + '\n' + breadcrumbSchema + '\n</head>');

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

// Serve static files EXCEPT brands/*.html (we want to intercept those)
app.use((req, res, next) => {
  // Let brands/*.html be handled by our custom route
  if (req.path.match(/^\/brands\/[^/]+\.html$/)) return next();
  express.static(path.join(__dirname))(req, res, next);
});

// Dynamic brand page serving with SEO injection
app.get('/brands/:brandId.html', async (req, res) => {
  try {
    const brandId = req.params.brandId;
    const brand = await db.getAsync('SELECT * FROM brands WHERE id = ?', [brandId]);
    const settings = await getSettings();
    const siteUrl = (settings.site_url || 'https://nutriroute.com').replace(/\/$/, '');

    // Determine which HTML file to serve
    let htmlFile;
    const specificFile = path.join(__dirname, 'brands', `${brandId}.html`);
    const templateFile = path.join(__dirname, 'brands', 'brand_template.html');

    if (fs.existsSync(specificFile) && brandId !== 'brand_template') {
      htmlFile = specificFile;
    } else {
      htmlFile = templateFile;
    }

    let html = fs.readFileSync(htmlFile, 'utf8');

    if (brand) {
      const metaTitle = brand.meta_title || `${brand.name} Calorie Calculator — Nutrition Facts & Macros | NutriRoute`;
      const metaDesc = brand.meta_description || `Use the free ${brand.name} calorie calculator to check calories, protein, carbs and fat for every menu item. Customize your order and make smarter choices.`;
      const canonical = `${siteUrl}/brands/${brandId}.html`;

      // Replace/inject title and description
      html = html.replace(/<title>.*?<\/title>/, `<title>${metaTitle}</title>`);
      if (html.includes('name="description"')) {
        html = html.replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${metaDesc.replace(/"/g, '&quot;')}">`);
      } else {
        html = html.replace('</head>', `<meta name="description" content="${metaDesc.replace(/"/g, '&quot;')}">\n</head>`);
      }

      // Inject canonical + OG + schema
      const seoHead = `
  <link rel="canonical" href="${canonical}">
  <meta property="og:title" content="${metaTitle}">
  <meta property="og:description" content="${metaDesc.replace(/"/g, '&quot;')}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${canonical}">
`;
      const breadcrumbSchema = schemaScript({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": siteUrl },
          { "@type": "ListItem", "position": 2, "name": "Calculators", "item": `${siteUrl}/#brands` },
          { "@type": "ListItem", "position": 3, "name": `${brand.name} Calculator`, "item": canonical }
        ]
      });

      const webPageSchema = schemaScript({
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": metaTitle,
        "description": metaDesc,
        "url": canonical,
        "isPartOf": { "@type": "WebSite", "name": "NutriRoute", "url": siteUrl }
      });

      html = html.replace('</head>', seoHead + breadcrumbSchema + '\n' + webPageSchema + '\n</head>');

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

app.get('/', async (req, res) => {
  try {
    let html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
    const settings = await getSettings();
    const siteUrl = (settings.site_url || 'https://nutriroute.com').replace(/\/$/, '');

    // Inject homepage schema
    const websiteSchema = schemaScript({
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "NutriRoute",
      "url": siteUrl,
      "description": settings.site_description || "",
      "potentialAction": {
        "@type": "SearchAction",
        "target": `${siteUrl}/#brands?q={search_term_string}`,
        "query-input": "required name=search_term_string"
      }
    });

    const orgSchema = schemaScript({
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "NutriRoute",
      "url": siteUrl,
      "description": "Free multi-brand restaurant calorie calculator"
    });

    const faqSchema = schemaScript({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        { "@type": "Question", "name": "How accurate are the calorie estimates?", "acceptedAnswer": { "@type": "Answer", "text": "Our calculator uses published brand nutrition information and applies the selections you make. Recipes and portions can vary by location, so treat every result as a helpful estimate." }},
        { "@type": "Question", "name": "Is NutriRoute affiliated with these restaurants?", "acceptedAnswer": { "@type": "Answer", "text": "No. NutriRoute is an independent educational tool. Brand names are used only to help you identify the menu you want to explore." }},
        { "@type": "Question", "name": "Can I calculate customisations?", "acceptedAnswer": { "@type": "Answer", "text": "Yes — our brand calculators include common choices such as size, milk, bread and add-ons, with results updated as you build." }},
        { "@type": "Question", "name": "Why don't I see every menu item?", "acceptedAnswer": { "@type": "Answer", "text": "We are growing the database in carefully reviewed batches. Check back often: new options are added to existing brands regularly." }}
      ]
    });

    const canonicalTag = `<link rel="canonical" href="${siteUrl}/">`;
    html = html.replace('</head>', canonicalTag + '\n' + websiteSchema + '\n' + orgSchema + '\n' + faqSchema + '\n</head>');
    html = await injectIntoHtml(html);
    res.send(html);
  } catch (err) {
    // Fallback to static file
    res.sendFile(path.join(__dirname, 'index.html'));
  }
});

// Admin dashboard route
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// ── Start Server ──
async function startServer() {
  await initDb();
  app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
  });
}

startServer();
