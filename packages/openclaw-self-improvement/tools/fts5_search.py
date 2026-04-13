#!/usr/bin/env python3
"""
FTS5 Memory Search Tool
Usage: python3 fts5_search.py <query> [limit]
"""
import sqlite3, os, sys

db_path = os.path.expanduser('~/.openclaw/workspace/.ftsi/memory.db')
query = sys.argv[1] if len(sys.argv) > 1 else ''
limit = int(sys.argv[2]) if len(sys.argv) > 2 else 5

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
