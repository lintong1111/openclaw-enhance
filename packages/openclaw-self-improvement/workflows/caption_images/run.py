#!/usr/bin/env python3
"""caption-images: Generate descriptive names for images."""
import sys, re
from pathlib import Path
folder=Path(sys.argv[1] if len(sys.argv)>1 else Path.home()/"Downloads")
images=[p for p in folder.iterdir() if p.suffix.lower() in {".jpg",".jpeg",".png",".webp",".gif"}]
print(f"Image Captions -- {folder}
{len(images)} images:
")
for img in images[:20]:
    name=re.sub(r"[-_]"," ",img.stem)
    print(f"  {img.name} -> {name[:60]}")
