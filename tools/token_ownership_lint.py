#!/usr/bin/env python3
"""token_ownership_lint.py — B9 (QA-SHELL-001): token-ownership lint.

Aturan (DS-SHELL-001 §3 [D-S4 Ratified]):
  1. Semua warna/ukuran harus melalui token di `frontend/src/shared/tokens.*`.
     Hex literal di luar file token = pelanggaran.
  2. `font-size` literal (px) di TS/TSX/CSS non-token = pelanggaran.
  3. `font-weight` literal (600/700/…) di TS/TSX/CSS non-token =
     pelanggaran (pakai token `--font-weight-*` bila tersedia).

File token (`tokens.css`, `tokens.ts`) dan file generated
(`shared/ipc/generated.ts`) bebas dari aturan. Exit 1 bila ada temuan.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "frontend" / "src"
ALLOW = {
    "shared/tokens.css",
    "shared/tokens.ts",
    "shared/ipc/generated.ts",
}

HEX = re.compile(r"#[0-9a-fA-F]{3,8}\b")
FONT_SIZE = re.compile(r"font-?size\s*:\s*['\"]?\d", re.IGNORECASE)
FONT_WEIGHT = re.compile(r"font-?weight\s*:\s*['\"]?\d", re.IGNORECASE)


def main() -> int:
    findings: list[str] = []
    for path in sorted(SRC.rglob("*")):
        if path.suffix not in {".ts", ".tsx", ".css"}:
            continue
        rel = path.relative_to(SRC).as_posix()
        if rel in ALLOW:
            continue
        text = path.read_text(encoding="utf-8")
        for lineno, line in enumerate(text.splitlines(), 1):
            if HEX.search(line):
                findings.append(f"{rel}:{lineno}: hex literal: {line.strip()[:80]}")
            if FONT_SIZE.search(line):
                findings.append(f"{rel}:{lineno}: font-size literal: {line.strip()[:80]}")
            if FONT_WEIGHT.search(line):
                findings.append(f"{rel}:{lineno}: font-weight literal: {line.strip()[:80]}")
    if findings:
        print("TOKEN-OWNERSHIP VIOLATIONS:")
        for f in findings:
            print(f"  {f}")
        return 1
    print("token ownership OK: no hex/font-size/font-weight literals outside token files")
    return 0


if __name__ == "__main__":
    sys.exit(main())
