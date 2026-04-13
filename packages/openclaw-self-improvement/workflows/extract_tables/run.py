#!/usr/bin/env python3
"""extract-tables: Extract tab/comma-separated tables from text."""
import sys, csv
from pathlib import Path
fp=Path(sys.argv[1] if len(sys.argv)>1 else Path.home()/"data.txt")
if not fp.exists(): print(f"Not found: {fp}"); sys.exit(1)
with open(fp) as f: txt=f.read()
lines=[l for l in txt.splitlines() if l.strip() and ("," in l or "	" in l)]
delim="	" if "	" in lines[0] else ","
reader=csv.DictReader(lines,delimiter=delim)
rows=list(reader)
print(f"Tables in {fp.name}
Rows: {len(rows)} | Cols: {len(rows[0]) if rows else 0}
")
if rows: print("Headers:", list(rows[0].keys()))
for r in rows[:5]: print(dict(r))
