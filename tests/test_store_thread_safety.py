"""Regression: Store must be usable across PyWebView worker threads."""
import tempfile
import threading
from pathlib import Path

from backend.domain import Project
from backend.persistence import Store


def test_store_cross_thread_access():
    store = Store(Path(tempfile.mkdtemp()))
    errors: list[BaseException] = []

    def work(i: int):
        try:
            store.save_project(Project(f"p-{i}", f"N{i}"))
            assert store.get_project(f"p-{i}") is not None
        except BaseException as exc:  # noqa: BLE001 - re-raised via errors list
            errors.append(exc)

    threads = [threading.Thread(target=work, args=(i,)) for i in range(5)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()
    assert errors == []
    store.close()
