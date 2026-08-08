const siteConfig = require('./site_config.json');

function getCanonicalUrl(rawPath) {
  if (!rawPath) return siteConfig.SITE_URL;
  
  // 1. Strip query parameters and hash fragments
  let cleanPath = rawPath.split('?')[0].split('#')[0];
  
  // 2. Normalize to lowercase
  cleanPath = cleanPath.toLowerCase();
  
  // 3. Remove double slashes
  cleanPath = cleanPath.replace(/\/+/g, '/');
  
  // 4. Strip .html extension for clean URLs
  if (cleanPath.endsWith('.html')) {
    cleanPath = cleanPath.slice(0, -5);
  }
  
  // 5. Strip trailing slash
  if (cleanPath.endsWith('/') && cleanPath !== '/') {
    cleanPath = cleanPath.slice(0, -1);
  }
  
  // Ensure path starts with a slash
  if (!cleanPath.startsWith('/')) {
    cleanPath = '/' + cleanPath;
  }
  
  // Normalize root slash
  if (cleanPath === '/') {
    cleanPath = '';
  }
  
  return `${siteConfig.SITE_URL}${cleanPath}`;
}

module.exports = { getCanonicalUrl };
