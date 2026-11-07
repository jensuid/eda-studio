"""PDF report renderer (SCREEN-PDF-001, JOB-PDF-001).

Generates a standalone PDF distribution mirror of the HTML ReportRecord
(REP-005, REP-007). Primary renderer: reportlab (header/footer + page
numbers + paginated tables with repeated header rows — A-L3). Fallback:
stdlib minimal PDF writer (tables-only, no images) with a DIFFERENT
renderer_version, labelled in metadata (A-L1, never silent).
"""
from __future__ import annotations

REPORTLAB_VERSION = "reportlab/1.0"
STDLIB_VERSION = "stdlib-tables/1.0"

_STALE_LABEL = "Hasil mungkin usang — jalankan ulang."
_DRAFT_LABEL = "Draft — bukan final export."


def _font_available() -> bool:
    try:
        import reportlab  # noqa: F401
        return True
    except ImportError:
        return False


def render_pdf(*, dataset_name: str, fingerprint: str, snapshot_id: str,
               row_count: int, generated_at: str,
               profile: dict | None, quality: dict | None,
               charts: list[dict] | None, cleanings: list[dict] | None,
               is_final: bool, source_html_fingerprint: str) -> tuple[bytes, int, str]:
    """Render PDF bytes. Returns (bytes, page_count, renderer_version)."""
    if _font_available():
        return _render_reportlab(
            dataset_name=dataset_name, fingerprint=fingerprint,
            snapshot_id=snapshot_id, row_count=row_count,
            generated_at=generated_at, profile=profile, quality=quality,
            charts=charts, cleanings=cleanings, is_final=is_final,
            source_html_fingerprint=source_html_fingerprint)
    return _render_stdlib(
        dataset_name=dataset_name, fingerprint=fingerprint,
        snapshot_id=snapshot_id, row_count=row_count,
        generated_at=generated_at, profile=profile, quality=quality,
        charts=charts, cleanings=cleanings, is_final=is_final,
        source_html_fingerprint=source_html_fingerprint)


def _render_reportlab(*, dataset_name, fingerprint, snapshot_id, row_count,
                      generated_at, profile, quality, charts, cleanings,
                      is_final, source_html_fingerprint):
    import io

    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import ParagraphStyle
    from reportlab.lib.units import mm
    from reportlab.platypus import (
        Paragraph,
        SimpleDocTemplate,
        Spacer,
        Table,
    )

    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=A4, leftMargin=16 * mm, rightMargin=16 * mm,
        topMargin=18 * mm, bottomMargin=18 * mm,
        title=f"Report — {dataset_name}", author="EDA Workbench",
        subject=f"fingerprint {fingerprint[:12]}",
    )
    normal = ParagraphStyle("body", fontSize=10, leading=13)
    h1 = ParagraphStyle("h1", fontSize=18, leading=22, spaceAfter=6)
    h2 = ParagraphStyle("h2", fontSize=13, leading=16, spaceBefore=10, spaceAfter=4)

    def hdr(canvas_obj, doc_obj):
        canvas_obj.saveState()
        canvas_obj.setFont("Helvetica", 8)
        canvas_obj.drawString(16 * mm, A4[1] - 12 * mm, f"Report — {dataset_name}")
        canvas_obj.drawRightString(A4[0] - 16 * mm, A4[1] - 12 * mm, fingerprint[:12])
        canvas_obj.drawCentredString(A4[0] / 2, 12 * mm, f"Halaman {doc_obj.page}")
        canvas_obj.restoreState()

    story = [Paragraph(f"Report — {dataset_name}", h1)]
    story.append(Paragraph(
        f"Snapshot {snapshot_id[:12]}… · {row_count} baris · fingerprint {fingerprint[:12]}… · dibuat {generated_at}",
        normal))
    story.append(Paragraph(f"Sumber HTML: {source_html_fingerprint[:12]}…", normal))
    if not is_final:
        story.append(Paragraph(f"{_DRAFT_LABEL}", normal))

    if profile is not None:
        story.append(Paragraph("Profiling", h2))
        if profile.get("stale"):
            story.append(Paragraph(_STALE_LABEL, normal))
        rows = [["Status", "Jumlah"]]
        counts = {}
        for c in profile.get("columns") or []:
            counts[c.get("status", "?")] = counts.get(c.get("status", "?"), 0) + 1
        for k, v in sorted(counts.items()):
            rows.append([k, str(v)])
        story.append(Table(rows, repeatRows=1))
    if quality is not None:
        story.append(Paragraph("Quality", h2))
        if quality.get("stale"):
            story.append(Paragraph(_STALE_LABEL, normal))
        rows = [["Kolom", "Aturan", "Severity", "Bukti"]]
        for f in quality.get("findings") or []:
            rows.append([str(f.get("column_name") or "snapshot"),
                         str(f.get("rule_id", "")), str(f.get("severity", "")),
                         str(f.get("evidence_detail", ""))])
        story.append(Table(rows, repeatRows=1))
    if charts:
        for ch in charts:
            story.append(Paragraph(f"{ch.get('kind', '?')}", h2))
            if ch.get("stale"):
                story.append(Paragraph(_STALE_LABEL, normal))
            story.append(Paragraph(str(ch.get("summary", "")), normal))
    if cleanings:
        for cl in cleanings:
            story.append(Paragraph("Cleaning", h2))
            if cl.get("stale"):
                story.append(Paragraph(_STALE_LABEL, normal))
            story.append(Paragraph(
                f"{cl.get('operation', '')}: {cl.get('row_count_before', '?')} → {cl.get('row_count_after', '?')} baris",
                normal))
    story.append(Spacer(1, 6))
    story.append(Paragraph(f"Sumber HTML {source_html_fingerprint[:12]}… · {REPORTLAB_VERSION}", normal))
    doc.build(story, onFirstPage=hdr, onLaterPages=hdr)
    # page count via pypdf-free count of "/Type /Page" markers is unreliable;
    # use reportlab's page counter before build is not available, so count
    # via splitting is approximated by doc.page after build.
    return buf.getvalue(), doc.page, REPORTLAB_VERSION


