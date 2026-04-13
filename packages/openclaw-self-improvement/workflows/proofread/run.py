#!/usr/bin/env python3
"""proofread: Check text for common issues."""
import sys, re
from pathlib import Path
fp=Path(sys.argv[1] if len(sys.argv)>1 else Path.home()/"note.md")
if not fp.exists(): print(f"Not found: {fp}"); sys.exit(1)
with open(fp) as f: lines=f.readlines()
issues=[]
for i,l in enumerate(lines,1):
    if re.search(r"their",l) and re.search(r"it",l): issues.append(f"Line {i}: possible its/their confusion")
    if re.search(r"definately|occured|recieve",l,re.I): issues.append(f"Line {i}: spelling: {l.strip()[:50]}")
    if len(l)>150: issues.append(f"Line {i}: long line ({len(l)} chars)")
print(f"Proofread -- {fp.name}
Found: {len(issues)} issue(s)")
for iss in issues: print(f"  . {iss}")
