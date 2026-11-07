"""Desktop shell (PyWebView host, BUILD-003/024/025).

Exposes ONLY the 4 bridge methods to the webview (ES-8.6). Run:
    pip install pywebview && python desktop/main.py
"""
from __future__ import annotations

import atexit
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from backend.ipc import make_bridge  # noqa: E402

DATA_ROOT = Path.home() / ".eda-workbench" / "projects"


def _frontend_url() -> str:
    """Absolute file URL for the bundled frontend.

    A relative "../frontend/dist/index.html" only worked when the process was
    started from the repo root (dev). In the frozen .app the working directory
    is unrelated to the bundle, so WebView resolved it against the wrong
    base and showed a 404. sys._MEIPASS points at the onedir resource root
    (Contents/Frameworks) in the bundle; fall back to the repo layout in dev.
    """
    candidates: list[Path] = []
    meipass = getattr(sys, "_MEIPASS", None)
    if meipass:
        candidates.append(Path(meipass) / "frontend" / "dist" / "index.html")
    exe_dir = Path(sys.executable).resolve().parent
    candidates.extend([
        exe_dir / ".." / "Resources" / "frontend" / "dist" / "index.html",
        exe_dir / ".." / "Frameworks" / "frontend" / "dist" / "index.html",
        exe_dir / "frontend" / "dist" / "index.html",
    ])
    candidates.append(Path(__file__).resolve().parents[1] / "frontend" / "dist" / "index.html")
    for candidate in candidates:
        if candidate.exists():
            return candidate.as_uri()
    return "../frontend/dist/index.html"


def main() -> None:
    import webview  # type: ignore

    bridge = make_bridge(str(DATA_ROOT))
    # G6-1: any normal interpreter exit records that shutdown was clean.
    atexit.register(bridge.service.store.mark_clean_exit)
    try:
        webview.create_window("EDA Workbench", url=_frontend_url(), js_api=bridge)
        webview.start()
    finally:
        bridge.service.store.mark_clean_exit()


if __name__ == "__main__":
    main()
