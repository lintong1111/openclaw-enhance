#!/usr/bin/env python3
"""backup-check: Report .bak files found."""
import sys
from pathlib import Path
folder=Path(sys.argv[1] if len(sys.argv)>1 else Path.home())
backups=[p for p in folder.rglob("*.bak") if p.is_file()]
print(f"Backup Check -- {folder}
Found: {len(backups)} backup files
")
for b in sorted(backups)[:20]: print(f"  {b} ({b.stat().st_size//1024}KB)")
