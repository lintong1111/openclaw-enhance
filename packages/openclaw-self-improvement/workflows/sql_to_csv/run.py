#!/usr/bin/env python3
"""sql-to-csv: Run SQL against a SQLite DB and output CSV."""
import sys, sqlite3, csv
fp=sys.argv[1] if len(sys.argv)>1 else ":memory:"
sql=sys.argv[2] if len(sys.argv)>2 else "SELECT name FROM sqlite_master WHERE type='table'"
conn=sqlite3.connect(fp)
rows=list(conn.execute(sql))
cols=[d[0] for d in conn.description or []]
out=fp.replace(".db",".csv") if ".db" in fp else "output.csv"
with open(out,"w",newline="") as f:
    w=csv.DictWriter(f,fieldnames=cols)
    w.writeheader()
    for r in rows: w.writerow(dict(zip(cols,r)))
print(f"Wrote {len(rows)} rows -> {out}")
