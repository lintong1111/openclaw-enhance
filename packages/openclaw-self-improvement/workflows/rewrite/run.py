#!/usr/bin/env python3
"""rewrite: Basic text cleanup -- fix double spaces, trim."""
import sys
from pathlib import Path
fp=Path(sys.argv[1] if len(sys.argv)>1 else Path.home()/"note.md")
if not fp.exists(): print(f"Not found: {fp}"); sys.exit(1)
with open(fp) as f: txt=f.read()
fixed=re.sub(r"  +"," ",txt.replace("	"," ")).strip()
out=fp.parent/(fp.stem+"_rewritten"+fp.suffix)
with open(out,"w") as f: f.write(fixed)
print(f"Rewritten -> {out}")
