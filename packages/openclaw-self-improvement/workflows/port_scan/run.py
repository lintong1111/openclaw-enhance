#!/usr/bin/env python3
"""port-scan: Scan common ports on localhost or a given host."""
import socket, sys, concurrent.futures, time

COMMON = [(21,'FTP'),(22,'SSH'),(80,'HTTP'),(443,'HTTPS'),(3000,'Node'),(5000,'Flask'),(8000,'FastAPI'),(8080,'Proxy'),(9090,'Prom'),(27017,'Mongo'),(5432,'Postgres'),(6379,'Redis'),(3306,'MySQL'),(9200,'Elastic'),(7070,'Nexus'),(7081,'NexusAlt')]

host = sys.argv[1] if len(sys.argv)>1 else 'localhost'
timeout = float(sys.argv[2]) if len(sys.argv)>2 else 1.0

def check(port, name):
    s = socket.socket(); s.settimeout(timeout)
    try:
        r = s.connect_ex((host, port)); s.close()
        return (port, name, r == 0)
    except: return (port, name, False)

print(f"**Port Scan — {host}**")
start = time.time()
with concurrent.futures.ThreadPoolExecutor(max_workers=20) as ex:
    results = list(ex.map(lambda x: check(*x), COMMON))
elapsed = time.time() - start

open_ports = [(p,n) for p,n,o in results if o]
closed = [(p,n) for p,n,o in results if not o]

print(f"Scan complete in {elapsed:.1f}s | Open: {len(open_ports)}/{len(COMMON)}\n")
if open_ports:
    print("**OPEN:**")
    for p,n in open_ports:
        print(f"  ✅ {p:>6} {n}")
print("\n**CLOSED:**")
for p,n in closed[:10]:
    print(f"  ❌ {p:>6} {n}")
