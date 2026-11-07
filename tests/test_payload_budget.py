"""Payload budget ratchet — ADR-003 revisit trigger (NXT-3).

Measures the serialized response envelope for every capped analytics
path via `tools/benchmark.py::run_payloads` and asserts the ADR-003
trigger (any single IPC response >100 KB = 100*1024 B) is NOT met.
If this test ever fails, the trigger has fired: Arrow IPC (G5)
becomes the next card — do not silence the failure by raising the
threshold without an ADR amendment.
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from tools.benchmark import TRIGGER_BYTES, run_payloads


def test_payload_trigger_not_met() -> None:
    """Full capped-path scan stays under the ADR-003 100 KB trigger."""
    result = run_payloads(2500)  # device: >2000 rows exercises scatter cap
    assert result["trigger_bytes"] == TRIGGER_BYTES == 100 * 1024
    assert result["trigger_met"] is False, (
        f"ADR-003 trigger FIRED: max payload "
        f"{result['max_payload_bytes']} B > {TRIGGER_BYTES} B — "
        "Arrow IPC (G5) is now the next card"
    )
    assert result["max_payload_bytes"] <= TRIGGER_BYTES


def test_payload_scan_covers_capped_paths() -> None:
    """The scan must actually exercise the largest capped paths."""
    result = run_payloads(2500)
    names = {e["name"] for e in result["entries"]}
    for required in (
        "dataset.bivariate.run(scatter≤2000)",
        "dataset.preview(limit=200)",
        "dataset.histogram.run",
        "dataset.quality.run",
        "dataset.readiness.run",
    ):
        assert required in names, f"missing measured path: {required}"
    assert result["entries"] == sorted(
        result["entries"], key=lambda e: e["bytes"], reverse=True
    )
