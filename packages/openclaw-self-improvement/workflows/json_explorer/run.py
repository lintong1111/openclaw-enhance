#!/usr/bin/env python3
"""json-explorer: Query a JSON file with a key path like root.child.field."""
import sys, json
from pathlib import Path

fp = Path(sys.argv[1] if len(sys.argv)>1 else Path.home())
path = sys.argv[2] if len(sys.argv)>2 else ""

def get(d, p):
    for k in p.split('.'):
        if not k: continue
        if isinstance(d, list): d = d[int(k)]
        else: d = d.get(k, None)
        if d is None: return None
    return d

if not fp.exists(): print(f"Not found: {fp}"); sys.exit(1)
with open(fp) as f: data = json.load(f)

if not path:
    print(f"**JSON Explorer — {fp.name}**")
    print(f"Top-level keys: {list(data.keys()) if isinstance(data,dict) else f'array[{len(data)}]'}")
else:
    result = get(data, path)
    print(f"**{path}:**")
    if isinstance(result, (dict, list)):
        print(json.dumps(result, indent=2, ensure_ascii=False)[:1000])
    else:
        print(result)
