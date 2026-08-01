import re
from pathlib import Path

BRANDS_DIR = Path('brands')
files = sorted(BRANDS_DIR.glob('*.html'))
for f in files:
    txt = f.read_text(encoding='utf-8')
    orig = txt
    # Find the brand-badge-vertical block
    m = re.search(r'<div\s+class="([^"]*brand-badge-vertical[^"]*)"(.*?)>(.*?)</div>\s*</div>', txt, re.S)
    # The above might not capture perfectly; instead find the first occurrence of brand-badge-vertical and replace the whole div until the closing </div> that ends that block
    if 'brand-badge-vertical' in txt:
        # find start index
        start = txt.find('brand-badge-vertical')
        # backtrack to the opening '<div'
        open_div_idx = txt.rfind('<div', 0, start)
        if open_div_idx == -1:
            continue
        # Now find the matching closing div for this block by simple heuristic: find the next '</div></div>' sequence after start
        # We'll search for the pattern of closing two divs which matches the structure in these files
        closing_idx = txt.find('</div></div>', start)
        if closing_idx == -1:
            # fallback: find next '</div>'
            closing_idx = txt.find('</div>', start)
            if closing_idx == -1:
                continue
            closing_idx += len('</div>')
        else:
            closing_idx += len('</div></div>')
        block = txt[open_div_idx:closing_idx]
        # Extract class attribute
        class_match = re.search(r'class=\"([^\"]*)\"', block)
        classes = ''
        if class_match:
            classes = class_match.group(1)
        # try to extract img alt
        alt_match = re.search(r'<img[^>]+alt=\"([^\"]+)\"', block)
        if alt_match:
            alt = alt_match.group(1)
            # remove trailing ' logo' if present
            display = re.sub(r'\s+[Ll]ogo$', '', alt).strip()
        else:
            # try to extract span text
            span_match = re.search(r'<span[^>]*class=\"badge-text\"[^>]*>([^<]+)</span>', block)
            display = span_match.group(1).strip() if span_match else f.stem.capitalize()
        # Build new snippet
        brand_id = f.stem
        # check if SVG file exists in brands/images
        img_ext = 'png'
        if (Path('brands') / 'images' / f'{brand_id}.svg').exists():
            img_ext = 'svg'
        
        # keep other badge-* classes like 'chickfila-badge' if present
        extra_class = ''
        for c in classes.split():
            if c != 'brand-badge-vertical':
                extra_class += ' ' + c
        new = f'<div class="brand-badge-vertical{extra_class}" data-brand="{brand_id}">\n  <div class="badge-logo-circle">\n    <img src="images/{brand_id}.{img_ext}" alt="{display} logo">\n  </div>\n  <span class="badge-text">{display}</span>\n</div>'
        new_txt = txt[:open_div_idx] + new + txt[closing_idx:]
        # Backup original
        bak = f.with_suffix(f.suffix + '.bak')
        bak.write_text(orig, encoding='utf-8')
        f.write_text(new_txt, encoding='utf-8')
        print(f'Updated {f.name} (backup -> {bak.name})')
    else:
        print(f'Skipped {f.name} (no badge block found)')
