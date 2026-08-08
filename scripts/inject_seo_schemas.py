import re
import json
from pathlib import Path

def clean_html(raw_html):
    # Remove HTML tags for clean text in JSON schema
    clean = re.sub(r'<[^>]+>', '', raw_html)
    # Remove extra visual indicators like '+'
    clean = clean.replace('+', '').replace('<b>', '').replace('</b>', '').strip()
    return clean

def main():
    root_dir = Path(__file__).resolve().parents[1]
    config_file = root_dir / 'site_config.json'
    
    if not config_file.exists():
        print("Error: site_config.json not found!")
        return
        
    config = json.loads(config_file.read_text(encoding='utf-8'))
    site_url = config.get('SITE_URL', 'https://nutriroute.com').rstrip('/')
    site_name = config.get('SITE_NAME', 'NutriRoute')
    
    brands_dir = root_dir / 'brands'
    for html_file in sorted(brands_dir.glob('*.html')):
        if html_file.name == 'brand_template.html':
            continue
        txt = html_file.read_text(encoding='utf-8')
        brand_id = html_file.stem
        
        # 1. Extract metadata from HTML
        title_match = re.search(r'<title>(.*?)</title>', txt, re.I)
        title = title_match.group(1).strip() if title_match else f"{brand_id.capitalize()} Calorie Calculator"
        
        desc_match = re.search(r'<meta\s+name="description"\s+content="([^"]*)"', txt, re.I)
        if not desc_match:
            desc_match = re.search(r'<meta\s+content="([^"]*)"\s+name="description"', txt, re.I)
        description = desc_match.group(1).strip() if desc_match else f"Calculate calories, protein, carbs and fat for {brand_id.capitalize()}."
        
        brand_name = brand_id.capitalize()
        # Find brand display name from badge-text if possible
        badge_match = re.search(r'<span[^>]*class="badge-text"[^>]*>([^<]+)</span>', txt, re.I)
        if badge_match:
            brand_name = badge_match.group(1).strip()
            
        # 2. Extract FAQs from the file
        faqs = []
        details_blocks = re.findall(r'<details[^>]*>.*?</details>', txt, re.S)
        for block in details_blocks:
            summary_match = re.search(r'<summary[^>]*>(.*?)</summary>', block, re.S)
            p_match = re.search(r'<p[^>]*>(.*?)</p>', block, re.S)
            if summary_match and p_match:
                q = clean_html(summary_match.group(1))
                a = clean_html(p_match.group(1))
                faqs.append({
                    "@type": "Question",
                    "name": q,
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": a
                    }
                })
                
        # 3. Construct JSON-LD `@graph` schema
        canonical_page_url = f"{site_url}/brands/{brand_id}"

        org_identity = {
            "@type": "Organization",
            "@id": f"{site_url}/#organization",
            "name": config.get('ORGANIZATION_NAME', site_name),
            "url": site_url,
            "logo": {
                "@type": "ImageObject",
                "@id": f"{site_url}/#logo",
                "url": config.get('LOGO_URL', f"{site_url}/logo.png"),
                "width": 512,
                "height": 512,
                "caption": f"{config.get('ORGANIZATION_NAME', site_name)} Logo"
            },
            "sameAs": config.get('SOCIAL_PROFILES', [])
        }

        website_identity = {
            "@type": "WebSite",
            "@id": f"{site_url}/#website",
            "name": config.get('SITE_NAME', site_name),
            "url": site_url,
            "publisher": { "@id": f"{site_url}/#organization" },
            "potentialAction": {
                "@type": "SearchAction",
                "target": {
                    "@type": "EntryPoint",
                    "urlTemplate": f"{site_url}/?q={{search_term_string}}"
                },
                "query-input": "required name=search_term_string"
            }
        }

        webpage = {
            "@type": "WebPage",
            "@id": f"{canonical_page_url}/#webpage",
            "url": canonical_page_url,
            "name": f"{brand_name} Calorie Calculator | {config.get('SITE_NAME', site_name)}",
            "isPartOf": { "@id": f"{site_url}/#website" }
        }

        web_app = {
            "@type": "WebApplication",
            "@id": f"{canonical_page_url}/#webapp",
            "url": canonical_page_url,
            "name": f"{brand_name} Calorie Calculator",
            "applicationCategory": "HealthApplication",
            "operatingSystem": "All",
            "browserRequirements": "Requires JavaScript. Requires HTML5.",
            "isPartOf": { "@id": f"{canonical_page_url}/#webpage" }
        }

        breadcrumbs = {
            "@type": "BreadcrumbList",
            "@id": f"{canonical_page_url}/#breadcrumb",
            "itemListElement": [
                {
                    "@type": "ListItem",
                    "position": 1,
                    "name": "Home",
                    "item": site_url
                },
                {
                    "@type": "ListItem",
                    "position": 2,
                    "name": "Calculators",
                    "item": f"{site_url}/index"
                },
                {
                    "@type": "ListItem",
                    "position": 3,
                    "name": f"{brand_name} Calorie Calculator",
                    "item": canonical_page_url
                }
            ]
        }

        graph_elements = [org_identity, website_identity, webpage, web_app, breadcrumbs]

        if faqs:
            faq_page = {
                "@type": "FAQPage",
                "@id": f"{canonical_page_url}/#faq",
                "mainEntity": faqs,
                "isPartOf": { "@id": f"{canonical_page_url}/#webpage" }
            }
            graph_elements.append(faq_page)

        graph_schema = {
            "@context": "https://schema.org",
            "@graph": graph_elements
        }
            
        # 4. Generate the script tag markup
        schema_markup = f'\n  <script type="application/ld+json">\n  {json.dumps(graph_schema, indent=2)}\n  </script>\n'
            
        # 5. Inject into the <head> of the HTML file
        if '</head>' in txt:
            # Clean existing schemas to prevent duplicate injection
            txt_cleaned = re.sub(r'\s*<script type="application/ld\+json">.*?</script>', '', txt, flags=re.S)
            
            # Rewrite any malformed/old canonical tags
            canonical_tag_pattern = r'<link\s+rel="canonical"\s+href="[^"]*"\s*/?>'
            new_canonical_tag = f'<link rel="canonical" href="{canonical_page_url}">'
            if re.search(canonical_tag_pattern, txt_cleaned):
                txt_cleaned = re.sub(canonical_tag_pattern, new_canonical_tag, txt_cleaned)
            else:
                txt_cleaned = txt_cleaned.replace('</head>', f'  {new_canonical_tag}\n</head>')
                
            head_idx = txt_cleaned.find('</head>')
            final_txt = txt_cleaned[:head_idx] + schema_markup + txt_cleaned[head_idx:]
            html_file.write_text(final_txt, encoding='utf-8')
            print(f"Successfully injected schemas and fixed canonical link in {html_file.name}")
        else:
            print(f"Error: {html_file.name} is missing </head> tag")

if __name__ == '__main__':
    main()
