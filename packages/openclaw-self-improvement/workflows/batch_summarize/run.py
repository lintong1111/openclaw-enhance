#!/usr/bin/env python3
"""batch-summarize: Summarize text/md/txt files in a folder."""
import sys, glob, re
from pathlib import Path
STOP={"a","an","and","are","as","at","be","by","for","from","has","in","is","it","its","of","on","or","that","the","to","was","were","will","with"}
def norm(t): return re.sub(r"\s+"," ",str(t or "")).strip()
def summary(t):
    sents=re.split(r"(?<=[.!?])\s+",norm(t))
    freq={}
    for tok in re.findall(r"[A-Za-z][A-Za-z0-9_-]{2,}",norm(t).lower()):
        if tok not in STOP: freq[tok]=freq.get(tok,0)+1
    scored=[]
    for i,s in enumerate(sents):
        toks=[t for t in re.findall(r"[A-Za-z][A-Za-z0-9_-]{2,}",s.lower()) if t not in STOP]
        if len(toks)<4: continue
        sc=sum(freq.get(t,0) for t in toks)/max(len(toks),1)
        scored.append((sc,i,s))
    return " | ".join(s for _,_,s in sorted(scored,key=lambda x:-x[0])[:3])
folder=Path(sys.argv[1] if len(sys.argv)>1 else Path.home()/"Downloads")
files=[Path(p) for p in glob.glob(str(folder/"*")) if Path(p).is_file() and Path(p).suffix.lower() in {".txt",".md",".py",".json",".yaml"}]
print(f"Batch Summarize -- {folder} ({len(files)} files)
")
for fp in files[:20]:
    try:
        with open(fp) as f: txt=f.read()[:2000]
        print(f"[{fp.name}] {summary(txt)[:120]}
")
    except: pass
