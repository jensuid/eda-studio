"""Performance envelope benchmark — Doc16 M3 P2.

Measures end-to-end latency of the core MVP workflow on a synthetic
dataset: project create → CSV import → profiling → histogram → report.

Also measures IPC payload sizes (NXT-3, prerequisite for G5 / ADR-003
Arrow): for every command/query exercised, the size in bytes of the
full serialized response envelope (what crosses the pywebview
boundary). A separate payload-only run can be invoked:

    .venv/bin/python tools/benchmark.py --payloads [rows] [out_json]

which covers every capped analytics path (preview ≤200, histogram
≤30 bins, scatter ≤2000, quality, readiness, cleaning preview,
export, provenance, chart specs, plans) and reports the largest /
trigger status against the ADR-003 revisit trigger: any aggregate
payload over 100 KB in one IPC response.

Usage:
    .venv/bin/python tools/benchmark.py [rows] [out_json]
    .venv/bin/python tools/benchmark.py --payloads [rows] [out_json]

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


def _q(bridge, command, payload, rid="q1"):
    res = bridge.execute_query(
        {"request_id": rid, "command": command, "payload": payload})
    if not res["ok"]:
        raise RuntimeError(f"{command} failed: {res['error']}")
    return res["data"]


def _env_bytes(res: dict) -> int:
    """Size of the full serialized response envelope (bytes on the wire)."""
    return len(json.dumps(res, ensure_ascii=False, default=str).encode("utf-8"))


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


TRIGGER_BYTES = 100 * 1024  # ADR-003 revisit trigger (aggregate payload)


def run_payloads(rows: int) -> dict:
    """Measure serialized-response bytes for every capped analytics path.

    Each entry measures the full `Response` envelope (exactly what
    crosses the pywebview boundary). Scenario = worst-case capped
    payloads: preview at limit 200, histogram on a 30-bin cap,
    scatter at the 1500-point cap, quality/readiness aggregates,
    cleaning preview, export, report, and every list/get query
    (snapshots, provenance, profiles, findings, chart specs, plans).
    """
    import tempfile
    root = Path(tempfile.mkdtemp(prefix="payload_bench_"))
    bridge = make_bridge(root)
    csv_path = root / "synth.csv"
    _make_csv(rows, csv_path)

    entries: list[dict] = []

    def measure(name: str, fn, *args) -> dict:
        res = fn(*args)
        size = _env_bytes(res)
        entries.append({"name": name, "bytes": size})
        return res

    def raw_cmd(command, payload, rid="p1"):
        res = bridge.execute_command(
            {"request_id": rid, "command": command, "payload": payload})
        if not res["ok"]:
            raise RuntimeError(f"{command} failed: {res['error']}")
        return res

    def raw_q(command, payload, rid="p2"):
        res = bridge.execute_query(
            {"request_id": rid, "command": command, "payload": payload})
        if not res["ok"]:
            raise RuntimeError(f"{command} failed: {res['error']}")
        return res

    project = measure("project.create", raw_cmd, "project.create",
                      {"name": "bench"})["data"]
    pid = project["project_id"]
    ds = measure("dataset.import", raw_cmd, "dataset.import",
                 {"project_id": pid, "source_path": str(csv_path),
                  "dataset_name": "synth"})["data"]
    did = ds["dataset_id"]
    out_file = root / "export.csv"

    measure("project.open", raw_q, "project.open", {"project_id": pid})
    measure("dataset.preview(limit=200)", raw_q, "dataset.preview",
            {"project_id": pid, "dataset_id": did, "limit": 200})
    prof = measure("dataset.profile.run", raw_cmd, "dataset.profile.run",
                   {"project_id": pid, "dataset_id": did})["data"]
    # Profile run is job-wrapped: fetch stored profile via queries.
    profiles = measure("dataset.profiles.list", raw_q, "dataset.profiles.list",
                       {"project_id": pid, "dataset_id": did})["data"]
    profile_id = prof.get("profile_id") if isinstance(prof, dict) else None
    if not profile_id and isinstance(profiles, dict):
        items = profiles.get("profiles") or []
        if items:
            profile_id = items[0].get("profile_id")
    if profile_id:
        measure("dataset.profile.get", raw_q, "dataset.profile.get",
                {"project_id": pid, "profile_id": profile_id})
    measure("dataset.snapshots.list", raw_q, "dataset.snapshots.list",
            {"project_id": pid})
    measure("dataset.provenance", raw_q, "dataset.provenance",
            {"project_id": pid, "dataset_id": did})
    measure("dataset.histogram.run", raw_cmd, "dataset.histogram.run",
            {"project_id": pid, "dataset_id": did, "column_name": "x"})
    measure("dataset.bivariate.run(scatter≤1500)", raw_cmd,
            "dataset.bivariate.run",
            {"project_id": pid, "dataset_id": did, "column_a": "x", "column_b": "y"})
    measure("dataset.quality.run", raw_cmd, "dataset.quality.run",
            {"project_id": pid, "dataset_id": did})
    measure("dataset.readiness.run", raw_cmd, "dataset.readiness.run",
            {"project_id": pid, "dataset_id": did})
    measure("dataset.cleaning.preview", raw_q, "dataset.cleaning.preview",
            {"project_id": pid, "dataset_id": did,
             "operation": "drop_missing", "columns": ["x"]})
    measure("dataset.export(csv)", raw_cmd, "dataset.export",
            {"project_id": pid, "dataset_id": did, "format": "csv",
             "dest_path": str(out_file)})
    measure("dataset.report.generate", raw_cmd, "dataset.report.generate",
            {"project_id": pid, "dataset_id": did})
    measure("insight.findings.list", raw_q, "insight.findings.list",
            {"project_id": pid, "dataset_id": did})
    measure("insight.hypotheses.list", raw_q, "insight.hypotheses.list",
            {"project_id": pid, "dataset_id": did})
    measure("chart.spec.list", raw_q, "chart.spec.list",
            {"project_id": pid, "dataset_id": did})
    measure("plan.list", raw_q, "plan.list",
            {"project_id": pid, "dataset_id": did})

    entries.sort(key=lambda e: e["bytes"], reverse=True)
    max_bytes = entries[0]["bytes"] if entries else 0
    return {
        "rows": rows,
        "trigger_bytes": TRIGGER_BYTES,
        "entries": entries,
        "max_payload_bytes": max_bytes,
        "trigger_met": max_bytes > TRIGGER_BYTES,
    }


def main(argv: list[str]) -> int:
    args = argv[1:]
    payloads_mode = args and args[0] == "--payloads"
    if payloads_mode:
        args = args[1:]
    rows = int(args[0]) if args else 10_000
    out = Path(args[1]) if len(args) > 1 else Path(
        "dist/payload.json" if payloads_mode else "dist/perf.json")
    result = run_payloads(rows) if payloads_mode else run(rows)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(result, indent=2))
    print(json.dumps(result, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
