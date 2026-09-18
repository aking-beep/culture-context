from pathlib import Path
import sys
ROOT = Path(__file__).resolve().parent
for rel in ('services/api','services/ingestion','services/worker'):
    path = str(ROOT / rel)
    if path not in sys.path:
        sys.path.insert(0, path)
