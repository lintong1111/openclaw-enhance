#!/usr/bin/env python3
"""summarize-pdf: Extract and summarize text from a PDF file."""
import sys, re
from pathlib import Path

STOP = {"a","an","and","are","as","at","be","by","for","from","has","in","is","it","its","of","on","or","that","the","to","was","were","will","with","this","these","those","their","there","about","after","before","into","over","under","than","then","them","they","you","your","our","we","can","may","should","from","which","where","when","what","who","how","been","being","have","had","has","having","does","did","doing","would","should","could","may","might","must","shall"}

def norm(t): return re.sub(r'\s+',' ',str(t or '')).strip()
def keywords(t, n=8):
    c={}
    for tok in re.findall(r'[A-Za-z][A-Za-z0-9_-]{2,}',norm(t).lower()):
        if tok not in STOP: c[tok]=c.get(tok,0)+1
    return sorted(c.items(),key=lambda x:-x[1])[:n]

fp = Path(sys.argv[1] if len(sys.argv)>1 else Path.home() / "Downloads")
if not fp.exists():
    print(f"File not found: {fp}"); sys.exit(1)

try:
    import pypdf as PdfReader
except ImportError:
    try:
        from PyPDF2 import PdfReader
    except:
        print("Install pypdf: pip install pypdf"); sys.exit(1)

reader = PdfReader(str(fp), strict=False)
texts = []
for p in reader.pages[:12]:
    t = norm(p.extract_text() or '')
    if len(t.split()) > 8:
        texts.append(t)

full = '\n'.join(texts)
sents = re.split(r'(?<=[.!?])\s+', norm(full))
freq = {}
for tok in re.findall(r'[A-Za-z][A-Za-z0-9_-]{2,}', norm(full).lower()):
    if tok not in STOP: freq[tok] = freq.get(tok,0)+1

scored = []
for i, s in enumerate(sents):
    toks = [t for t in re.findall(r'[A-Za-z][A-Za-z0-9_-]{2,}', s.lower()) if t not in STOP]
    if len(toks) < 4: continue
    sc = sum(freq.get(t,0) for t in toks)/max(len(toks),1)
    scored.append((sc,i,s))
top = sorted(scored,key=lambda x:-x[0])[:5]

print(f"**PDF Summary — {fp.name}**")
print(f"Pages: {len(reader.pages)} | Chunks: {len(texts)}\n")
print("**Keywords:**", ', '.join(w for w,_ in keywords(full)))
print("\n**Summary (top sentences):**")
for sc,i,s in sorted(top,key=lambda x:x[1]):
    print(f"  • {s[:200]}")
if len(sents) > 5:
    print(f"\n  [+ {len(sents)-5} more sentences]")
