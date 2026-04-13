#!/usr/bin/env python3
"""changelog: Parse CHANGELOG.md and show recent entries."""
import sys, re
from pathlib import Path
fp=Path(sys.argv[1] if len(sys.argv)>1 else "CHANGELOG.md")
if not fp.exists(): print(f"Not found: {fp}"); sys.exit(1)
with open(fp) as f: txt=f.read()
entries=re.split(r"^#{1,3}\s+",txt,flags=re.MULTILINE)
print(f"Changelog -- {fp.name}
")
for e in entries[1:8]:
    lines=[l for l in e.strip().split("
") if l.strip()]
    if lines: print(f"### {lines[0]}
" + "
".join(f"- {l}" for l in lines[1:5]) + "
")
