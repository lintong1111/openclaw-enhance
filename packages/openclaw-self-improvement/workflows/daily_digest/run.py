#!/usr/bin/env python3
"""daily-digest: Show a summary of recent activity across memory and workspace."""
import os, glob, subprocess
from pathlib import Path
from datetime import datetime, timedelta

def recent_files(base, days=2, exts=None):
    cutoff = datetime.now() - timedelta(days=days)
    files = []
    for p in glob.glob(str(base)):
        if exts and not any(str(p).endswith(e) for e in exts): continue
        try:
            m = datetime.fromtimestamp(os.path.getmtime(p))
            if m > cutoff: files.append((m, p))
        except OSError: pass
    return sorted(files, reverse=True)

def fmt_bytes(sz):
    for u in ["B","KB","MB","GB"]:
        if abs(sz)<1024 or u=="GB": return f"{sz:.1f}{u}" if u!="B" else f"{int(sz)}{u}"
        sz/=1024
    return "0B"

now = datetime.now()
print(f"**Daily Digest — {now.strftime('%Y-%m-%d %H:%M')}**\n")

# Recent memory files
mem_files = recent_files(Path.home()/'.openclaw/workspace/memory/*.md')
print(f"**Recent memory logs ({len(mem_files)}):**")
for m, p in mem_files[:5]:
    print(f"  {m.strftime('%m-%d %H:%M')}  {Path(p).name}")

# Recent cron outputs
cron_files = recent_files(Path.home()/'.openclaw/workspace/data/cron/*_latest.md')
print(f"\n**Recent cron reports ({len(cron_files)}):**")
for m, p in cron_files[:3]:
    with open(p) as f:
        preview = f.readline().strip()[:80]
    print(f"  {m.strftime('%m-%d %H:%M')}  {Path(p).name} → {preview}")

# Git status if in a repo
r = subprocess.run(['git', 'rev-parse', '--is-inside-work-tree'], capture_output=True, text=True, cwd=Path.home())
if r.returncode == 0:
    s = subprocess.run(['git', 'status', '--short'], capture_output=True, text=True, cwd=Path.home())
    changes = [l for l in s.stdout.strip().split('\n') if l]
    print(f"\n**Git changes ({len(changes)}):**")
    for c in changes[:10]: print(f"  {c}")
    if len(changes) > 10: print(f"  ... and {len(changes)-10} more")

# Disk usage
import shutil
usage = shutil.disk_usage(Path.home())
print(f"\n**Disk usage:**")
print(f"  {fmt_bytes(usage.used)} / {fmt_bytes(usage.total)} used ({round(usage.used/usage.total*100,1)}%)")

# System load
load1, load5, load15 = os.getloadavg() if hasattr(os, 'getloadavg') else (0,0,0)
print(f"\n**System load:** {load1:.2f} (1m) {load5:.2f} (5m) {load15:.2f} (15m)")
