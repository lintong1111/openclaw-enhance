#!/usr/bin/env python3
"""find-duplicates: Find duplicate files by content hash."""
import os, hashlib
from pathlib import Path
from collections import defaultdict

def hash_file(p):
    h = hashlib.sha256()
    try:
        with open(p, 'rb') as f:
            for chunk in iter(lambda: f.read(8192), b''):
                h.update(chunk)
        return h.hexdigest()
    except OSError:
        return None

def fmt(size):
    for u in ["B","KB","MB","GB"]:
        if abs(size) < 1024 or u == "GB": return f"{size:.1f}{u}" if u != "B" else f"{int(size)}{u}"
        size /= 1024
    return "0B"

target = Path.home()
seen = defaultdict(list)
dupes = []

for root, _, files in os.walk(target):
    for fn in files:
        fp = Path(root)/fn
        if fp.is_symlink() or fp.stat().st_size < 1024:
            continue
        h = hash_file(fp)
        if h:
            seen[h].append(fp)

for h, paths in sorted(seen.items()):
    if len(paths) > 1:
        sz = paths[0].stat().st_size
        dupes.append((sz, paths))

print(f"**Find Duplicates — {target}**")
print(f"Duplicate groups: {len(dupes)}")
total_dup = sum(sz*len(pths)-sz for sz, pths in dupes)
print(f"Total wasted space: ~{fmt(total_dup)}\n")
for sz, paths in sorted(dupes, key=lambda x: -x[0])[:20]:
    print(f"[{fmt(sz)} x {len(paths)}]")
    for p in paths[:5]:
        print(f"  {p}")
    if len(paths) > 5:
        print(f"  ... and {len(paths)-5} more")
    print()
