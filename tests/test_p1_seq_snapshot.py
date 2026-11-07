"""P1-2: durable event seq (K4) + snapshot verify-on-read (K5)."""
import logging

import pytest

from backend.domain import fingerprint_bytes
from backend.execution import JobManager
from backend.persistence import ConflictError, Store

# -- K4: seq survives JobManager restart -------------------------------------

def test_seq_monotonic_across_restart(tmp_path):
    root = tmp_path / "p"
    store1 = Store(root)
    jobs1 = JobManager(store1)
    jobs1.run("test.cmd", lambda: None)
    seqs1 = [e.seq for e in jobs1.events_since(0)]
    assert seqs1 == sorted(seqs1) and len(set(seqs1)) == len(seqs1)
    store1.close()

    store2 = Store(root)
    jobs2 = JobManager(store2)
    jobs2.run("test.cmd", lambda: None)
    new_seqs = [e.seq for e in jobs2.events_since(max(seqs1))]
    assert new_seqs == sorted(new_seqs) and len(set(new_seqs)) == len(new_seqs)
    assert min(new_seqs) > max(seqs1), "restarted manager must not reuse seq"
    store2.close()


def test_seq_seeded_from_db_max(tmp_path):
    store = Store(tmp_path / "p")
    jobs = JobManager(store)
    jobs.run("test.cmd", lambda: None)
    assert store.max_event_seq() == max(e.seq for e in jobs.events_since(0))
    store.close()


# -- K5: verify-on-read -------------------------------------------------------

def _registered_store(root, snapshot_id="snap1", data=b"original-bytes"):
    store = Store(root)
    store.save_snapshot(snapshot_id, data)
    store.register_snapshot(
        snapshot_id, "ds1", fingerprint_bytes(b"source-bytes"), 1,
        ["a"], file_fingerprint=fingerprint_bytes(data),
    )
    return store


def _tamper(store, snapshot_id="snap1"):
    path = store.root / "snapshots" / f"{snapshot_id}.parquet"
    path.write_bytes(b"tampered-bytes")


def test_read_snapshot_strict_ok_when_untampered(tmp_path):
    store = _registered_store(tmp_path / "p")
    assert store.read_snapshot("snap1", strict=True) == b"original-bytes"
    store.close()


def test_read_snapshot_strict_rejects_tampered_file(tmp_path):
    store = _registered_store(tmp_path / "p")
    _tamper(store)
    with pytest.raises(ConflictError):
        store.read_snapshot("snap1", strict=True)
    store.close()


def test_read_snapshot_non_strict_warns_and_returns(tmp_path, caplog):
    store = _registered_store(tmp_path / "p")
    _tamper(store)
    with caplog.at_level(logging.WARNING, logger="backend.persistence"):
        data = store.read_snapshot("snap1", strict=False)
    assert data == b"tampered-bytes"
    assert any(r.levelno == logging.WARNING and "fingerprint mismatch" in r.message
               for r in caplog.records)
    store.close()


def test_read_snapshot_unregistered_skips_verify(tmp_path):
    store = Store(tmp_path / "p")
    store.save_snapshot("raw", b"unregistered-bytes")
    assert store.read_snapshot("raw", strict=True) == b"unregistered-bytes"
    store.close()
