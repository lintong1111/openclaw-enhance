#!/usr/bin/env python3
"""bulk-rename: Preview/apply file renames by pattern."""
import sys, re
from pathlib import Path
folder=Path(sys.argv[1] if len(sys.argv)>1 else ".")
old_pat=sys.argv[2] if len(sys.argv)>2 else ""
new_pat=sys.argv[3] if len(sys.argv)>3 else ""
apply="--apply" in sys.argv
files=list(folder.iterdir())
renames=[(f,folder/(f.name.replace(old_pat,new_pat))) for f in files if old_pat and old_pat in f.name]
print(f"Bulk Rename -- {folder} ({len(renames)} files, {'LIVE' if apply else 'PREVIEW'})
")
for src,dst in renames[:20]: print(f"  {src.name} -> {dst.name}")
if apply:
    for src,dst in renames: src.rename(dst)
    print(f"
Applied {len(renames)} renames.")
else: print("
-> Add --apply to apply.")
