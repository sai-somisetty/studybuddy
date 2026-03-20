from supabase import create_client
from dotenv import load_dotenv
from datetime import date
import json
import os

load_dotenv()

TABLES = [
    "students",
    "questions",
    "previous_papers",
    "concept_progress",
    "streaks",
    "exam_attempts",
    "bug_reports",
]

BACKUP_DIR = os.path.join(os.path.dirname(__file__), "backups")


def run_backup() -> list[str]:
    """Export all Supabase tables to JSON files. Returns list of created filenames."""
    sb = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))
    os.makedirs(BACKUP_DIR, exist_ok=True)
    today = date.today().isoformat()
    created = []

    for table in TABLES:
        print(f"⏳ Backing up {table}...")
        try:
            rows = sb.table(table).select("*").execute().data or []
            filename = f"backup_{table}_{today}.json"
            filepath = os.path.join(BACKUP_DIR, filename)
            with open(filepath, "w") as f:
                json.dump(rows, f, indent=2, default=str)
            print(f"  ✅ {table}: {len(rows)} rows → {filename}")
            created.append(filename)
        except Exception as e:
            print(f"  ❌ {table}: {e}")

    print(f"\n🎉 Backup complete — {len(created)}/{len(TABLES)} tables saved to backups/")
    return created


if __name__ == "__main__":
    run_backup()
