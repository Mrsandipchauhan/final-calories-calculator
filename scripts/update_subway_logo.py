import shutil
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DB_PATH = ROOT / 'nutriroute.db'
IMAGES_DIR = ROOT / 'brands' / 'images'
ARTIFACTS_DIR = Path(r"C:\Users\Hp\.gemini\antigravity-ide\brain\6161bd78-92d5-49e6-bcd7-04c4220b6798")

def main():
    # 1. Copy Subway logo
    matching_files = list(ARTIFACTS_DIR.glob("subway_logo_*.png"))
    if not matching_files:
        print("No generated Subway logo found.")
        return
        
    src_file = max(matching_files, key=lambda p: p.stat().st_mtime)
    dest_file = IMAGES_DIR / 'subway.png'
    
    shutil.copy(src_file, dest_file)
    print(f"Copied {src_file.name} to {dest_file.relative_to(ROOT)}")
    
    # 2. Update Database
    conn = sqlite3.connect(str(DB_PATH))
    cur = conn.cursor()
    cur.execute("UPDATE brands SET logo_path = 'brands/images/subway.png' WHERE id = 'subway'")
    conn.commit()
    conn.close()
    print("Updated database logo_path for Subway.")
    
    # 3. Regenerate Static API
    print("Regenerating static API files...")
    import generate_static_api
    generate_static_api.main()

if __name__ == '__main__':
    main()
