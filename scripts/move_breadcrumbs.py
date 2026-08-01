import re
from pathlib import Path

def main():
    brands_dir = Path('brands')
    for html_file in sorted(brands_dir.glob('*.html')):
        txt = html_file.read_text(encoding='utf-8')
        
        # 1. Locate breadcrumb block
        crumb_match = re.search(r'<nav[^>]*class="breadcrumbs"[^>]*>.*?</nav>', txt, re.S)
        if not crumb_match:
            print(f"Skipped {html_file.name} (no breadcrumbs found)")
            continue
            
        crumb_block = crumb_match.group(0)
        
        # 2. Remove breadcrumb block from original location
        start_idx = txt.find(crumb_block)
        txt_cleaned = txt[:start_idx] + txt[start_idx + len(crumb_block):]
        
        # 3. Locate footer
        footer_target = '<footer data-site-footer></footer>'
        if footer_target not in txt_cleaned:
            print(f"Error: {html_file.name} is missing footer target")
            continue
            
        # 4. Wrap and style breadcrumb block for bottom layout
        clean_crumb_block = crumb_block.replace('class="breadcrumbs"', 'class="breadcrumbs" style="margin-bottom: 0;"')
        wrapped_crumbs = f'\n    <div class="wrap" style="margin-top: 50px; margin-bottom: 45px;">\n      {clean_crumb_block}\n    </div>\n    '
        
        # 5. Insert right before footer
        footer_idx = txt_cleaned.find(footer_target)
        final_txt = txt_cleaned[:footer_idx] + wrapped_crumbs + txt_cleaned[footer_idx:]
        
        # 6. Save the file
        html_file.write_text(final_txt, encoding='utf-8')
        print(f"Moved breadcrumbs to bottom in {html_file.name}")

if __name__ == '__main__':
    main()
