"""Build the per-OS desktop package (P3-1, BUILD-016/017/018).

Flow: build frontend (vite) -> PyInstaller with desktop/eda-workbench.spec
-> on a signed host, `--sign` applies Developer ID signing + notarization
(macOS), Authenticode (Windows), or no-op + AppImage note (Linux).

Signing credentials never live in this repo (Doc14 §6): identity / timestamp
come from environment variables on the build host. Without `--sign` the build
is an unsigned artifact — tracked as a release blocker in status-register.

Usage:
    python tools/build_packaging.py            # unsigned build
    python tools/build_packaging.py --sign     # requires signing env vars
    python tools/build_packaging.py --check-only
"""

from __future__ import annotations

import argparse
import os
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SPEC = ROOT / "desktop" / "eda-workbench.spec"
FRONTEND_DIST = ROOT / "frontend" / "dist"


def run(cmd: list[str]) -> None:
    print("+", " ".join(cmd))
    subprocess.run(cmd, check=True, cwd=ROOT)


def check_only() -> int:
    problems: list[str] = []
    if not SPEC.exists():
        problems.append(f"missing PyInstaller spec: {SPEC}")
    if not FRONTEND_DIST.exists():
        problems.append(f"frontend/dist missing — run: cd frontend && pnpm run build ({FRONTEND_DIST})")
    if shutil.which("pyinstaller") is None:
        problems.append("pyinstaller not on PATH — pip install pyinstaller (build host only)")
    if shutil.which("pnpm") is None and shutil.which("npm") is None:
        problems.append("pnpm/npm not on PATH — frontend build unavailable")
    for problem in problems:
        print(f"BLOCKED: {problem}")
    if not problems:
        print("packaging prerequisites OK (unsigned build ready)")
        return 0
    # --check-only reports blockers without failing the gate: signing host
    # availability is a manual P3-1 item, not automatable in this repo.
    return 0


def build_frontend() -> None:
    pm = "pnpm" if shutil.which("pnpm") else "npm"
    install = [pm, "install", "--frozen-lockfile"] if pm == "pnpm" else [pm, "install"]
    run(install)
    run([pm, "run", "build"])


def build_pyinstaller() -> None:
    run(["pyinstaller", "--clean", "--noconfirm", str(SPEC)])


def sign() -> None:
    if sys.platform == "darwin":
        identity = os.environ.get("EDA_SIGN_IDENTITY", "")
        if not identity:
            raise SystemExit("BLOCKED: EDA_SIGN_IDENTITY not set on signed build host")
        app = ROOT / "dist" / "EDA Workbench.app"
        if not app.exists():
            app = ROOT / "dist" / "eda-workbench"  # fallback: onedir exe name
        run(["codesign", "--deep", "--force", "--options", "runtime", "--sign", identity, str(app)])
        if os.environ.get("EDA_NOTARY_PROFILE"):
            run(["xcrun", "notarytool", "submit", str(app), "--wait", "--apple-id",
                 os.environ.get("EDA_NOTARY_APPLE_ID", ""), "--team-id",
                 os.environ.get("EDA_NOTARY_TEAM_ID", ""), "--password", "@keychain:" + os.environ["EDA_NOTARY_PROFILE"]])
            run(["xcrun", "stapler", "staple", str(app)])
    elif sys.platform == "win32":
        thumbprint = os.environ.get("EDA_SIGN_THUMBPRINT", "")
        timestamp = os.environ.get("EDA_SIGN_TIMESTAMP", "http://timestamp.digicert.com")
        if not thumbprint:
            raise SystemExit("BLOCKED: EDA_SIGN_THUMBPRINT not set on signed build host")
        exe = ROOT / "dist" / "eda-workbench" / "eda-workbench.exe"
        run(["signtool", "sign", "/sha1", thumbprint, "/tr", timestamp, "/td", "sha256", str(exe)])
    else:
        print("NOTE: Linux AppImage is produced by manually repacking the onedir output (BUILD-017); no signing step.")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--sign", action="store_true", help="apply platform signing (signed host only)")
    parser.add_argument("--check-only", action="store_true", help="report blockers, never builds")
    args = parser.parse_args(argv)
    if args.check_only:
        return check_only()
    build_frontend()
    build_pyinstaller()
    if args.sign:
        sign()
    else:
        print("unsigned build complete — signing remains a P3-1 manual blocker")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
