import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from backend.ipc import make_bridge

FIXTURE_CSV = Path(__file__).parent / "fixtures" / "sample.csv"


@pytest.fixture()
def bridge(tmp_path):
    b = make_bridge(str(tmp_path / "proj"))
    # Test-harness convenience: fixtures + pytest tmp are treated as
    # dialog-approved (existing tests supply absolute paths outside the
    # project root). P4-2 tests build their own bridge without this.
    b.service.authorize_root(str(FIXTURE_CSV.parent))
    b.service.authorize_root(str(tmp_path))
    return b


@pytest.fixture()
def project_id(bridge):
    res = bridge.execute_command({"request_id": "r-1", "command": "project.create",
                                  "payload": {"name": "Demo"}})
    assert res["ok"], res
    return res["data"]["project_id"]
