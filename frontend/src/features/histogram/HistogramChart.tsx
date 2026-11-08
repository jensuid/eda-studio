/**
 * HistogramChart — SCREEN-HIST-001 + DS-HIST-001.
 * Single-series bar (ECharts, LD-06), label peak, accessible aria-label +
 * data-table fallback. Tokens via semantic vars (no raw hex in components).
 */
import { useEffect, useRef } from "react";
import { init } from "echarts";
import type { HistogramRecord } from "../../shared/ipc/generated";
import { CHART_COPY } from "../../shared/copy/featureCopy";
import { CHART_TITLE_SIZE, FONT_SIZE_SM } from "../../shared/tokens";

interface Props {
  record: HistogramRecord;
}

export function HistogramChart({ record }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || record.bins.length === 0) return;
    const chart = init(ref.current);
    const peakIdx = record.bins.reduce(
      (best, b, i) => (b.count > (record.bins[best]?.count ?? -1) ? i : best), 0);
    chart.setOption({
      title: {
        text: CHART_COPY.histogramTitle(record.column_name),
        left: 0,
        top: 0,
        textStyle: { fontSize: CHART_TITLE_SIZE },
      },
      grid: { left: 56, right: 16, top: 56, bottom: 72, containLabel: true },
      tooltip: {
        trigger: "item",
        formatter: (p: { name: string; value: number }) =>
          CHART_COPY.histogramTooltip(p.name, p.value, record.value_count ? ((p.value / record.value_count) * 100).toFixed(1) : "0"),
      },
      xAxis: {
        type: "category",
        data: record.bins.map((b) => b.label),
        axisLabel: { rotate: record.bins.length > 8 ? 30 : 0, fontSize: FONT_SIZE_SM },
      },
      yAxis: {
        type: "value",
        name: "count",
        nameLocation: "middle",
        nameGap: 36,
        nameTextStyle: { fontSize: FONT_SIZE_SM },
      },
      series: [{
        type: "bar",
        data: record.bins.map((b, i) => ({
          value: b.count,
          ...(i === peakIdx ? {} : { itemStyle: { opacity: 0.85 } }),
        })),
        label: {
          show: true,
          position: "top",
          fontSize: FONT_SIZE_SM,
          formatter: (p: { dataIndex: number }) => (p.dataIndex === peakIdx ? String(record.bins[peakIdx]?.count ?? "") : ""),
        },
      }],
    });
    // P2-4: render ulang saat container berubah (resize viewport,
    // toggle rail/panel, dsb.) — bukan hanya event window resize.
    const ro = new ResizeObserver(() => chart.resize());
    ro.observe(ref.current);
    return () => { ro.disconnect(); chart.dispose(); };
  }, [record]);

  const summary = record.kind === "empty"
    ? CHART_COPY.histogramSummaryEmpty(record.column_name)
    : record.kind === "frequency"
      ? CHART_COPY.histogramSummaryFrequency(record.column_name, record.value_count, record.top_bin ?? "-", record.bins.find((b) => b.label === record.top_bin)?.count ?? 0)
      : CHART_COPY.histogramSummaryNumeric(record.column_name, record.value_count, record.min_value ?? "", record.max_value ?? "", record.top_bin ?? "-", record.bins.find((b) => b.label === record.top_bin)?.count ?? 0);

  if (record.kind === "empty") {
    return <p>{CHART_COPY.histogramEmpty}</p>;
  }

  return (
    <div>
      <div
        ref={ref}
        role="img"
        aria-label={summary}
        className="chart-canvas"
      />
      <p className="chart-caption">{summary} {CHART_COPY.histogramCaption(record.bin_method, record.missing_pct, record.fingerprint.slice(0, 12))}</p>
      <details>
        <summary>{CHART_COPY.dataTable}</summary>
        <div className="table-scroll">
          <table>
            <thead><tr><th>{record.inferred_type === "numeric" ? CHART_COPY.rangeHeader : CHART_COPY.categoryHeader}</th><th>{CHART_COPY.countHeader}</th><th>{CHART_COPY.percentHeader}</th></tr></thead>
            <tbody>
              {record.bins.map((b) => (
                <tr key={b.label}>
                  <td>{b.label}</td>
                  <td>{b.count}</td>
                  <td>{record.value_count ? ((b.count / record.value_count) * 100).toFixed(1) : 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
