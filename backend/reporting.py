"""HTML reporting backend renderer (SCREEN-REPORT-001, JOB-REPORT-001).

Generates a single self-contained HTML file from EXISTING analysis records
(read from the store, referenced — never duplicated from raw data, REP-003).
Renderer: Python stdlib `html` + string template, inline `<style>` only,
no external scripts/fonts (R4 + A2: no `<script>` at all). Every number
carries its source footer (R5). Stale sections are included and labelled —
never silently dropped (A1: all sections optional-but-disclosed).
"""
from __future__ import annotations

import html
from datetime import UTC, datetime

from backend.contracts import REPORT_RENDERER_VERSION

_RENDERER_VERSION = REPORT_RENDERER_VERSION  # single source (contracts.py)

_STALE_LABEL = "Hasil mungkin usang — jalankan ulang."


def _footer(rec: dict) -> str:
    return (f"Sumber: {html.escape(str(rec.get('kind', '?')))} "
            f"record {html.escape(str(rec.get('record_id', '')))} · "
            f"fingerprint {html.escape(str(rec.get('fingerprint', ''))[:12])}… · "
            f"snapshot {html.escape(str(rec.get('snapshot_id', ''))[:12])}…")


def _stale_banner(stale: bool) -> str:
    return f"<p class=\"stale\">{_STALE_LABEL}</p>" if stale else ""


def render_html(*, dataset_name: str, fingerprint: str, snapshot_id: str,
                row_count: int, generated_at: str,
                profile: dict | None, quality: dict | None,
                charts: list[dict] | None, cleanings: list[dict] | None) -> str:
    """Render the full self-contained HTML document (deterministic, stdlib)."""
    charts = charts or []
    cleanings = cleanings or []

    body: list[str] = []
    body.append(f"<h1>Report — {html.escape(dataset_name)}</h1>")
    body.append(f"<p>Snapshot {html.escape(snapshot_id[:12])}… · {row_count} baris · "
                f"fingerprint {html.escape(fingerprint[:12])}… · dibuat {html.escape(generated_at)}</p>")

    # Profiling
    if profile is not None:
        stale = bool(profile.get("stale"))
        body.append("<h2>Profiling</h2>")
        body.append(_stale_banner(stale))
        cols = profile.get("columns") or []
        counts = {}
        for c in cols:
            counts[c.get("status", "?")] = counts.get(c.get("status", "?"), 0) + 1
        body.append("<p>Ringkasan kolom per status:</p>")
        body.append("<table>")
        for status, n in sorted(counts.items()):
            body.append(f"<tr><th scope=\"row\">{html.escape(str(status))}</th><td>{n}</td></tr>")
        body.append("</table>")
        body.append(f"<p class=\"src\">{_footer(profile)}</p>")

    # Quality
    if quality is not None:
        stale = bool(quality.get("stale"))
        body.append("<h2>Quality</h2>")
        body.append(_stale_banner(stale))
        findings = quality.get("findings") or []
        body.append("<table>")
        for f in findings:
            body.append(
                f"<tr><th scope=\"row\">{html.escape(str(f.get('column_name') or 'snapshot'))}</th>"
                f"<td>{html.escape(str(f.get('rule_id', '')))}</td>"
                f"<td>{html.escape(str(f.get('severity', '')))}</td>"
                f"<td>{html.escape(str(f.get('evidence_detail', '')))}</td></tr>"
            )
        body.append("</table>")
        body.append(f"<p class=\"src\">{_footer(quality)}</p>")
        if not body:
            pass

    # Charts (histogram / bivariate ringkasan)
    if charts:
        body.append("<h2>Analisis Visual</h2>")
        for ch in charts:
            stale = bool(ch.get("stale"))
            kind = str(ch.get("kind", "?"))
            body.append(f"<h3>{html.escape(kind)}</h3>")
            body.append(_stale_banner(stale))
            body.append(f"<p>{html.escape(str(ch.get('summary', '')))}</p>")
            body.append(f"<p class=\"src\">{_footer(ch)}</p>")

    # Cleaning provenance
    if cleanings:
        body.append("<h2>Cleaning</h2>")
        for cl in cleanings:
            stale = bool(cl.get("stale", False))
            body.append(_stale_banner(stale))
            body.append(
                f"<p>{html.escape(str(cl.get('operation', '')))}: "
                f"{cl.get('row_count_before', '?')} → {cl.get('row_count_after', '?')} baris</p>"
            )
            body.append(f"<p class=\"src\">{_footer(cl)}</p>")

    return (
        "<!DOCTYPE html>\n<html lang=\"id\">\n<head>\n<meta charset=\"utf-8\">\n"
        "<title>Report — " + html.escape(dataset_name) + "</title>\n"
        "<style>\n"
        ":root{--fg:#17202a;--muted:#5b6b7c;--border:#d7dee8}\n"
        "body{font-family:system-ui,sans-serif;color:var(--fg);margin:32px}\n"
        "table{border-collapse:collapse}th,td{border:1px solid var(--border);padding:6px 10px;text-align:left}\n"
        ".stale{color:var(--muted);border:1px solid var(--border);padding:4px 8px}\n"
        ".src{color:var(--muted);font-size:.85em}\n</style>\n"
        "</head>\n<body>\n" + "\n".join(body) + "\n</body>\n</html>\n"
    )


def now_iso() -> str:
    return datetime.now(UTC).isoformat()
