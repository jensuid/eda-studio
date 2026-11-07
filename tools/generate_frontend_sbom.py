"""Frontend SBOM generator — Doc14 BUILD-014, Doc16 M3 P2, P0-1.

Reads `frontend/pnpm-lock.yaml` (lockfileVersion 9) and emits:
- `frontend-sbom.json`: CycloneDX-flavoured minimal BOM (name/version per
  package resolved in the lockfile)

Mirrors `tools/generate_sbom.py` (backend) so CI can produce an SBOM
for both stacks. No third-party deps: the `packages:` section keys are
`name@version` and are parsed with a regex.

Usage:
    .venv/bin/python tools/generate_frontend_sbom.py [out_dir]
"""
from __future__ import annotations

import json
import re
import sys
from datetime import UTC, datetime
from pathlib import Path

_PACKAGE_KEY = re.compile(r"^  '?(?P<entry>[^'\n]+@[^'\n]+)'?:\s*$")


def _split_entry(entry: str) -> tuple[str, str] | None:
    """Split `name@version` (scoped or unscoped) into (name, version)."""
    if "@" not in entry:
        return None
    name, sep, version = entry.rpartition("@")
    if not sep or not name or not version:
        return None
    return name, version


def build_sbom(lock_path: Path) -> dict:
    text = lock_path.read_text()
    packages: list[dict] = []
    seen: set[tuple[str, str]] = set()
    in_packages = False
    for line in text.splitlines():
        if line == "packages:":
            in_packages = True
            continue
        if in_packages and line and not line.startswith((" ", "'", '"')):
            # reached a new top-level section
            break
        if not in_packages:
            continue
        m = _PACKAGE_KEY.match(line)
        if not m:
            continue
        split = _split_entry(m.group("entry"))
        if split is None:
            continue
        name, version = split
        # versions may carry peer suffixes e.g. 5.106.1(react@18.3.1)
        version = version.split("(")[0]
        key = (name, version)
        if key in seen:
            continue
        seen.add(key)
        packages.append({"name": name, "version": version})
    return {
        "bomFormat": "CycloneDX",
        "specVersion": "1.5",
        "serialNumber": "urn:uuid:00000000-0000-0000-0000-000000000000",
        "metadata": {
            "timestamp": datetime.now(UTC).isoformat(),
            "tools": [{"vendor": "eda-workbench", "name": "generate_frontend_sbom.py"}],
            "component": {"type": "application", "name": "eda-workbench-frontend"},
        },
        "components": sorted(packages, key=lambda p: str(p["name"])),
    }


def main(argv: list[str]) -> int:
    root = Path(__file__).resolve().parent.parent
    out_dir = Path(argv[1]) if len(argv) > 1 else root / "dist"
    out_dir.mkdir(parents=True, exist_ok=True)

    sbom = build_sbom(root / "frontend" / "pnpm-lock.yaml")
    (out_dir / "frontend-sbom.json").write_text(json.dumps(sbom, indent=2))
    print(f"wrote {out_dir / 'frontend-sbom.json'} ({len(sbom['components'])} components)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
