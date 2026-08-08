const siteConfig = require('./site_config.json');

function getSocialMetaTags(options) {
  const title = options.title || siteConfig.SITE_NAME;
  const description = options.description || "Free restaurant calorie and macros calculator.";
  const canonicalUrl = options.canonicalUrl || siteConfig.SITE_URL;
  const type = options.type || "website";
  
  // Resolve absolute image path
  let imageUrl = options.imageUrl || siteConfig.DEFAULT_OG_IMAGE || `${siteConfig.SITE_URL}/logo.png`;
  if (imageUrl.startsWith('/')) {
    imageUrl = `${siteConfig.SITE_URL}${imageUrl}`;
  } else if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
    imageUrl = `${siteConfig.SITE_URL}/${imageUrl}`;
  }
  
  const imageAlt = options.imageAlt || `${title} Preview`;
  
  return `
  <!-- Open Graph / Facebook -->
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description.replace(/"/g, '&quot;')}">
  <meta property="og:type" content="${type}">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${imageAlt}">
  <meta property="og:site_name" content="${siteConfig.SITE_NAME}">
  <meta property="og:locale" content="en_US">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description.replace(/"/g, '&quot;')}">
  <meta name="twitter:image" content="${imageUrl}">
  <meta name="twitter:image:alt" content="${imageAlt}">
  <meta name="twitter:site" content="@nutriroute">
  <meta name="twitter:creator" content="@nutriroute">
`;
}

module.exports = { getSocialMetaTags };
