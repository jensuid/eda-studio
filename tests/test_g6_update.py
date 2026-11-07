"""G6-3 update channel: app info + version check (no network in tests)."""

from __future__ import annotations

import json

from backend import __version__ as APP_VERSION
from backend.app_update import app_info, check_for_update, is_newer

GITHUB_LATEST = "https://api.github.com/repos/jensuid/eda-studio/releases/latest"


def test_app_info_reports_version_platform_and_feed():
    info = app_info()
    assert info["version"] == APP_VERSION
    assert info["platform"]
    assert info["update_feed"] == GITHUB_LATEST


def test_check_for_update_detects_newer_without_network():
    fetcher = lambda url, timeout: json.dumps({"tag_name": "v99.0.0"}).encode()
    result = check_for_update("https://example.invalid/feed.json", fetcher=fetcher)
    assert result["current_version"] == APP_VERSION
    assert result["latest_version"] == "v99.0.0"
    assert result["update_available"] is True
    assert result["feed_url"] == "https://example.invalid/feed.json"
    assert result["checked_at"]


def test_check_for_update_same_version_is_not_newer():
    fetcher = lambda url, timeout: json.dumps({"version": APP_VERSION}).encode()
    result = check_for_update(fetcher=fetcher)
    assert result["latest_version"] == APP_VERSION
    assert result["update_available"] is False


def test_check_for_update_fetch_failure_degrades_gracefully():
    def failing_fetcher(url: str, timeout: float) -> bytes:
        raise OSError("offline")

    result = check_for_update("https://example.invalid/feed.json", fetcher=failing_fetcher)
    assert result["latest_version"] is None
    assert result["update_available"] is False
    assert result["feed_url"] == "https://example.invalid/feed.json"


def test_check_for_update_malformed_body_degrades_gracefully():
    fetcher = lambda url, timeout: b"not json"
    result = check_for_update(fetcher=fetcher)
    assert result["latest_version"] is None
    assert result["update_available"] is False


def test_semver_compare_rules():
    assert is_newer("v0.2.0", "0.1.0") is True
    assert is_newer("0.1.0", "0.1.0") is False
    assert is_newer("0.0.9", "0.1.0") is False
    assert is_newer("1.0.0", "0.99.99") is True
    assert is_newer("not-a-version", "0.1.0") is False


def test_app_ipc_info_and_update_check_commands(bridge):
    res = bridge.execute_query({"request_id": "r-ai", "command": "app.info", "payload": {}})
    assert res["ok"], res
    assert res["data"]["version"] == APP_VERSION

    # A malformed local feed must never break the command.
    res = bridge.execute_command({
        "request_id": "r-ac", "command": "app.update.check",
        "payload": {"feed_url": "https://127.0.0.1:9/feed"},
    })
    assert res["ok"], res
    assert res["data"]["current_version"] == APP_VERSION
    assert res["data"]["update_available"] is False
