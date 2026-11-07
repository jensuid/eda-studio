"""IPC bridge — exactly 4 methods (ES-8.6, IPC-009: no FastAPI in MVP).

Default-deny (SEC-004): only registered commands/queries are dispatchable;
anything else is rejected with PERMISSION_DENIED. Domain exceptions are
translated to ErrorContract at this boundary (ES-13.2). This class is the
object PyWebView exposes as `window.pywebview` api in the desktop shell.
"""
from __future__ import annotations

import logging
from typing import Any, cast

from pydantic import BaseModel, ValidationError

log = logging.getLogger(__name__)

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
    ApprovePlanPayload,
    BackupCreatePayload,
    BackupRestorePayload,
    CleaningPreviewPayload,
    CleaningRunPayload,
    CreateFindingPayload,
    CreateHypothesisPayload,
    CreatePlanPayload,
    CreateProjectPayload,
    DatasetActivatePayload,
    DiagnosticCreatePayload,
    DialogPickFilePayload,
    DialogPickFileRecord,
    ErrorCode,
    ErrorContract,
    ExecutePlanPayload,
    ExportDatasetPayload,
    GetChartSpecPayload,
    GetDatasetPreviewPayload,
    GetDatasetProfilePayload,
    GetDatasetProvenancePayload,
    GetPlanPayload,
    GetProfileByIdPayload,
    ImportDatasetPayload,
    ListChartSpecsPayload,
    ListInsightsPayload,
    ListPlansPayload,
    ListProfilesPayload,
    ListSnapshotsPayload,
    OpenProjectPayload,
    ProtocolInfo,
    Request,
    Response,
    RunBivariatePayload,
    RunHistogramPayload,
    RunPdfPayload,
    RunProfilePayload,
    RunQualityPayload,
    RunReadinessPayload,
    RunReportPayload,
    SaveChartSpecPayload,
    TransitionFindingPayload,
    TransitionHypothesisPayload,
)
from backend.execution import JobManager

# Registry: command/query name -> (payload model, handler kind)
_COMMANDS: dict[str, type[BaseModel]] = {
    "project.create": CreateProjectPayload,
    "dataset.import": ImportDatasetPayload,
    "dataset.profile.run": RunProfilePayload,  # G6: job-wrapped profiling
    "dataset.histogram.run": RunHistogramPayload,  # M2 histogram
    "dataset.quality.run": RunQualityPayload,  # M2 quality
    "dataset.readiness.run": RunReadinessPayload,  # G3 readiness
    "dataset.bivariate.run": RunBivariatePayload,  # M2 bivariate
    "dataset.report.generate": RunReportPayload,  # M3 reporting
    "dataset.pdf.generate": RunPdfPayload,  # M3 PDF
    "dataset.cleaning.run": CleaningRunPayload,
    "dataset.snapshot.activate": DatasetActivatePayload,
    "project.backup.create": BackupCreatePayload,  # M3 P0 backup (Doc04 §12)
    "project.diagnostic.create": DiagnosticCreatePayload,  # M3 P2 bundle (Doc15 §10)
    "project.restore": BackupRestorePayload,  # M3 P0 restore to new root
    "dataset.export": ExportDatasetPayload,  # M3 P0 dataset export CSV/Parquet
    "insight.finding.create": CreateFindingPayload,  # M3 P1 insights
    "insight.finding.transition": TransitionFindingPayload,
    "insight.hypothesis.create": CreateHypothesisPayload,
    "insight.hypothesis.transition": TransitionHypothesisPayload,
    "chart.spec.save": SaveChartSpecPayload,  # NXT-1 chart-spec persistence
    "plan.create": CreatePlanPayload,  # NXT-2 analysis plan
    "plan.approve": ApprovePlanPayload,  # NXT-2
    "plan.execute": ExecutePlanPayload,  # NXT-2
    "dialog.pick_file": DialogPickFilePayload,  # P2-3 native file dialog
}
_QUERIES: dict[str, type[BaseModel]] = {
    "project.open": OpenProjectPayload,
    "dataset.preview": GetDatasetPreviewPayload,
    "dataset.profile": GetDatasetProfilePayload,  # M2 slice (compat)
    "dataset.profile.get": GetProfileByIdPayload,  # G6 history
    "dataset.profiles.list": ListProfilesPayload,  # G6 history
    "dataset.snapshots.list": ListSnapshotsPayload,  # G6
    "dataset.provenance": GetDatasetProvenancePayload,  # M3 P1 SEC-012
    "insight.findings.list": ListInsightsPayload,
    "insight.hypotheses.list": ListInsightsPayload,
    "chart.spec.get": GetChartSpecPayload,  # NXT-1
    "chart.spec.list": ListChartSpecsPayload,  # NXT-1
    "plan.get": GetPlanPayload,  # NXT-2
    "plan.list": ListPlansPayload,  # NXT-2
    "dataset.cleaning.preview": CleaningPreviewPayload,
}


