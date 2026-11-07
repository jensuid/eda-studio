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


def main() -> None:
    import webview  # type: ignore

    bridge = make_bridge(str(DATA_ROOT))
    # G6-1: any normal interpreter exit records that shutdown was clean.
    atexit.register(bridge.service.store.mark_clean_exit)
    try:
        webview.create_window("EDA Workbench", url="../frontend/dist/index.html", js_api=bridge)
        webview.start()
    finally:
        bridge.service.store.mark_clean_exit()


if __name__ == "__main__":
    main()
