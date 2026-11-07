# -*- mode: python ; coding: utf-8 -*-
"""PyInstaller spec — EDA Workbench desktop (BUILD-002/003/016/017).

Build:  python tools/build_packaging.py [--sign]
Entry point: desktop/main.py. Frontend assets are bundled from frontend/dist
(BUILD-003: served through PyWebView, never file://). The bundle contains an
application-controlled Python runtime and no global Python/Node is required
(BUILD-015, ES-14.2). Per-OS flags branch below on sys.platform:
  darwin  -> onefile windowed .app via BUNDLE (Developer ID sign + notarize
             are applied by tools/build_packaging.py --sign on a signed host;
             unsigned builds stay `manual` per P3-1).
  win32   -> onedir console=False (.exe installer finished by Inno Setup in
             tools/build_packaging.py on a signed host, BUILD-017).
  linux   -> onedir (AppImage finished by tools/build_packaging.py, BUILD-017).
"""

import sys
from pathlib import Path

ROOT = Path(SPECPATH).resolve().parent  # noqa: F821 — PyInstaller global
ENTRY = str(ROOT / "desktop" / "main.py")
FRONTEND_DIST = str(ROOT / "frontend" / "dist")

datas = [(FRONTEND_DIST, "frontend/dist")]

hiddenimports = [
    "backend",
    "backend.contracts",
    "backend.domain",
    "backend.application",
    "backend.execution",
    "backend.persistence",
    "backend.ipc",
    "backend.ingestion",
    "backend.analytics",
    "backend.backup_restore",
    "webview",
    "pydantic",
    "pyarrow",
    "openpyxl",
]

block_cipher = None

a = Analysis(  # noqa: F821
    [ENTRY],
    pathex=[str(ROOT)],
    binaries=[],
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=["pytest", "ruff", "pyright", "playwright"],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)  # noqa: F821

exe = EXE(  # noqa: F821
    pyz,
    a.scripts,
    exclude_binaries=(sys.platform != "win32"),
    name="eda-workbench",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,  # signing is applied post-build by tools/build_packaging.py
    entitlements_file=None,
)

if sys.platform == "darwin":
    app = BUNDLE(  # noqa: F821
        exe,
        name="EDA Workbench.app",
        icon=None,
        bundle_identifier="com.jensuid.eda-workbench",
        info_plist={
            "NSHighResolutionCapable": True,
            "NSPrincipalClass": "NSApplication",
        },
    )
elif sys.platform == "win32":
    coll = COLLECT(  # noqa: F821
        exe,
        a.binaries,
        a.zipfiles,
        a.datas,
        strip=False,
        upx=False,
        upx_exclude=[],
        name="eda-workbench",
    )
else:
    coll = COLLECT(  # noqa: F821
        exe,
        a.binaries,
        a.zipfiles,
        a.datas,
        strip=False,
        upx=False,
        upx_exclude=[],
        name="eda-workbench",
    )
