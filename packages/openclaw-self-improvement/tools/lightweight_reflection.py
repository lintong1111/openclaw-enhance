#!/usr/bin/env python3
"""
Lightweight Self-Reflection Tool
Run during each HEARTBEAT to capture a one-line insight.
Stores in ~/.openclaw/workspace/.learnings/daily_reflections.md
Format: [YYYY-MM-DD HH:MM] insight text
Max 5 entries per day (oldest discarded when exceeding limit)
"""
import os, sys
from datetime import datetime

reflections_file = os.path.expanduser('~/.openclaw/workspace/.learnings/daily_reflections.md')
today = datetime.now().strftime('%Y-%m-%d')

entries = []
if os.path.exists(reflections_file):
    with open(reflections_file) as f:
        content = f.read()
    for line in content.split('\n'):
        if line.strip().startswith('['):
            entries.append(line.strip())

# Partition today vs old
today_entries = [e for e in entries if e[1:11] == today]
old_entries = [e for e in entries if e[1:11] != today]

# New reflection from arg or default
reflection_text = sys.argv[1] if len(sys.argv) > 1 else "System heartbeat OK."
new_entry = f"[{today} {datetime.now().strftime('%H:%M')}] {reflection_text}"

today_entries.append(new_entry)
if len(today_entries) > 5:
    today_entries = today_entries[-5:]

all_entries = today_entries + old_entries
with open(reflections_file, 'w') as f:
    f.write('\n'.join(all_entries) + '\n')

print(f'[{today}] {len(today_entries)} reflections today. Last: {reflection_text[:50]}')