def default_file_dialog(payload: DialogPickFilePayload) -> DialogPickFileRecord:
    """Open the native PyWebView file dialog (P2-3).

    Returns ``available=False`` when no webview window exists yet (headless
    tests, non-desktop shells); callers keep the manual path entry as
    fallback. A cancelled dialog returns ``path=None``.
    """
    try:
        import webview  # pyright: ignore[reportMissingImports] -- optional dep; absent = headless fallback
    except Exception:  # noqa: BLE001 -- absent webview = headless, unavailable
        return DialogPickFileRecord(path=None, available=False)
    windows = getattr(webview, "windows", None) or []
    if not windows:
        return DialogPickFileRecord(path=None, available=False)
    window = windows[0]
    types = [t.lstrip(".") for t in (payload.file_types or []) if t]
    file_types = (("Files", ";".join(f"*.{t}" for t in types)),) if types else None
    try:
        if payload.mode == "save":
            result = window.create_file_dialog(
                webview.SAVE_DIALOG, file_types=file_types, save_filename="")
        else:
            result = window.create_file_dialog(
                webview.OPEN_DIALOG, allow_multiple=False, file_types=file_types)
    except Exception:
        log.warning("native file dialog failed", exc_info=True)
        return DialogPickFileRecord(path=None, available=False)
    path = result if isinstance(result, str) and result else None
    return DialogPickFileRecord(path=path, available=True)


def _error(code: ErrorCode, message: str, correlation_id: str | None) -> Response:
    return Response(ok=False, error=ErrorContract(code=code, message=message,
                                                  correlation_id=correlation_id),
                    correlation_id=correlation_id)


# P4-5 (K2 sisa): domain-exception messages are NOT echoed to the client —
# service messages can embed filesystem paths (e.g. "file tidak ditemukan:
# /abs/path", "dest adalah direktori: ...") and Pydantic ValidationError
# strings embed submitted input values. Every domain error is mapped to a
# fixed generic message per code (setara jalur generik INTERNAL); the
# original exception is logged server-side with correlation_id for debugging.
_GENERIC_MESSAGES: dict[ErrorCode, str] = {
    ErrorCode.VALIDATION: "invalid payload",
    ErrorCode.NOT_FOUND: "not found",
    ErrorCode.CONFLICT: "conflict",
    ErrorCode.UNSUPPORTED_FORMAT: "unsupported format",
}


