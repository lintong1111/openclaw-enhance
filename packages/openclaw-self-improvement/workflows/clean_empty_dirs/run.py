#!/usr/bin/env python3
"""clean-empty-dirs: Remove empty directories recursively."""
import os
from pathlib import Path

target = Path.home()
removed = []
for root, dirs, files in os.walk(str(target), topdown=False):
    for d in dirs:
        dp = Path(root)/d
        try:
            if dp.is_dir() and not any(dp.iterdir()):
                dp.rmdir()
                removed.append(str(dp))
        except OSError:
            pass

print(f"**Clean Empty Dirs — {target}**")
print(f"Removed: {len(removed)} empty directories")
if removed:
    for d in removed[:20]:
        print(f"  {d}")
    if len(removed) > 20:
        print(f"  ... and {len(removed)-20} more")
else:
    print("No empty directories found.")
