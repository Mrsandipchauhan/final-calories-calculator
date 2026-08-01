from pathlib import Path

def main():
    rows = []
    with open('scripts/logos_to_fetch.csv', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#') or line.lower().startswith('id,'):
                continue
            parts = line.split(',')
            bid = parts[0].strip()
            rows.append(bid)

    imgs_dir = Path('brands/images')
    print('Checking logos in brands/images/')
    for b in rows:
        svg = imgs_dir / f'{b}.svg'
        png = imgs_dir / f'{b}.png'
        exists = svg.exists() or png.exists()
        which = 'svg' if svg.exists() else ('png' if png.exists() else 'none')
        print(f' - {b}:', 'FOUND' if exists else 'MISSING', f'({which})')

if __name__ == '__main__':
    main()
