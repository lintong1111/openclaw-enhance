#!/usr/bin/env python3
"""repo-summary: Show git repo status and recent commits."""
import subprocess
from pathlib import Path
folder=Path(sys.argv[1] if len(sys.argv)>1 else Path.cwd())
r=subprocess.run(["git","status","--short"],capture_output=True,text=True,cwd=folder)
br=subprocess.run(["git","branch","--show-current"],capture_output=True,text=True,cwd=folder)
lg=subprocess.run(["git","log","--oneline","-10"],capture_output=True,text=True,cwd=folder)
print(f"Repo Summary -- {folder.name}
")
print(f"Branch: {br.stdout.strip() or '(no branch)'}
")
print("Recent commits:")
for l in lg.stdout.strip().splitlines()[:8]: print(f"  {l}")
