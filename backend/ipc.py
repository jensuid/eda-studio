"""IPC bridge — exactly 4 methods (ES-8.6, IPC-009: no FastAPI in MVP).

Default-deny (SEC-004): only registered commands/queries are dispatchable;
anything else is rejected with PERMISSION_DENIED. Domain exceptions are
translated to ErrorContract at this boundary (ES-13.2). This class is the
object PyWebView exposes as `window.pywebview` api in the desktop shell.
"""
from __future__ import annotations

from typing import Any

from pydantic import BaseModel, ValidationError

from backend.application import (
    ConflictError,
    NotFoundError,
    UnsupportedFormatError,
    WorkbenchService,
)
from backend.application import (
    ValidationError as ServiceValidationError,
)
from backend.contracts import (
    CleaningPreviewPayload,
    CleaningRunPayload,
    CreateProjectPayload,
    DatasetActivatePayload,
    ErrorCode,
    ErrorContract,
    GetDatasetPreviewPayload,
    GetDatasetProfilePayload,
    GetProfileByIdPayload,
    ImportDatasetPayload,
    ListProfilesPayload,
    ListSnapshotsPayload,
    OpenProjectPayload,
    ProtocolInfo,
    Request,
    Response,
    RunHistogramPayload,
    RunProfilePayload,
    RunQualityPayload,
)
from backend.execution import JobManager

# Registry: command/query name -> (payload model, handler kind)
_COMMANDS: dict[str, type[BaseModel]] = {
    "project.create": CreateProjectPayload,
    "dataset.import": ImportDatasetPayload,
    "dataset.profile.run": RunProfilePayload,  # G6: job-wrapped profiling
    "dataset.histogram.run": RunHistogramPayload,  # M2 histogram
    "dataset.quality.run": RunQualityPayload,  # M2 quality
    "dataset.cleaning.run": CleaningRunPayload,
    "dataset.snapshot.activate": DatasetActivatePayload,
}
_QUERIES: dict[str, type[BaseModel]] = {
    "project.open": OpenProjectPayload,
    "dataset.preview": GetDatasetPreviewPayload,
    "dataset.profile": GetDatasetProfilePayload,  # M2 slice (compat)
    "dataset.profile.get": GetProfileByIdPayload,  # G6 history
    "dataset.profiles.list": ListProfilesPayload,  # G6 history
    "dataset.snapshots.list": ListSnapshotsPayload,  # G6
    "dataset.cleaning.preview": CleaningPreviewPayload,
}


def _error(code: ErrorCode, message: str, correlation_id: str | None) -> Response:
    return Response(ok=False, error=ErrorContract(code=code, message=message,
                                                  correlation_id=correlation_id),
                    correlation_id=correlation_id)


