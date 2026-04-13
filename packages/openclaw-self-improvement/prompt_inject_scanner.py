#!/usr/bin/env python3
"""
Prompt Injection Scanner — detects malicious prompt injection attempts.
Based on ClawOS nexus/scanner.py patterns.

Usage:
  python3 prompt_inject_scanner.py "<text to scan>"
  python3 prompt_inject_scanner.py --file <filepath>
  echo "text" | python3 prompt_inject_scanner.py
"""
import sys, re

_PATTERNS = [
    # Instruction override
    (r"ignore\s+(all\s+)?(previous|prior|above|earlier)\s+(instructions?|rules?|prompts?|context)", "ignore previous instructions", 3),
    (r"disregard\s+(all\s+)?(previous|prior|above)\s+(instructions?|rules?)", "disregard previous instructions", 3),
    (r"forget\s+(everything|all|your|the)\s+(instructions?|rules?|training|context|above)", "forget instructions", 3),
    (r"(your\s+)?(new|actual|real|true|updated)\s+(instructions?|rules?|task|goal|purpose)\s+(is|are|now)", "new instructions injection", 3),
    (r"from\s+now\s+on\s+(you\s+)?(are|will|must|should)", "from now on override", 3),
    (r"you\s+are\s+now\s+(a\s+)?(different|new|another|an?)\s+\w+", "persona override", 2),
    # Jailbreak
    (r"(pretend|imagine|act|roleplay|behave)\s+(that\s+)?(you\s+)?(are|have\s+no|without)\s+(a\s+)?(\w+\s+)?(restrictions?|limits?|safeguards?|content.?policy)", "jailbreak: bypass safeguards", 3),
    (r"DAN\s+", "DAN jailbreak", 3),
    (r"grandma\s+(knows|used|numerical)", "grandma jailbreak", 2),
    # Encoding/evasion
    (r"(base64|base_?64)\s*[:=]\s*[A-Za-z0-9+/]{20,}", "encoded payload", 3),
    (r"\\x[0-9a-f]{2}", "hex escape sequence", 2),


    # Shell injection
    (r"[;&|`$]\s*(rm|del|format|kid SS|shutdown)", "shell injection", 3),
    (r"\$\([^)]+\)", "command substitution", 2),
    # Credential extraction
    (r"password\s*=\s*[\"\'][\w!@#$%]{8,}", "embedded password", 3),
    (r"api[_-]?key\s*=\s*[\"\'][A-Za-z0-9_]{20,}", "embedded API key", 3),
]

def scan_text(text):
    findings = []
    for pattern, label, severity in _PATTERNS:
        if re.search(pattern, text, re.I):
            findings.append((severity, label, re.search(pattern, text, re.I).group(0)[:60]))
    return sorted(findings, key=lambda x: -x[0])

if __name__ == "__main__":
    if "--file" in sys.argv:
        fp = [a for a in sys.argv if a != "--file" and not a.startswith("-")][0] if len(sys.argv) > 1 else ""
        if not fp or not __import__("pathlib").Path(fp).exists():
            print("Usage: prompt_inject_scanner.py --file <filepath>"); sys.exit(1)
        text = open(fp).read()
    elif len(sys.argv) > 1:
        text = " ".join(sys.argv[1:])
    else:
        text = sys.stdin.read()

    findings = scan_text(text)
    if not findings:
        print("PASS: No prompt injection patterns detected.")
    else:
        print(f"ALERT: {len(findings)} pattern(s) detected:")
        for sev, label, match in findings:
            icon = "🔴" if sev == 3 else "🟡"
            print(f"  {icon} [{sev}/3] {label}: {match}")
