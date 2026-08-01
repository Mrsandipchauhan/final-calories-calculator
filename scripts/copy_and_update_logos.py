import shutil
import sqlite3
from pathlib import Path

# Paths
ROOT = Path(__file__).resolve().parents[1]
DB_PATH = ROOT / 'nutriroute.db'
IMAGES_DIR = ROOT / 'brands' / 'images'
ARTIFACTS_DIR = Path(r"C:\Users\Hp\.gemini\antigravity-ide\brain\6161bd78-92d5-49e6-bcd7-04c4220b6798")

# Map brand IDs to the generated image file names (using wildcards or matching by prefix)
generated_logos = {
    'wendys': 'wendys_logo',
    'dominos': 'dominos_logo',
    'pizzahut': 'pizzahut_logo',
    'popeyes': 'popeyes_logo',
    'sonic': 'sonic_logo',
    'fiveguys': 'fiveguys_logo',
    'wingstop': 'wingstop_logo',
    'jerseymikes': 'jerseymikes_logo',
    'raisingcanes': 'raisingcanes_logo',
    'cava': 'cava_logo'
}

def main():
    conn = sqlite3.connect(str(DB_PATH))
    cur = conn.cursor()

    for brand_id, prefix in generated_logos.items():
        # Find the generated file in artifacts directory
        matching_files = list(ARTIFACTS_DIR.glob(f"{prefix}_*.png"))
        if not matching_files:
            print(f"No generated file found for {brand_id} with prefix {prefix}")
            continue
            
        # Get the latest one if there are multiple
        src_file = max(matching_files, key=lambda p: p.stat().st_mtime)
        dest_file = IMAGES_DIR / f"{brand_id}.png"
        
        # Copy file
        shutil.copy(src_file, dest_file)
        print(f"Copied {src_file.name} to {dest_file.relative_to(ROOT)}")
        
        # Update database
        logo_path = f"brands/images/{brand_id}.png"
        cur.execute("UPDATE brands SET logo_path = ? WHERE id = ?", (logo_path, brand_id))
        print(f"Updated DB logo_path for '{brand_id}' to: {logo_path}")

    conn.commit()
    conn.close()
    print("Database and images updated successfully!")

if __name__ == '__main__':
    main()
