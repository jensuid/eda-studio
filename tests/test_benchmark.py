"""M3 P2: performance envelope smoke — workflow runs within envelope (Doc16)."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from tools.benchmark import run


def test_benchmark_workflow_within_envelope():
    result = run(2_000)
    assert result["rows"] == 2_000
    for step in ("import", "profile", "histogram", "report"):
        assert step in result["timings"]
    # envelope generous for CI: workflow must be seconds, not minutes
    assert result["total"] < 60
    assert result["timings"]["histogram"] < 30
