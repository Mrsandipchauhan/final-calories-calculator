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
    brands_dir = Path('brands')
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
                
        # 3. Construct JSON-LD schemas
        schemas = []
        
        # Schema 1: WebApplication (Calculator tool)
        web_app = {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": f"{brand_name} Calorie Calculator",
            "url": f"https://starbucks-calorie-calculator.com/brands/{brand_id}.html",
            "description": description,
            "applicationCategory": "HealthApplication",
            "operatingSystem": "All",
            "browserRequirements": "Requires JavaScript. Requires HTML5."
        }
        schemas.append(web_app)
        
        # Schema 2: BreadcrumbList
        breadcrumbs = {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                {
                    "@type": "ListItem",
                    "position": 1,
                    "name": "Home",
                    "item": "https://starbucks-calorie-calculator.com/index.html"
                },
                {
                    "@type": "ListItem",
                    "position": 2,
                    "name": "Calculators",
                    "item": "https://starbucks-calorie-calculator.com/index.html#brands"
                },
                {
                    "@type": "ListItem",
                    "position": 3,
                    "name": f"{brand_name} Calorie Calculator",
                    "item": f"https://starbucks-calorie-calculator.com/brands/{brand_id}.html"
                }
            ]
        }
        schemas.append(breadcrumbs)
        
        # Schema 3: FAQPage
        if faqs:
            faq_page = {
                "@context": "https://schema.org",
                "@type": "FAQPage",
                "mainEntity": faqs
            }
            schemas.append(faq_page)
            
        # 4. Generate the script tag markup
        schema_markup = "\n"
        for s in schemas:
            schema_markup += f'  <script type="application/ld+json">\n  {json.dumps(s, indent=2)}\n  </script>\n'
            
        # 5. Inject into the <head> of the HTML file
        if '</head>' in txt:
            # Clean existing schemas to prevent duplicate injection
            txt_cleaned = re.sub(r'\s*<script type="application/ld\+json">.*?</script>', '', txt, flags=re.S)
            
            head_idx = txt_cleaned.find('</head>')
            final_txt = txt_cleaned[:head_idx] + schema_markup + txt_cleaned[head_idx:]
            html_file.write_text(final_txt, encoding='utf-8')
            print(f"Successfully injected schemas into {html_file.name}")
        else:
            print(f"Error: {html_file.name} is missing </head> tag")

if __name__ == '__main__':
    main()