class Bridge:
    def __init__(self, service: WorkbenchService, jobs: JobManager) -> None:
        self.service = service
        self.jobs = jobs

    # -- the 4 bridge methods --------------------------------------------
    def get_protocol_info(self) -> dict[str, Any]:
        return ProtocolInfo(commands=sorted(_COMMANDS), queries=sorted(_QUERIES)).model_dump(mode="json")

    def execute_command(self, request: Request | dict) -> dict[str, Any]:
        req = Request(**request) if isinstance(request, dict) else request
        if req.command not in _COMMANDS:
            return _error(ErrorCode.PERMISSION_DENIED,
                          f"command not allowed: {req.command}", req.correlation_id).model_dump(mode="json")
        try:
            payload = _COMMANDS[req.command](**req.payload)
        except ValidationError as exc:
            return _error(ErrorCode.VALIDATION, str(exc), req.correlation_id).model_dump(mode="json")
        try:
            if req.command == "project.create":
                result = self.service.create_project(payload.name, payload.project_id)
            elif req.command == "dataset.import":
                captured: list = []

                def _import() -> None:
                    captured.append(self.service.import_dataset(
                        payload.project_id, payload.source_path, payload.dataset_name))

                self.jobs.run(
                    req.command, _import,
                    correlation_id=req.correlation_id or req.request_id,
                )
                result = captured[0]
            elif req.command == "dataset.profile.run":
                # service.run_profile owns the JobManager lifecycle (SYS-015)
                result = self.service.run_profile(
                    payload.project_id, payload.dataset_id,
                    req.correlation_id or req.request_id)
            elif req.command == "dataset.histogram.run":
                result = self.service.run_histogram(
                    payload.project_id, payload.dataset_id,
                    payload.column_name,
                    req.correlation_id or req.request_id)
            elif req.command == "dataset.quality.run":
                # service.run_quality owns the JobManager lifecycle (SYS-015)
                result = self.service.run_quality(
                    payload.project_id, payload.dataset_id,
                    req.correlation_id or req.request_id)
            elif req.command == "dataset.cleaning.run":
                # service.run_cleaning owns the JobManager lifecycle (SYS-015)
                result = self.service.run_cleaning(
                    payload.project_id, payload.dataset_id,
                    payload.operation, payload.columns,
                    payload.strategy, payload.constant_value,
                    payload.expected_parent_fingerprint,
                    req.correlation_id or req.request_id)
            elif req.command == "dataset.snapshot.activate":
                # service.activate_snapshot changes the active snapshot for a dataset
                result = self.service.activate_snapshot(payload.project_id, payload.dataset_id, payload.snapshot_id)
            else:  # pragma: no cover — guarded by registry check above
                raise AssertionError(req.command)
        except NotFoundError as exc:
            return _error(ErrorCode.NOT_FOUND, str(exc), req.correlation_id).model_dump(mode="json")
        except ServiceValidationError as exc:
            return _error(ErrorCode.VALIDATION, str(exc), req.correlation_id).model_dump(mode="json")
        except ConflictError as exc:
            return _error(ErrorCode.CONFLICT, str(exc), req.correlation_id).model_dump(mode="json")
        except UnsupportedFormatError as exc:
            return _error(ErrorCode.UNSUPPORTED_FORMAT, str(exc), req.correlation_id).model_dump(mode="json")
        except Exception as exc:  # noqa: BLE001 — boundary translation
            return _error(ErrorCode.INTERNAL, f"internal error: {exc}", req.correlation_id).model_dump(mode="json")
        return Response(ok=True, data=result.model_dump(mode="json") if hasattr(result, "model_dump") else result,
                        correlation_id=req.correlation_id).model_dump(mode="json")

    def execute_query(self, request: Request | dict) -> dict[str, Any]:
        req = Request(**request) if isinstance(request, dict) else request
        if req.command not in _QUERIES:
            return _error(ErrorCode.PERMISSION_DENIED,
                          f"query not allowed: {req.command}", req.correlation_id).model_dump(mode="json")
        try:
            payload = _QUERIES[req.command](**req.payload)
        except ValidationError as exc:
            return _error(ErrorCode.VALIDATION, str(exc), req.correlation_id).model_dump(mode="json")
        try:
            if req.command == "project.open":
                result = self.service.open_project(payload.project_id)
            elif req.command == "dataset.preview":
                result = self.service.get_preview(
                    payload.project_id, payload.dataset_id, payload.limit)
            elif req.command == "dataset.profile":
                result = self.service.get_profile(
                    payload.project_id, payload.dataset_id)
            elif req.command == "dataset.profile.get":
                result = self.service.get_profile_by_id(
                    payload.project_id, payload.profile_id)
            elif req.command == "dataset.profiles.list":
                result = self.service.list_profiles(
                    payload.project_id, payload.dataset_id)
            elif req.command == "dataset.snapshots.list":
                result = self.service.list_snapshots(payload.project_id)
            elif req.command == "dataset.cleaning.preview":
                result = self.service.cleaning_preview(payload)
            else:  # pragma: no cover
                raise AssertionError(req.command)
        except NotFoundError as exc:
            return _error(ErrorCode.NOT_FOUND, str(exc), req.correlation_id).model_dump(mode="json")
        except ServiceValidationError as exc:
            return _error(ErrorCode.VALIDATION, str(exc), req.correlation_id).model_dump(mode="json")
        except Exception as exc:  # noqa: BLE001
            return _error(ErrorCode.INTERNAL, f"internal error: {exc}", req.correlation_id).model_dump(mode="json")
        return Response(ok=True, data=result.model_dump(mode="json"),
                        correlation_id=req.correlation_id).model_dump(mode="json")

    def get_events(self, since_seq: int = 0) -> list[dict[str, Any]]:
        return [e.model_dump(mode="json") for e in self.jobs.events_since(since_seq)]

def make_bridge(root: str) -> Bridge:
    """Composition Root (SYS-010): wire store -> jobs -> service -> bridge."""
    from pathlib import Path

    from backend.persistence import Store

    store = Store(Path(root))
    jobs = JobManager(store)
    service = WorkbenchService(store, jobs)
    return Bridge(service, jobs)
