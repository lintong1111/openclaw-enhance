#!/usr/bin/env python3
"""
FTS5 Memory Search Tool
Usage: python3 fts5_search.py <query> [limit]
"""
import sqlite3, os, sys

db_path = os.path.expanduser('~/.openclaw/workspace/.ftsi/memory.db')
query = sys.argv[1] if len(sys.argv) > 1 else ''
limit = int(sys.argv[2]) if len(sys.argv) > 2 else 5
force_rebuild = '--rebuild' in sys.argv

os.makedirs(os.path.dirname(db_path), exist_ok=True)

# Auto-init db if not exists or rebuild requested
if not os.path.exists(db_path) or force_rebuild:
    import glob
    conn = sqlite3.connect(db_path)
    conn.execute('CREATE VIRTUAL TABLE IF NOT EXISTS memory_fts USING fts5(date, content, tokenize="unicode61")')
    files = sorted(glob.glob(os.path.expanduser('~/.openclaw/workspace/memory/*.md')))
    files += sorted(glob.glob(os.path.expanduser('~/.openclaw/workspace/data/cron/*.md')))
    for fpath in files:
        with open(fpath) as f:
            date = os.path.basename(fpath)[:10]
            conn.execute('INSERT OR REPLACE INTO memory_fts(date, content) VALUES (?, ?)',
                        (date, f.read()[:10000]))
    conn.commit()
    print(f'FTS5 index built: {conn.execute("SELECT COUNT(*) FROM memory_fts").fetchone()[0]} records')
    if not query:
        sys.exit(0)

if not query:
    print("Usage: fts5_search.py <query> [limit]")
    sys.exit(1)

conn = sqlite3.connect(db_path)
try:
    rows = conn.execute(
        'SELECT date, content FROM memory_fts WHERE memory_fts MATCH ? LIMIT ?',
        (query, limit)
    ).fetchall()
    
    if not rows:
        print(f"No results for: {query}")
    else:
        print(f"Found {len(rows)} result(s) for: {query}\n")
        for i, (date, content) in enumerate(rows, 1):
            preview = content[:300].replace('\n', ' ')
            print(f"[{i}] {date}")
            print(f"    {preview}...")
            print()
finally:
    conn.close()
