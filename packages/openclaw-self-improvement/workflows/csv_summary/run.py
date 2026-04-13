#!/usr/bin/env python3
"""csv-summary: Show CSV structure and basic stats."""
import sys, csv, json
from pathlib import Path

fp = Path(sys.argv[1] if len(sys.argv)>1 else Path.home())
if not fp.exists(): print(f"Not found: {fp}"); sys.exit(1)

rows = []
try:
    with open(fp, newline='', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        headers = reader.fieldnames or []
        for i, row in enumerate(reader):
            if i < 1000: rows.append(row)
except Exception as e:
    print(f"Error reading CSV: {e}"); sys.exit(1)

print(f"**CSV Summary — {fp.name}**")
print(f"Rows: {len(rows)+1} (incl. header) | Columns: {len(headers)}\n")
print(f"**Headers:**")
for h in headers: print(f"  • {h}")

# Numeric columns stats
for h in headers[:10]:
    vals = []
    for row in rows:
        try: vals.append(float(row.get(h,'')))
        except: pass
    if len(vals) > len(rows)*0.3:
        print(f"\n**{h}** (numeric, n={len(vals)}):")
        print(f"  min={min(vals):.2f} max={max(vals):.2f} avg={sum(vals)/len(vals):.2f}")

# Sample rows
print(f"\n**First 3 rows:**")
for row in rows[:3]:
    sample = {k: row[k][:40] for k in list(headers)[:8]}
    print(f"  {sample}")
