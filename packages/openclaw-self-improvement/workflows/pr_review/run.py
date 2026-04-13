#!/usr/bin/env python3
"""pr-review: Review a git diff file or URL for issues."""
import subprocess, sys, re
from pathlib import Path

diff_arg = sys.argv[1] if len(sys.argv) > 1 else ""

def run(args, timeout=15):
    return subprocess.run(args, capture_output=True, text=True, timeout=timeout)

issues = []
warnings = []

# Try git diff
if diff_arg in ("", "--git"):
    r = run(["git", "diff", "--stat"], timeout=10)
    if r.returncode == 0 and r.stdout.strip():
        diff = run(["git", "diff"], timeout=30)
        content = diff.stdout
    else:
        content = ""
elif Path(diff_arg).exists():
    with open(diff_arg) as f: content = f.read()
else:
    print(f"**PR Review — {diff_arg or 'staged'}**")
    print("No diff found. Provide a file path or run from a git repo.")
    sys.exit(0)

lines = content.split('\n')
added = [l for l in lines if l.startswith('+') and not l.startswith('+++')]
removed = [l for l in lines if l.startswith('-') and not l.startswith('---')]

# Security checks
for l in added:
    if re.search(r'password\s*=\s*["\']', l, re.I): issues.append(f"Hardcoded password: {l[:80]}")
    if re.search(r'api[_-]?key\s*=\s*["\']', l, re.I): issues.append(f"Hardcoded API key: {l[:80]}")
    if re.search(r'secret\s*=\s*["\']', l, re.I): issues.append(f"Hardcoded secret: {l[:80]}")
    if 'eval(' in l and 'request' in l: issues.append(f"eval+request risk: {l[:80]}")
    if re.search(r'System\.exec|ProcessBuilder|Runtime\.getRuntime', l): issues.append(f"Code execution: {l[:80]}")
    if 'TODO' in l or 'FIXME' in l: warnings.append(f"Unresolved TODO/FIXME: {l[:80]}")

# Style checks
for l in added:
    if len(l) > 120: warnings.append(f"Long line ({len(l)} chars): {l[:100]}")
    if re.search(r'\s+$', l): warnings.append(f"Trailing whitespace: {l[:80]}")

print(f"**PR Review — {diff_arg or 'git diff'}**")
print(f"Lines added: {len(added)} | Removed: {len(removed)}")
if issues:
    print(f"\n🚨 Issues ({len(issues)}):")
    for i in issues: print(f"  • {i}")
if warnings:
    print(f"\n⚠️ Warnings ({len(warnings)}):")
    for w in warnings[:10]: print(f"  • {w}")
if not issues and not warnings:
    print("\n✅ No obvious issues found.")
