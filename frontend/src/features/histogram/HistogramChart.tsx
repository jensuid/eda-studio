/**
 * HistogramChart — SCREEN-HIST-001 + DS-HIST-001.
 * Single-series bar (ECharts, LD-06), label peak, accessible aria-label +
 * data-table fallback. Tokens via semantic vars (no raw hex in components).
 */
import { useEffect, useRef } from "react";
import { init } from "echarts";
import type { HistogramRecord } from "../../shared/ipc/generated";
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
        text: `Distribusi ${record.column_name}`,
        left: 0,
        top: 0,
        textStyle: { fontSize: CHART_TITLE_SIZE, fontWeight: 600 },
      },
      grid: { left: 56, right: 16, top: 56, bottom: 72, containLabel: true },
      tooltip: {
        trigger: "item",
        formatter: (p: { name: string; value: number }) =>
          `${p.name}: ${p.value} nilai (${record.value_count ? ((p.value / record.value_count) * 100).toFixed(1) : 0}%)`,
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
    const onResize = () => chart.resize();
    window.addEventListener("resize", onResize);
    return () => { window.removeEventListener("resize", onResize); chart.dispose(); };
  }, [record]);

  const summary = record.kind === "empty"
    ? `Distribusi ${record.column_name} tidak memiliki nilai.`
    : record.kind === "frequency"
      ? `Distribusi ${record.column_name}: ${record.value_count} nilai kategorikal, puncak di ${record.top_bin ?? "-"} (${record.bins.find((b) => b.label === record.top_bin)?.count ?? 0} nilai).`
      : `Distribusi ${record.column_name}: ${record.value_count} nilai, rentang ${record.min_value ?? ""}–${record.max_value ?? ""}, puncak di ${record.top_bin ?? "-"} (${record.bins.find((b) => b.label === record.top_bin)?.count ?? 0} nilai).`;

  if (record.kind === "empty") {
    return <p>Kolom ini tidak memiliki nilai.</p>;
  }

  return (
    <div>
      <div
        ref={ref}
        role="img"
        aria-label={summary}
        className="chart-canvas"
      />
      <p className="chart-caption">{summary} Metode binning: {record.bin_method}. Missing: {record.missing_pct}%. Fingerprint: {record.fingerprint.slice(0, 12)}…</p>
      <details>
        <summary>Data tabel</summary>
        <table>
          <thead><tr><th>{record.inferred_type === "numeric" ? "Rentang" : "Kategori"}</th><th>Count</th><th>%</th></tr></thead>
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
      </details>
    </div>
  );
}
