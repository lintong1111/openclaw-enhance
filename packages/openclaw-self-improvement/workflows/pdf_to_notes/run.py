#!/usr/bin/env python3
"""pdf-to-notes: Extract PDF text to .txt file."""
import sys
from pathlib import Path
fp=Path(sys.argv[1] if len(sys.argv)>1 else Path.home()/"doc.pdf")
out=fp.with_suffix(".txt")
try:
    import pypdf
    r=pypdf.PdfReader(str(fp))
    text="
".join(p.extract_text() or "" for p in r.pages)
except:
    try:
        from PyPDF2 import PdfReader
        r=PdfReader(str(fp))
        text="
".join(p.extract_text() or "" for p in r.pages)
    except:
        print("pip install pypdf"); sys.exit(1)
with open(out,"w") as f: f.write(text)
print(f"Extracted {len(text)} chars -> {out}")
