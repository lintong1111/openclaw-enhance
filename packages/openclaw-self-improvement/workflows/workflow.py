#!/usr/bin/env python3
"""
Nexus Workflow Runner — runs any workflow from workflows/ subdirectory.
Usage: python3 workflow.py <workflow-name> [args...]
"""
import sys, subprocess
from pathlib import Path

WORKFLOWS_DIR = Path(__file__).parent
name = sys.argv[1] if len(sys.argv) > 1 else ""
args = sys.argv[2:]

if not name:
    # List all workflows
    print("Available workflows:")
    for d in sorted(WORKFLOWS_DIR.iterdir()):
        if d.is_dir() and (d/"run.py").exists():
            # Get description from first non-empty comment
            desc = "no description"
            try:
                with open(d/"run.py") as f:
                    for line in f:
                        if line.startswith('"""') and line.count('"""') >= 2:
                            desc = line.strip().strip('"').split('\n')[0][3:].strip()
                            break
                        elif line.startswith('#'): desc = line[2:].strip()
            except: pass
            print(f"  {d.name:30s} — {desc}")
    sys.exit(0)

wf_dir = WORKFLOWS_DIR / name
run_py = wf_dir / "run.py"
if not run_py.exists():
    print(f"Workflow not found: {name}")
    sys.exit(1)

result = subprocess.run(["python3", str(run_py)] + args, capture_output=False)
sys.exit(result.returncode)
