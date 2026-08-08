const siteConfig = require('./site_config.json');

const orgIdentity = {
  "@type": "Organization",
  "@id": `${siteConfig.SITE_URL}/#organization`,
  "name": siteConfig.ORGANIZATION_NAME,
  "url": siteConfig.SITE_URL,
  "logo": {
    "@type": "ImageObject",
    "@id": `${siteConfig.SITE_URL}/#logo`,
    "url": siteConfig.LOGO_URL,
    "width": 512,
    "height": 512,
    "caption": `${siteConfig.ORGANIZATION_NAME} Logo`
  },
  "sameAs": siteConfig.SOCIAL_PROFILES
};

const websiteIdentity = {
  "@type": "WebSite",
  "@id": `${siteConfig.SITE_URL}/#website`,
  "name": siteConfig.SITE_NAME,
  "url": siteConfig.SITE_URL,
  "publisher": { "@id": `${siteConfig.SITE_URL}/#organization` },
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": `${siteConfig.SITE_URL}/?q={search_term_string}`
    },
    "query-input": "required name=search_term_string"
  }
};

function getHomepageSchemaGraph(faqList = []) {
  const graph = [
    orgIdentity,
    websiteIdentity,
    {
      "@type": "WebPage",
      "@id": `${siteConfig.SITE_URL}/#webpage`,
      "url": siteConfig.SITE_URL,
      "name": siteConfig.SITE_NAME,
      "isPartOf": { "@id": `${siteConfig.SITE_URL}/#website` }
    }
  ];
  
  if (faqList.length > 0) {
    graph.push({
      "@type": "FAQPage",
      "@id": `${siteConfig.SITE_URL}/#faq`,
      "mainEntity": faqList,
      "isPartOf": { "@id": `${siteConfig.SITE_URL}/#webpage` }
    });
  }
  
  return {
    "@context": "https://schema.org",
    "@graph": graph
  };
}

function getBrandPageSchemaGraph(brand, canonicalUrl, faqList = []) {
  const graph = [
    orgIdentity,
    websiteIdentity,
    {
      "@type": "WebPage",
      "@id": `${canonicalUrl}/#webpage`,
      "url": canonicalUrl,
      "name": `${brand.name} Calorie Calculator | ${siteConfig.SITE_NAME}`,
      "isPartOf": { "@id": `${siteConfig.SITE_URL}/#website` }
    },
    {
      "@type": "WebApplication",
      "@id": `${canonicalUrl}/#webapp`,
      "url": canonicalUrl,
      "name": `${brand.name} Calorie Calculator`,
      "applicationCategory": "HealthApplication",
      "operatingSystem": "All",
      "browserRequirements": "Requires JavaScript. Requires HTML5.",
      "isPartOf": { "@id": `${canonicalUrl}/#webpage` }
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${canonicalUrl}/#breadcrumb`,
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": siteConfig.SITE_URL
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Calculators",
          "item": `${siteConfig.SITE_URL}/index`
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": `${brand.name} Calorie Calculator`,
          "item": canonicalUrl
        }
      ]
    }
  ];
  
  if (faqList && faqList.length > 0) {
    graph.push({
      "@type": "FAQPage",
      "@id": `${canonicalUrl}/#faq`,
      "mainEntity": faqList,
      "isPartOf": { "@id": `${canonicalUrl}/#webpage` }
    });
  }
  
  return {
    "@context": "https://schema.org",
    "@graph": graph
  };
}

function getBlogPostSchemaGraph(post, canonicalUrl) {
  const today = new Date().toISOString().split('T')[0];
  const datePublished = post.created_at || today;
  const dateModified = post.updated_at || datePublished;
  
  return {
    "@context": "https://schema.org",
    "@graph": [
      orgIdentity,
      websiteIdentity,
      {
        "@type": "WebPage",
        "@id": `${canonicalUrl}/#webpage`,
        "url": canonicalUrl,
        "name": post.title,
        "isPartOf": { "@id": `${siteConfig.SITE_URL}/#website` }
      },
      {
        "@type": "Article",
        "@id": `${canonicalUrl}/#article`,
        "isPartOf": { "@id": `${canonicalUrl}/#webpage` },
        "headline": post.title,
        "description": post.summary,
        "image": post.image_url || "",
        "datePublished": datePublished,
        "dateModified": dateModified,
        "author": {
          "@type": "Person",
          "name": post.author || siteConfig.DEFAULT_AUTHOR
        },
        "publisher": { "@id": `${siteConfig.SITE_URL}/#organization` }
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${canonicalUrl}/#breadcrumb`,
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": siteConfig.SITE_URL
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Blog",
            "item": `${siteConfig.SITE_URL}/blog`
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": post.title,
            "item": canonicalUrl
          }
        ]
      }
    ]
  };
}

module.exports = {
  getHomepageSchemaGraph,
  getBrandPageSchemaGraph,
  getBlogPostSchemaGraph
};
