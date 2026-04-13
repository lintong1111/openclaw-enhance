#!/usr/bin/env python3
"""find-todos: Find TODO/FIXME/HACK comments in source."""
import sys, re
from pathlib import Path
folder=Path(sys.argv[1] if len(sys.argv)>1 else Path.cwd())
pattern=re.compile(r"(TODO|FIXME|HACK|XXX|NOTE):(.+)")
results=[]
for fp in folder.rglob("*.py"):
    try:
        for i,l in enumerate(fp.read_text().splitlines(),1):
            m=pattern.search(l)
            if m: results.append((fp.name,i,m.group(1),m.group(2).strip()[:80]))
    except: pass
print(f"Find TODOs -- {folder}
Found: {len(results)}
")
for fn,i,tag,msg in results: print(f"  [{tag}] {fn}:{i} -- {msg}")
