import shutil
from pathlib import Path
p = Path('brands')
restored = []
for bak in sorted(p.glob('*.html.bak')):
    target_name = bak.name[:-4]  # remove .bak
    dest = p / target_name
    shutil.copy(bak, dest)
    restored.append(target_name)
print('Restored:', ', '.join(restored) if restored else 'None')
