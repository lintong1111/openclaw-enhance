#!/usr/bin/env python3
"""process-report: Show top processes by CPU/memory."""
import sys, subprocess
n=int(sys.argv[1] if len(sys.argv)>1 else 10)
r=subprocess.run(["ps","aux","--sort=-%cpu"],capture_output=True,text=True)
lines=[l for l in r.stdout.splitlines() if not l.startswith("USER")]
print(f"Top {n} processes by CPU
")
for l in lines[:n]:
    parts=l.split()
    if len(parts)>=11: print(f"  {parts[2]:>6}%CPU {parts[3]:>6}%MEM {parts[10] if len(parts)>10 else parts[-1]}")
