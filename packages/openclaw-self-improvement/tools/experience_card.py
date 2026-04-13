#!/usr/bin/env python3
"""
Experience Card Generator
Analyzes recent events and generates actionable experience cards.
Stores in ~/.openclaw/workspace/.learnings/EXPERIENCES.md
Run from HEARTBEAT or manually after complex tasks.
"""
import os, sys, sqlite3, glob
from datetime import datetime

experiences_file = os.path.expanduser('~/.openclaw/workspace/.learnings/EXPERIENCES.md')
ftsi_db = os.path.expanduser('~/.openclaw/workspace/.ftsi/memory.db')
today = datetime.now().strftime('%Y-%m-%d')

# Context: what just happened (passed as arg or auto-detect)
context = sys.argv[1] if len(sys.argv) > 1 else None

# Auto-detect recent learnings from errors/fixes in daily reflections
reflections_file = os.path.expanduser('~/.openclaw/workspace/.learnings/daily_reflections.md')
reflection_insight = ""
if os.path.exists(reflections_file):
    with open(reflections_file) as f:
        for line in f:
            if today in line and ('fix' in line.lower() or 'error' in line.lower() or 'bug' in line.lower() or 'learn' in line.lower()):
                reflection_insight = line.strip()
                break

# Parse recent errors from ERRORS.md
errors_file = os.path.expanduser('~/.openclaw/workspace/.learnings/ERRORS.md')
recent_error = ""
if os.path.exists(errors_file):
    with open(errors_file) as f:
        lines = f.readlines()
        # Get last 5 error entries
        for line in reversed(lines[-20:]):
            if line.strip() and not line.strip().startswith('#'):
                recent_error = line.strip()[:100]
                break

# Generate experience card
card = f"""
## Experience Card — {today} {datetime.now().strftime('%H:%M')}

**Context:** {context or 'HEARTBEAT auto-scan'}
**Recent Fix:** {reflection_insight[:100] if reflection_insight else '(none today)'}
**Last Error:** {recent_error if recent_error else '(none today)'}

**Pattern Detected:** {'Yes' if (reflection_insight or recent_error) else 'No significant pattern'}

---
"""
print("Experience card generated:")
print(card[:200])

# Append to experiences file
with open(experiences_file, 'a') as f:
    f.write(card)

print(f'\nSaved to {experiences_file}')
