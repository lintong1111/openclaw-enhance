#!/usr/bin/env python3
"""disk-report: Analyze disk usage and suggest cleanups."""
import os, shutil
from pathlib import Path

def format_bytes(size):
    for unit in ["B","KB","MB","GB","TB"]:
        if abs(size) < 1024 or unit == "TB":
            return f"{size:.1f}{unit}" if unit != "B" else f"{int(size)}{unit}"
        size /= 1024
    return "0B"

def entry_size(path):
    total = 0
    try:
        if path.is_file():
            return path.stat().st_size
        if not path.is_dir():
            return 0
    except OSError:
        return 0
    for root, _, files in os.walk(path):
        for fn in files:
            try:
                if not (Path(root)/fn).is_symlink():
                    total += (Path(root)/fn).stat().st_size
            except OSError:
                continue
    return total

def top_entries(target, limit=5):
    entries = [(entry_size(e), e) for e in target.iterdir() if not e.name.startswith('.')]
    entries.sort(key=lambda x: x[0], reverse=True)
    return entries[:limit]

def large_files(target, threshold_mb=50, limit=10):
    threshold = threshold_mb * 1024 * 1024
    matches = []
    for root, _, files in os.walk(target):
        for fn in files:
            fp = Path(root)/fn
            try:
                if fp.is_symlink():
                    continue
                sz = fp.stat().st_size
                if sz >= threshold:
                    matches.append((sz, fp))
            except OSError:
                continue
    matches.sort(key=lambda x: x[0], reverse=True)
    return matches[:limit]

target = Path.home()
usage = shutil.disk_usage(target)
threshold_mb = 50
top = top_entries(target)
large = large_files(target, threshold_mb)
reclaimable = sum(s for s,_ in large)

recs = []
if usage.total and (usage.used/usage.total) >= 0.85:
    recs.append("Disk usage >85%; clear caches and downloads soon.")
if large:
    recs.append(f"Review the {len(large)} files above {threshold_mb}MB first.")
if not recs:
    recs.append("No urgent cleanup needed.")

print(f"**Disk Usage Report — {target}**")
print(f"- Total / Used / Free: {format_bytes(usage.total)} / {format_bytes(usage.used)} / {format_bytes(usage.free)}")
print(f"- Usage: {round((usage.used/usage.total)*100,1)}%")
print(f"\n**Top 5 largest entries:**")
for size, path in top:
    print(f"  {format_bytes(size):>10}  {path}")
print(f"\n**Large files (>{threshold_mb}MB):**")
if large:
    for size, path in large:
        print(f"  {format_bytes(size):>10}  {path}")
else:
    print("  None found.")
print(f"\n**Recommendations:**")
for r in recs:
    print(f"  • {r}")
print(f"\nTotal reclaimable (~{len(large)} files): {format_bytes(reclaimable)}")
