/**
 * BivariateChart — SCREEN-BIVAR-001 + DS-BIVAR-001.
 * Mode-driven ECharts (LD-06): scatter (B1) | group bar (B2) | heatmap (B3).
 * Accessible aria-label + data-table fallback. Tokens via semantic vars
 * (no raw hex in components). Footnote B1: "Korelasi ≠ sebab-akibat".
 */
import { useEffect, useRef } from "react";
import { init } from "echarts";
import type { BivariateRecord } from "../../shared/ipc/generated";

interface Props {
  record: BivariateRecord;
}

export function summarySentence(record: BivariateRecord): string {
  const a = record.column_a;
  const b = record.column_b;
  if (record.mode === "num-num") {
    const r = record.pearson_r == null ? "-" : record.pearson_r.toFixed(2);
    const rho = record.spearman_rho == null ? "-" : record.spearman_rho.toFixed(2);
    return `Korelasi ${a} dengan ${b}: Pearson ${r}, Spearman ${rho}, ${record.n_pairs} pasangan.`;
  }
  if (record.mode === "cat-num") {
    const gs = record.groups ?? [];
    const hi = gs.reduce((m, g) => (g.mean_value > (m?.mean_value ?? -Infinity) ? g : m), gs[0]);
    const lo = gs.reduce((m, g) => (g.mean_value < (m?.mean_value ?? Infinity) ? g : m), gs[0]);
    return `Rata-rata ${record.value_column ?? b} per ${record.group_column ?? a}: tertinggi ${hi?.mean_value.toFixed(2) ?? "-"} pada ${hi?.label ?? "-"}, terendah ${lo?.mean_value.toFixed(2) ?? "-"} pada ${lo?.label ?? "-"}, ${gs.length} grup.`;
  }
  const rows = record.row_labels?.length ?? 0;
  const cols = record.col_labels?.length ?? 0;
  return `Silang ${a} dengan ${b}: ${rows} baris × ${cols} kolom, total ${record.n_pairs} pasangan.`;
}

export function BivariateChart({ record }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const chart = init(ref.current);
    const title = `Hubungan ${record.column_a} × ${record.column_b}`;
    const titleStyle = { fontSize: 14, fontWeight: 600 } as const;

    if (record.mode === "num-num") {
      const data = (record.scatter_points ?? []).map((p) => [p.x, p.y]);
      chart.setOption({
        title: { text: title, left: 0, top: 0, textStyle: titleStyle },
        grid: { left: 56, right: 16, top: 56, bottom: 64, containLabel: true },
        tooltip: { trigger: "item", formatter: (p: { value: number[] }) => `${p.value[0]}, ${p.value[1]}` },
        xAxis: { type: "value", name: record.column_a, nameTextStyle: { fontSize: 11 } },
        yAxis: { type: "value", name: record.column_b, nameTextStyle: { fontSize: 11 } },
        series: [{ type: "scatter", data, symbolSize: 6 }],
      });
    } else if (record.mode === "cat-num") {
      const gs = record.groups ?? [];
      chart.setOption({
        title: { text: title, left: 0, top: 0, textStyle: titleStyle },
        grid: { left: 56, right: 16, top: 56, bottom: 88, containLabel: true },
        tooltip: {
          trigger: "item",
          formatter: (p: { name: string; value: number; dataIndex: number }) => {
            const g = gs[p.dataIndex];
            return g ? `${p.name}: mean ${g.mean_value.toFixed(2)} · median ${g.median_value.toFixed(2)} · n ${g.count}` : `${p.name}: ${p.value}`;
          },
        },
        xAxis: {
          type: "category",
          data: gs.map((g) => g.label),
          axisLabel: { rotate: gs.length > 8 ? 30 : 0, fontSize: 11 },
        },
        yAxis: { type: "value", name: `mean ${record.value_column ?? ""}`, nameLocation: "middle", nameGap: 36, nameTextStyle: { fontSize: 11 } },
        series: [{ type: "bar", data: gs.map((g) => g.mean_value) }],
      });
    } else if (record.mode === "cat-cat") {
      const rows = record.row_labels ?? [];
      const cols = record.col_labels ?? [];
      const cells = record.cells ?? [];
      const data: [number, number, number][] = [];
      cells.forEach((row, i) => row.forEach((c, j) => data.push([j, i, c])));
      chart.setOption({
        title: { text: title, left: 0, top: 0, textStyle: titleStyle },
        grid: { left: 72, right: 56, top: 56, bottom: 72, containLabel: true },
        tooltip: {
          trigger: "item",
          formatter: (p: { value: [number, number, number] }) => {
            const [j, i, c] = p.value;
            const rowTotal = cells[i]?.reduce((s, v) => s + v, 0) || 0;
            const pct = rowTotal ? ((c / rowTotal) * 100).toFixed(1) : "0";
            return `${rows[i]} × ${cols[j]}: ${c} (${pct}% dari ${rows[i]})`;
          },
        },
        xAxis: { type: "category", data: cols, axisLabel: { rotate: cols.length > 8 ? 30 : 0, fontSize: 11 } },
        yAxis: { type: "category", data: rows, axisLabel: { fontSize: 11 } },
        visualMap: { min: 0, max: Math.max(1, ...data.map((d) => d[2])), show: false },
        series: [{ type: "heatmap", data, label: { show: true, fontSize: 11 } }],
      });
    }
    const onResize = () => chart.resize();
    window.addEventListener("resize", onResize);
    return () => { window.removeEventListener("resize", onResize); chart.dispose(); };
  }, [record]);

  const summary = summarySentence(record);
  const footnote = record.mode === "num-num"
    ? "Korelasi ≠ sebab-akibat."
    : record.sampled
      ? `Sampled ${record.sample_size} dari ${record.n_pairs} pasangan.`
      : "";

  return (
    <div>
      <div
        ref={ref}
        role="img"
        aria-label={summary}
        style={{ width: "100%", height: 320, overflowX: "auto", minWidth: 320 }}
      />
      <p style={{ fontSize: "0.85em", margin: "4px 0" }}>
        {summary}{footnote ? ` ${footnote}` : ""} Fingerprint: {record.fingerprint.slice(0, 12)}…{" "}
        {record.sampled ? `Sampled (${record.sample_size})` : "Exact"} · {record.n_pairs} pasangan
        {record.missing_pairs > 0 ? ` · ${record.missing_pairs} berpasangan-baris hilang` : ""}
      </p>
      <BivariateDataTable record={record} />
    </div>
  );
}

