"""SBOM + checksums generator — Doc14 BUILD-014, Doc16 M3 P2.

Reads locked dependencies from `uv.lock` (TOML) and emits:
- `sbom.json`: CycloneDX-flavoured minimal BOM (name/version per package)
- `checksums.txt`: SHA-256 per release artifact file given on the CLI

Usage:
    .venv/bin/python tools/generate_sbom.py [out_dir] [artifact ...]
"""
from __future__ import annotations

import hashlib
import json
import sys
import tomllib
from datetime import UTC, datetime
from pathlib import Path


def _sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def build_sbom(lock_path: Path) -> dict:
    data = tomllib.loads(lock_path.read_text())
    packages = []
    for pkg in data.get("package", []):
        packages.append({
            "name": pkg.get("name"),
            "version": pkg.get("version"),
            "source": str(pkg.get("source", "")),
        })
    return {
        "bomFormat": "CycloneDX",
        "specVersion": "1.5",
        "serialNumber": "urn:uuid:00000000-0000-0000-0000-000000000000",
        "metadata": {
            "timestamp": datetime.now(UTC).isoformat(),
            "tools": [{"vendor": "eda-workbench", "name": "generate_sbom.py"}],
            "component": {"type": "application", "name": "eda-workbench"},
        },
        "components": sorted(packages, key=lambda p: str(p["name"])),
    }


def main(argv: list[str]) -> int:
    root = Path(__file__).resolve().parent.parent
    out_dir = Path(argv[1]) if len(argv) > 1 else root / "dist"
    out_dir.mkdir(parents=True, exist_ok=True)

    sbom = build_sbom(root / "uv.lock")
    (out_dir / "sbom.json").write_text(json.dumps(sbom, indent=2))
    lines = [
        f'{_sha256_file(out_dir / "sbom.json")}  sbom.json',
    ]
    for arg in argv[2:]:
        p = Path(arg)
        lines.append(f"{_sha256_file(p)}  {p.name}")
    (out_dir / "checksums.txt").write_text("\n".join(lines) + "\n")
    print(f"wrote {out_dir / 'sbom.json'} ({len(sbom['components'])} components)")
    print(f"wrote {out_dir / 'checksums.txt'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
