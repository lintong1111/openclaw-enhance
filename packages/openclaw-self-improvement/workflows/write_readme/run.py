#!/usr/bin/env python3
"""write-readme: Generate a README.md for a project folder."""
import sys
from pathlib import Path
folder=Path(sys.argv[1] if len(sys.argv)>1 else Path.cwd())
readme=folder/"README.md"
if readme.exists(): print("README.md already exists"); sys.exit(1)
files=list(folder.glob("*"))
py=[f.name for f in files if f.suffix==".py"]
content=f"# {folder.name}

## Overview

Describe this project here.

## Setup

```bash
pip install -r requirements.txt
```

## Usage

```bash
python {py[0] if py else 'main.py'}
```

## Files

" + "
".join(f"- {f.name}" for f in files[:20])
with open(readme,"w") as f: f.write(content)
print(f"Generated: {readme}")