export function BivariateDataTable({ record }: Props) {
  return (
    <details>
      <summary>Data tabel</summary>
      <div style={{ overflowX: "auto" }}>
        {record.mode === "num-num" && (
          <table>
            <thead><tr><th>{record.column_a}</th><th>{record.column_b}</th></tr></thead>
            <tbody>
              {(record.scatter_points ?? []).map((p, i) => (
                <tr key={i}><td>{p.x}</td><td>{p.y}</td></tr>
              ))}
            </tbody>
          </table>
        )}
        {record.mode === "cat-num" && (
          <table>
            <thead><tr><th>{record.group_column ?? "Kategori"}</th><th>Count</th><th>Mean</th><th>Median</th><th>Min</th><th>Max</th></tr></thead>
            <tbody>
              {(record.groups ?? []).map((g) => (
                <tr key={g.label}><td>{g.label}</td><td>{g.count}</td><td>{g.mean_value}</td><td>{g.median_value}</td><td>{g.min_value}</td><td>{g.max_value}</td></tr>
              ))}
            </tbody>
          </table>
        )}
        {record.mode === "cat-cat" && (
          <table>
            <thead><tr><th>{record.column_a} \\ {record.column_b}</th>{(record.col_labels ?? []).map((c) => <th key={c}>{c}</th>)}<th>Total</th></tr></thead>
            <tbody>
              {(record.cells ?? []).map((row, i) => {
                const rowTotal = row.reduce((s, v) => s + v, 0);
                return (
                  <tr key={i}>
                    <th>{record.row_labels?.[i]}</th>
                    {row.map((c, j) => <td key={j}>{c} ({rowTotal ? ((c / rowTotal) * 100).toFixed(1) : "0"}%)</td>)}
                    <td><strong>{rowTotal}</strong></td>
                  </tr>
                );
              })}
              <tr>
                <th>Total</th>
                {(record.col_labels ?? []).map((c, j) => (
                  <td key={c}><strong>{(record.cells ?? []).reduce((s, row) => s + (row[j] ?? 0), 0)}</strong></td>
                ))}
                <td><strong>{record.n_pairs}</strong></td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </details>
  );
}
