"""Performance envelope benchmark — Doc16 M3 P2.

Measures end-to-end latency of the core MVP workflow on a synthetic
dataset: project create → CSV import → profiling → histogram → report.

Usage:
    .venv/bin/python tools/benchmark.py [rows] [out_json]

Envelope expectations (dev host, synthetic 4-col numeric+str data):
- import+profile for 10k rows: < 10 s
- histogram on 10k rows: < 3 s
Reported timings are evidence for Beta validation, not a hard gate.
"""
from __future__ import annotations

import csv
import json
import random
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.ipc import make_bridge


def _make_csv(rows: int, path: Path) -> None:
    rnd = random.Random(42)
    with open(path, "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["id", "x", "y", "cat"])
        for i in range(rows):
            w.writerow([i, rnd.random() * 100, rnd.random() * 100,
                        rnd.choice(["a", "b", "c"])])


def _cmd(bridge, command, payload, rid="b1"):
    res = bridge.execute_command(
        {"request_id": rid, "command": command, "payload": payload})
    if not res["ok"]:
        raise RuntimeError(f"{command} failed: {res['error']}")
    return res["data"]


def run(rows: int) -> dict:
    import tempfile
    root = Path(tempfile.mkdtemp(prefix="bench_"))
    bridge = make_bridge(root)
    csv_path = root / "synth.csv"
    _make_csv(rows, csv_path)

    timings: dict[str, float] = {}
    t0 = time.perf_counter()
    project = _cmd(bridge, "project.create", {"name": "bench"})
    timings["project_create"] = time.perf_counter() - t0

    t0 = time.perf_counter()
    ds = _cmd(bridge, "dataset.import",
              {"project_id": project["project_id"], "source_path": str(csv_path),
               "dataset_name": "synth"})
    timings["import"] = time.perf_counter() - t0

    t0 = time.perf_counter()
    _cmd(bridge, "dataset.profile.run",
         {"project_id": project["project_id"], "dataset_id": ds["dataset_id"]})
    timings["profile"] = time.perf_counter() - t0

    t0 = time.perf_counter()
    _cmd(bridge, "dataset.histogram.run",
         {"project_id": project["project_id"], "dataset_id": ds["dataset_id"],
          "column_name": "x"})
    timings["histogram"] = time.perf_counter() - t0

    t0 = time.perf_counter()
    _cmd(bridge, "dataset.report.generate",
         {"project_id": project["project_id"], "dataset_id": ds["dataset_id"]})
    timings["report"] = time.perf_counter() - t0

    return {"rows": rows, "timings": timings,
            "total": sum(timings.values())}


def main(argv: list[str]) -> int:
    rows = int(argv[1]) if len(argv) > 1 else 10_000
    out = Path(argv[2]) if len(argv) > 2 else Path("dist/perf.json")
    result = run(rows)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(result, indent=2))
    print(json.dumps(result, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