class Bridge:
    def __init__(self, service: WorkbenchService, jobs: JobManager,
                 file_dialog=None) -> None:
        self.service = service
        self.jobs = jobs
        self.file_dialog = file_dialog or default_file_dialog

    # -- the 4 bridge methods --------------------------------------------
    def get_protocol_info(self) -> dict[str, Any]:
        return ProtocolInfo(commands=sorted(_COMMANDS), queries=sorted(_QUERIES)).model_dump(mode="json")

    def execute_command(self, request: Request | dict) -> dict[str, Any]:
        try:
            req = Request(**request) if isinstance(request, dict) else request
        except ValidationError:
            log.warning("malformed command envelope rejected", exc_info=True)
            return _error(ErrorCode.VALIDATION, "invalid request envelope", None).model_dump(mode="json")
        if req.command not in _COMMANDS:
            return _error(ErrorCode.PERMISSION_DENIED,
                          "command not allowed", req.correlation_id).model_dump(mode="json")
        try:
            payload = _COMMANDS[req.command](**req.payload)
        except ValidationError:
            log.warning("invalid command payload for %s correlation_id=%s", req.command, req.correlation_id, exc_info=True)
            return _error(ErrorCode.VALIDATION, _GENERIC_MESSAGES[ErrorCode.VALIDATION], req.correlation_id).model_dump(mode="json")
        # K1: idempotent replay — return stored result without re-dispatch.
        if req.idempotency_key:
            cached = self.service.store.get_idempotent_result(req.idempotency_key, req.command)
            if cached is not None:
                return cached
        try:
            if req.command == "project.create":
                payload = cast(CreateProjectPayload, payload)
                result = self.service.create_project(payload.name, payload.project_id)
            elif req.command == "dataset.import":
                payload = cast(ImportDatasetPayload, payload)
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
                payload = cast(RunProfilePayload, payload)
                # service.run_profile owns the JobManager lifecycle (SYS-015)
                result = self.service.run_profile(
                    payload.project_id, payload.dataset_id,
                    req.correlation_id or req.request_id)
            elif req.command == "dataset.histogram.run":
                payload = cast(RunHistogramPayload, payload)
                result = self.service.run_histogram(
                    payload.project_id, payload.dataset_id,
                    payload.column_name,
                    req.correlation_id or req.request_id)
            elif req.command == "dataset.quality.run":
                payload = cast(RunQualityPayload, payload)
                # service.run_quality owns the JobManager lifecycle (SYS-015)
                result = self.service.run_quality(
                    payload.project_id, payload.dataset_id,
                    req.correlation_id or req.request_id)
            elif req.command == "dataset.readiness.run":
                payload = cast(RunReadinessPayload, payload)
                # service.run_readiness owns the JobManager lifecycle (SYS-015)
                result = self.service.run_readiness(
                    payload.project_id, payload.dataset_id,
                    req.correlation_id or req.request_id)
            elif req.command == "dataset.bivariate.run":
                payload = cast(RunBivariatePayload, payload)
                # service.run_bivariate owns the JobManager lifecycle (SYS-015)
                result = self.service.run_bivariate(
                    payload.project_id, payload.dataset_id,
                    payload.column_a, payload.column_b,
                    req.correlation_id or req.request_id)
            elif req.command == "dataset.report.generate":
                payload = cast(RunReportPayload, payload)
                # service.run_report owns the JobManager lifecycle (SYS-015)
                result = self.service.run_report(
                    payload.project_id, payload.dataset_id,
                    payload.scope,
                    req.correlation_id or req.request_id)
            elif req.command == "dataset.pdf.generate":
                payload = cast(RunPdfPayload, payload)
                # service.run_pdf owns the JobManager lifecycle (SYS-015)
                result = self.service.run_pdf(
                    payload.project_id, payload.dataset_id,
                    payload.scope,
                    req.correlation_id or req.request_id)
            elif req.command == "dataset.cleaning.run":
                payload = cast(CleaningRunPayload, payload)
                # service.run_cleaning owns the JobManager lifecycle (SYS-015)
                result = self.service.run_cleaning(
                    payload.project_id, payload.dataset_id,
                    payload.operation, payload.columns,
                    payload.strategy, payload.constant_value,
                    payload.expected_parent_fingerprint,
                    req.correlation_id or req.request_id)
            elif req.command == "dataset.snapshot.activate":
                payload = cast(DatasetActivatePayload, payload)
                # service.activate_snapshot changes the active snapshot for a dataset
                result = self.service.activate_snapshot(payload.project_id, payload.dataset_id, payload.snapshot_id)
            elif req.command == "project.backup.create":
                payload = cast(BackupCreatePayload, payload)
                # service.create_backup owns the JobManager lifecycle (SYS-015)
                result = self.service.create_backup(
                    payload.project_id, payload.dest_path,
                    req.correlation_id or req.request_id)
            elif req.command == "project.diagnostic.create":
                payload = cast(DiagnosticCreatePayload, payload)
                # service.create_diagnostic owns the JobManager lifecycle (SYS-015)
                result = self.service.create_diagnostic(
                    payload.project_id, payload.dest_path,
                    req.correlation_id or req.request_id)
            elif req.command == "dialog.pick_file":
                payload = cast(DialogPickFilePayload, payload)
                # Synchronous native dialog — no job, no mutation (P2-3).
                dialog_result = self.file_dialog(payload)
                # P4-2: a dialog-picked path becomes an authorized path
                # (allowlist) so subsequent import/backup/etc. accept
                # it even though it lies outside the project root.
                if dialog_result is not None and dialog_result.path and dialog_result.available:
                    self.service.authorize_path(dialog_result.path)
                result = dialog_result
            elif req.command == "project.restore":
                payload = cast(BackupRestorePayload, payload)
                result = self.service.restore_project(
                    payload.archive_path, payload.dest_root,
                    req.correlation_id or req.request_id)
            elif req.command == "dataset.export":
                payload = cast(ExportDatasetPayload, payload)
                # service.export_dataset owns the JobManager lifecycle (SYS-015)
                result = self.service.export_dataset(
                    payload.project_id, payload.dataset_id,
                    payload.format, payload.dest_path,
                    req.correlation_id or req.request_id)
            elif req.command == "insight.finding.create":
                payload = cast(CreateFindingPayload, payload)
                result = self.service.create_finding(
                    payload.project_id, payload.dataset_id, payload.title,
                    payload.body, payload.evidence_snapshot_id, payload.evidence_fingerprint)
            elif req.command == "insight.finding.transition":
                payload = cast(TransitionFindingPayload, payload)
                result = self.service.transition_finding(
                    payload.project_id, payload.finding_id, payload.to_status)
            elif req.command == "insight.hypothesis.create":
                payload = cast(CreateHypothesisPayload, payload)
                result = self.service.create_hypothesis(
                    payload.project_id, payload.dataset_id, payload.statement)
            elif req.command == "insight.hypothesis.transition":
                payload = cast(TransitionHypothesisPayload, payload)
                result = self.service.transition_hypothesis(
                    payload.project_id, payload.hypothesis_id, payload.to_status)
            elif req.command == "chart.spec.save":
                payload = cast(SaveChartSpecPayload, payload)
                result = self.service.save_chart_spec(
                    payload.project_id, payload.dataset_id, payload.snapshot_id,
                    payload.fingerprint, payload.chart_type, payload.x,
                    payload.y, payload.group, payload.encodings, payload.options,
                    payload.chart_id)
            elif req.command == "plan.create":
                payload = cast(CreatePlanPayload, payload)
                result = self.service.create_plan(
                    payload.project_id, payload.dataset_id, payload.steps)
            elif req.command == "plan.approve":
                payload = cast(ApprovePlanPayload, payload)
                result = self.service.approve_plan(
                    payload.project_id, payload.plan_id)
            elif req.command == "plan.execute":
                payload = cast(ExecutePlanPayload, payload)
                result = self.service.execute_plan(
                    payload.project_id, payload.plan_id, req.correlation_id)
            else:  # pragma: no cover — guarded by registry check above
                raise AssertionError(req.command)
        except NotFoundError:
            log.warning("not found in command %s correlation_id=%s", req.command, req.correlation_id, exc_info=True)
            return _error(ErrorCode.NOT_FOUND, _GENERIC_MESSAGES[ErrorCode.NOT_FOUND], req.correlation_id).model_dump(mode="json")
        except ServiceValidationError:
            log.warning("validation error in command %s correlation_id=%s", req.command, req.correlation_id, exc_info=True)
            return _error(ErrorCode.VALIDATION, _GENERIC_MESSAGES[ErrorCode.VALIDATION], req.correlation_id).model_dump(mode="json")
        except ConflictError:
            log.warning("conflict in command %s correlation_id=%s", req.command, req.correlation_id, exc_info=True)
            return _error(ErrorCode.CONFLICT, _GENERIC_MESSAGES[ErrorCode.CONFLICT], req.correlation_id).model_dump(mode="json")
        except UnsupportedFormatError:
            log.warning("unsupported format in command %s correlation_id=%s", req.command, req.correlation_id, exc_info=True)
            return _error(ErrorCode.UNSUPPORTED_FORMAT, _GENERIC_MESSAGES[ErrorCode.UNSUPPORTED_FORMAT], req.correlation_id).model_dump(mode="json")
        except Exception:
            log.exception("internal error in command %s correlation_id=%s", req.command, req.correlation_id)
            return _error(ErrorCode.INTERNAL, "internal error", req.correlation_id).model_dump(mode="json")
        response = Response(ok=True, data=result.model_dump(mode="json") if isinstance(result, BaseModel) else result,
                            correlation_id=req.correlation_id).model_dump(mode="json")
        if req.idempotency_key:
            self.service.store.save_idempotent_result(req.idempotency_key, req.command, response)
        return response

    def execute_query(self, request: Request | dict) -> dict[str, Any]:
        try:
            req = Request(**request) if isinstance(request, dict) else request
        except ValidationError:
            log.warning("malformed query envelope rejected", exc_info=True)
            return _error(ErrorCode.VALIDATION, "invalid request envelope", None).model_dump(mode="json")
        if req.command not in _QUERIES:
            return _error(ErrorCode.PERMISSION_DENIED,
                          "query not allowed", req.correlation_id).model_dump(mode="json")
        try:
            payload = _QUERIES[req.command](**req.payload)
        except ValidationError:
            log.warning("invalid query payload for %s correlation_id=%s", req.command, req.correlation_id, exc_info=True)
            return _error(ErrorCode.VALIDATION, _GENERIC_MESSAGES[ErrorCode.VALIDATION], req.correlation_id).model_dump(mode="json")
        try:
            if req.command == "project.open":
                payload = cast(OpenProjectPayload, payload)
                result = self.service.open_project(payload.project_id)
            elif req.command == "dataset.preview":
                payload = cast(GetDatasetPreviewPayload, payload)
                result = self.service.get_preview(
                    payload.project_id, payload.dataset_id, payload.limit)
            elif req.command == "dataset.profile":
                payload = cast(GetDatasetProfilePayload, payload)
                result = self.service.get_profile(
                    payload.project_id, payload.dataset_id)
            elif req.command == "dataset.profile.get":
                payload = cast(GetProfileByIdPayload, payload)
                result = self.service.get_profile_by_id(
                    payload.project_id, payload.profile_id)
            elif req.command == "dataset.profiles.list":
                payload = cast(ListProfilesPayload, payload)
                result = self.service.list_profiles(
                    payload.project_id, payload.dataset_id)
            elif req.command == "dataset.snapshots.list":
                payload = cast(ListSnapshotsPayload, payload)
                result = self.service.list_snapshots(payload.project_id)
            elif req.command == "dataset.provenance":
                payload = cast(GetDatasetProvenancePayload, payload)
                result = self.service.get_provenance(
                    payload.project_id, payload.dataset_id)
            elif req.command == "dataset.cleaning.preview":
                payload = cast(CleaningPreviewPayload, payload)
                result = self.service.cleaning_preview(payload)
            elif req.command == "insight.findings.list":
                payload = cast(ListInsightsPayload, payload)
                result = self.service.list_findings(
                    payload.project_id, payload.dataset_id)
            elif req.command == "insight.hypotheses.list":
                payload = cast(ListInsightsPayload, payload)
                result = self.service.list_hypotheses(
                    payload.project_id, payload.dataset_id)
            elif req.command == "chart.spec.get":
                payload = cast(GetChartSpecPayload, payload)
                result = self.service.get_chart_spec(
                    payload.project_id, payload.chart_id)
            elif req.command == "chart.spec.list":
                payload = cast(ListChartSpecsPayload, payload)
                result = self.service.list_chart_specs(
                    payload.project_id, payload.dataset_id)
            elif req.command == "plan.get":
                payload = cast(GetPlanPayload, payload)
                result = self.service.get_plan(
                    payload.project_id, payload.plan_id)
            elif req.command == "plan.list":
                payload = cast(ListPlansPayload, payload)
                result = self.service.list_plans(
                    payload.project_id, payload.dataset_id)
            else:  # pragma: no cover
                raise AssertionError(req.command)
        except NotFoundError:
            log.warning("not found in query %s correlation_id=%s", req.command, req.correlation_id, exc_info=True)
            return _error(ErrorCode.NOT_FOUND, _GENERIC_MESSAGES[ErrorCode.NOT_FOUND], req.correlation_id).model_dump(mode="json")
        except ServiceValidationError:
            log.warning("validation error in query %s correlation_id=%s", req.command, req.correlation_id, exc_info=True)
            return _error(ErrorCode.VALIDATION, _GENERIC_MESSAGES[ErrorCode.VALIDATION], req.correlation_id).model_dump(mode="json")
        except Exception:
            log.exception("internal error in query %s correlation_id=%s", req.command, req.correlation_id)
            return _error(ErrorCode.INTERNAL, "internal error", req.correlation_id).model_dump(mode="json")
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
