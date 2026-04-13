#!/usr/bin/env python3
"""organize-downloads: Sort Downloads folder into Images/Documents/Archives/Code/Video/Audio."""
import os, shutil
from pathlib import Path

CATEGORY_RULES = [
    ("Images", {".jpg",".jpeg",".png",".gif",".webp",".heic",".svg",".bmp"}),
    ("Documents", {".pdf",".docx",".doc",".txt",".md",".xlsx",".csv",".pptx",".rtf",".odt"}),
    ("Archives", {".zip",".tar",".gz",".7z",".rar",".bz2",".xz"}),
    ("Code", {".py",".js",".ts",".tsx",".sh",".json",".yaml",".yml",".html",".css",".go",".rs",".java",".c",".cpp"}),
    ("Videos", {".mp4",".mov",".avi",".mkv",".wmv",".flv",".webm"}),
    ("Audio", {".mp3",".wav",".flac",".m4a",".ogg",".aac",".wma"}),
]

def fmt(size):
    for u in ["B","KB","MB","GB"]:
        if abs(size) < 1024 or u == "GB": return f"{size:.1f}{u}" if u != "B" else f"{int(size)}{u}"
        size /= 1024
    return "0B"

def cat_for(p):
    for name, exts in CATEGORY_RULES:
        if p.suffix.lower() in exts:
            return name
    return "Other"

def unique_dest(p):
    if not p.exists(): return p
    s, sx = p.stem, p.suffix
    i = 1
    while p.exists(): p = p.with_name(f"{s}-{i}{sx}"); i += 1
    return p

target = Path.home() / "Downloads"
dry = "--dry-run" in __import__("sys").argv
files = sorted([f for f in target.iterdir() if f.is_file()], key=lambda x: x.name.lower())

cats = {}
cat_bytes = {}
moves = []
total = 0
for f in files:
    c = cat_for(f)
    dest_dir = target / c
    dest = unique_dest(dest_dir / f.name)
    try: sz = max(0, f.stat().st_size)
    except OSError: sz = 0
    moves.append((f, dest, c, sz))
    cats[c] = cats.get(c, 0) + 1
    cat_bytes[c] = cat_bytes.get(c, 0) + sz
    total += sz

if not dry:
    for src, dst, c, _ in moves:
        dst.parent.mkdir(parents=True, exist_ok=True)
        src.rename(dst)

print(f"**Downloads Organizer — {target}**")
print(f"- Mode: {'preview' if dry else 'APPLIED'}")
print(f"- Files: {len(files)} | Categories: {len(cats)} | Total: {fmt(total)}")
print("\n**Category breakdown:**")
for c, n in sorted(cats.items(), key=lambda x: -x[1]):
    print(f"  {c}: {n} files  {fmt(cat_bytes.get(c,0))}")
print("\n**Sample moves:**")
for src, dst, c, sz in moves[:8]:
    print(f"  {src.name} -> {c}/{dst.name}  ({fmt(sz)})")
if len(moves) > 8:
    print(f"  ... and {len(moves)-8} more")
if dry:
    print("\n→ Rerun without --dry-run to apply")
