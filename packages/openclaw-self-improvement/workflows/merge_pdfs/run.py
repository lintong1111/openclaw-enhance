#!/usr/bin/env python3
"""merge-pdfs: Merge multiple PDFs into one."""
import sys, shutil
from pathlib import Path

files = [Path(a) for a in sys.argv[1:] if Path(a).exists()] if len(sys.argv)>1 else []
out = Path.home()/"merged.pdf"

try:
    from pypdf import PdfWriter
    merger = PdfWriter()
    for fp in files:
        merger.append(str(fp))
    merger.write(str(out))
    print(f"**Merged {len(files)} PDFs -> {out}**")
    for fp in files: print(f"  + {fp.name}")
except ImportError:
    try:
        from PyPDF2 import PdfWriterMerger as PdfWriter
    except:
        print("Install pypdf: pip install pypdf"); sys.exit(1)