def _render_stdlib(*, dataset_name, fingerprint, snapshot_id, row_count,
                   generated_at, profile, quality, charts, cleanings,
                   is_final, source_html_fingerprint) -> tuple[bytes, int, str]:
    """Minimal fallback (tables-only, no images) — labelled, never silent."""
    lines: list[str] = []
    lines.append(f"Report — {dataset_name}")
    lines.append(f"Snapshot {snapshot_id[:12]}… · {row_count} baris · fingerprint {fingerprint[:12]}… · dibuat {generated_at}")
    lines.append(f"Sumber HTML: {source_html_fingerprint[:12]}…")
    if not is_final:
        lines.append(_DRAFT_LABEL)
    if profile is not None:
        lines.append("Profiling")
        if profile.get("stale"):
            lines.append(_STALE_LABEL)
        counts = {}
        for c in profile.get("columns") or []:
            counts[c.get("status", "?")] = counts.get(c.get("status", "?"), 0) + 1
        for k, v in sorted(counts.items()):
            lines.append(f"{k}: {v}")
    if quality is not None:
        lines.append("Quality")
        if quality.get("stale"):
            lines.append(_STALE_LABEL)
        for f in quality.get("findings") or []:
            lines.append(f"{f.get('column_name') or 'snapshot'} | {f.get('rule_id', '')} | {f.get('severity', '')}")
    if charts:
        for ch in charts:
            lines.append(f"{ch.get('kind', '?')}: {ch.get('summary', '')}")
    if cleanings:
        lines.append("Cleaning")
        for cl in cleanings:
            lines.append(f"{cl.get('operation', '')}: {cl.get('row_count_before', '?')} -> {cl.get('row_count_after', '?')}")
    lines.append(f"Fallback JT {STDLIB_VERSION} — tables-only, no images.")
    stream = "\n".join(lines)
    return _minimal_pdf_bytes(dataset_name, fingerprint, stream), 1, STDLIB_VERSION


def _minimal_pdf_bytes(title: str, fingerprint: str, text: str) -> bytes:
    """Tiny vendored PDF writer (one page, Helvetica)."""
    import re

    text_escaped = re.sub(rb"[()\\]", lambda m: b"\\" + m.group(0), text.encode("utf-8", "replace"))
    stream = b"BT /F1 10 Tf 40 800 Td (" + text_escaped + b") Tj ET"
    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
        b"<< /Length " + str(len(stream)).encode() + b" >>\nstream\n" + stream + b"\nendstream",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
        b"<< /Title (" + _pdf_escape(title) + b") /Author (EDA Workbench) /Subject (fingerprint " +
        _pdf_escape(fingerprint[:12]) + b") >>",
    ]
    out = [b"%PDF-1.4\n"]
    offsets = []
    for i, obj in enumerate(objects, start=1):
        offsets.append(sum(len(x) for x in out))
        out.append(f"{i} 0 obj\n".encode() + obj + b"\nendobj\n")
    xref_pos = sum(len(x) for x in out)
    n = len(objects) + 1
    out.append(f"xref\n0 {n}\n".encode())
    out.append(b"0000000000 65535 f \n")
    for off in offsets:
        out.append(f"{off:010d} 00000 n \n".encode())
    out.append(f"trailer\n<< /Size {n} /Root 1 0 R /Info 6 0 R >>\nstartxref\n{xref_pos}\n%%EOF\n".encode())
    return b"".join(out)


def _pdf_escape(s: str) -> bytes:
    return s.encode("utf-8", "replace").replace(b"(", rb"\(").replace(b")", rb"\)").replace(b"\\", rb"\\").replace(b"\n", b" ")
