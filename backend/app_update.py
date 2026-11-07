"""App info + update-channel check (G6-3).

The update channel is backed by GitHub Releases. ``check_for_update``
fetches a small JSON release feed (default: the GitHub Releases
"latest" API for ``jensuid/eda-studio``) and compares its tag against
the running app version with semver ordering.

``app.update.check`` is a *check*: it only reports whether a newer
version exists. Applying an update (download + swap) is deliberately
out of scope for 0.1.0 — Velopack packaging activates that path at
Stable (see docs/update-channel.md).

The feed URL comes from ``EDA_UPDATE_FEED`` (a release feed JSON or a
GitHub API URL) and can be overridden per call. The HTTP fetcher is
injectable so tests never touch the network.
"""
from __future__ import annotations

import json
import os
import platform
import urllib.request
from collections.abc import Callable
from datetime import UTC, datetime

from backend import __version__ as APP_VERSION

DEFAULT_FEED_URL = "https://api.github.com/repos/jensuid/eda-studio/releases/latest"
FEED_ENV_VAR = "EDA_UPDATE_FEED"
FETCH_TIMEOUT_SECONDS = 10

# Any callable returning the raw response body bytes for a URL.
Fetcher = Callable[[str, float], bytes]


def _default_fetcher(url: str, timeout: float) -> bytes:
    request = urllib.request.Request(url, headers={"Accept": "application/json"})
    with urllib.request.urlopen(request, timeout=timeout) as response:
        return response.read()


def feed_url(feed: str | None = None) -> str | None:
    """Effective feed URL: explicit arg > env > default."""
    return feed or os.environ.get(FEED_ENV_VAR) or DEFAULT_FEED_URL


def app_info() -> dict:
    return {
        "version": APP_VERSION,
        "platform": platform.system().lower(),
        "update_feed": feed_url(),
    }


def _parse_semver(version: str) -> tuple | None:
    """Parse ``v0.2.3`` / ``0.2.3-beta.1`` into a comparable tuple.

    Returns None for unparseable input (caller treats it as "not a
    valid version", never as a downgrade).
    """
    v = version.strip().lstrip("vV") or None
    if not v:
        return None
    core, _, prerelease = v.partition("-")
    parts = core.split(".")
    if len(parts) != 3 or not all(p.isdigit() for p in parts):
        return None
    core_tuple = tuple(int(p) for p in parts)
    # Release (no prerelease) sorts above any prerelease of same core.
    pre_tuple = (1,) if not prerelease else (0, prerelease)
    return (*core_tuple, pre_tuple)


def is_newer(latest: str, current: str) -> bool:
    """True iff ``latest`` is strictly newer than ``current``."""
    latest_parsed = _parse_semver(latest)
    current_parsed = _parse_semver(current)
    if latest_parsed is None or current_parsed is None:
        return False
    return latest_parsed > current_parsed


def _latest_version_from_feed(payload: bytes) -> str | None:
    """Extract the latest version string from a feed JSON body.

    Accepts the GitHub Releases "latest" shape (``tag_name``) and a
    minimal ``{"version": "0.2.0"}`` feed shape.
    """
    try:
        data = json.loads(payload)
    except (ValueError, UnicodeDecodeError):
        return None
    if not isinstance(data, dict):
        return None
    version = data.get("tag_name") or data.get("version")
    return str(version) if version else None


def check_for_update(feed: str | None = None, *,
                     fetcher: Fetcher | None = None) -> dict:
    """Check the release feed for a newer version. Never raises.

    Network failures, timeouts and malformed bodies degrade to
    ``latest_version=None, update_available=False`` — an update check
    must never break app startup or the calling command.
    """
    url = feed_url(feed)
    now = datetime.now(UTC).isoformat()
    result = {
        "current_version": APP_VERSION,
        "latest_version": None,
        "update_available": False,
        "feed_url": url,
        "checked_at": now,
    }
    if not url:
        return result
    try:
        body = (fetcher or _default_fetcher)(url, FETCH_TIMEOUT_SECONDS)
    except Exception:  # noqa: BLE001 — check must degrade gracefully
        return result
    latest = _latest_version_from_feed(body)
    if latest is None:
        return result
    result["latest_version"] = latest
    result["update_available"] = is_newer(latest, APP_VERSION)
    return result
