#!/usr/bin/env python3
"""folder-summary: Summarize a folder's contents."""
import os, re
from pathlib import Path

STOP={"a","an","and","are","as","at","be","by","for","from","has","in","is","it","its","of","on","or","that","the","to","was","were","will","with","this","these","those","their","there","about","after","before","into","over","under","than","then","them","they","you","your","our","we","can","may","should","been","being","have","had","does","did","doing"}

def fmt(sz):
    for u in ["B","KB","MB","GB"]:
        if abs(sz)<1024 or u=="GB": return f"{sz:.1f}{u}" if u!="B" else f"{int(sz)}{u}"
        sz/=1024
    return "0B"

target = Path.home() if len(__import__("sys").argv)<2 else Path(__import__("sys").argv[1])
if not target.exists(): target = Path.home()
types={}; sizes=[]; files=list(target.rglob("*"))
for f in files[:1000]:
    try:
        if f.is_file(): types[f.suffix.lower()]=types.get(f.suffix.lower(),0)+1; sizes.append(f.stat().st_size)
    except OSError: pass

texts=[f.name for f in files[:200] if f.is_file()]
words=' '.join(texts)
kw=re.findall(r'[A-Za-z][A-Za-z0-9_-]{2,}',words.lower())
freq={w:freq.get(w,0)+1 for w in kw if w not in STOP}
top_kw=sorted(freq.items(),key=lambda x:-x[1])[:12]

print(f"**Folder Summary — {target}**")
print(f"Total items: {len(files):,} | Files: {len(sizes)}")
print(f"Total size: {fmt(sum(sizes))} | Avg file: {fmt(sum(sizes)//max(len(sizes),1))}")
print(f"\n**Top keywords in filenames:**")
for w,c in top_kw: print(f"  {w}: {c}")
print(f"\n**File types:**")
for ext,c in sorted(types.items(),key=lambda x:-x[1])[:10]:
    print(f"  {ext or '(no ext)'}: {c}")
