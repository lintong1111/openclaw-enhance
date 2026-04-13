#!/usr/bin/env python3
"""log-summarize: Summarize a log file — find errors, warnings, patterns."""
import re, sys
from pathlib import Path
from collections import Counter

fp = Path(sys.argv[1] if len(sys.argv)>1 else Path.home()/"Downloads")
if not fp.exists(): print(f"Not found: {fp}"); sys.exit(1)

with open(fp, errors='replace') as f: lines = f.readlines()

errors = [l.strip() for l in lines if re.search(r'\b(ERROR|FATAL|CRITICAL)\b', l, re.I)]
warnings = [l.strip() for l in lines if re.search(r'\bWARN(ING)?\b', l, re.I)]
infos = [l.strip() for l in lines if re.search(r'\bINFO\b', l, re.I)]

# Common patterns
patterns = Counter()
for l in lines:
    m = re.search(r'\[([A-Z_]+)\]', l) or re.search(r'(ERROR|WARN|INFO|DEBUG)[:\s]', l, re.I)
    if m: patterns[m.group(1).upper()] += 1

print(f"**Log Summary — {fp.name}**")
print(f"Total lines: {len(lines)} | Errors: {len(errors)} | Warnings: {len(warnings)} | Info: {len(infos)}\n")
print(f"**Top patterns:**")
for p, c in patterns.most_common(10): print(f"  {p}: {c}")
print(f"\n**Recent errors:**")
for e in errors[-5:]: print(f"  {e[:120]}")
print(f"\n**Recent warnings:**")
for w in warnings[-5:]: print(f"  {w[:120]}")
