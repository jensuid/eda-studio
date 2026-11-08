/**
 * BivariateChart — SCREEN-BIVAR-001 + DS-BIVAR-001.
 * Mode-driven ECharts (LD-06): scatter (B1) | group bar (B2) | heatmap (B3).
 * Accessible aria-label + data-table fallback. Tokens via semantic vars
 * (no raw hex in components). Footnote B1: "Korelasi ≠ sebab-akibat".
 */
import { useEffect, useRef } from "react";
import { init } from "echarts";
import type { BivariateRecord } from "../../shared/ipc/generated";
import { CHART_COPY } from "../../shared/copy/featureCopy";
import { CHART_TITLE_SIZE, FONT_SIZE_SM, cssVar } from "../../shared/tokens";

interface Props {
  record: BivariateRecord;
}

export function summarySentence(record: BivariateRecord): string {
  const a = record.column_a;
  const b = record.column_b;
  if (record.mode === "num-num") {
    const r = record.pearson_r == null ? "-" : record.pearson_r.toFixed(2);
    const rho = record.spearman_rho == null ? "-" : record.spearman_rho.toFixed(2);
    return CHART_COPY.bivariatSummaryNumNum(a, b, r, rho, record.n_pairs);
  }
  if (record.mode === "cat-num") {
    const gs = record.groups ?? [];
    const hi = gs.reduce((m, g) => (g.mean_value > (m?.mean_value ?? -Infinity) ? g : m), gs[0]);
    const lo = gs.reduce((m, g) => (g.mean_value < (m?.mean_value ?? Infinity) ? g : m), gs[0]);
    return CHART_COPY.bivariatSummaryCatNum(
      record.value_column ?? b,
      record.group_column ?? a,
      hi?.mean_value.toFixed(2) ?? "-",
      hi?.label ?? "-",
      lo?.mean_value.toFixed(2) ?? "-",
      lo?.label ?? "-",
      gs.length,
    );
  }
  const rows = record.row_labels?.length ?? 0;
  const cols = record.col_labels?.length ?? 0;
  return CHART_COPY.bivariatSummaryCatCat(a, b, rows, cols, record.n_pairs);
}

export function BivariateChart({ record }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const chart = init(ref.current);
    const title = CHART_COPY.bivariatTitle(record.column_a, record.column_b);
    const titleStyle = { fontSize: CHART_TITLE_SIZE } as const;
    const scatterColor = cssVar("--color-chart-scatter-point");
    const heatLow = cssVar("--color-surface");
    const heatHigh = cssVar("--color-chart-heat-cell");

    if (record.mode === "num-num") {
      const data = (record.scatter_points ?? []).map((p) => [p.x, p.y]);
      chart.setOption({
        title: { text: title, left: 0, top: 0, textStyle: titleStyle },
        grid: { left: 56, right: 16, top: 56, bottom: 64, containLabel: true },
        tooltip: { trigger: "item", formatter: (p: { value: number[] }) => `${p.value[0]}, ${p.value[1]}` },
        xAxis: { type: "value", name: record.column_a, nameTextStyle: { fontSize: FONT_SIZE_SM } },
        yAxis: { type: "value", name: record.column_b, nameTextStyle: { fontSize: FONT_SIZE_SM } },
        series: [{
          type: "scatter", data, symbolSize: 6,
          ...(scatterColor ? { itemStyle: { color: scatterColor } } : {}),
        }],
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
            return g ? CHART_COPY.bivariatTooltipGroup(p.name, g.mean_value.toFixed(2), g.median_value.toFixed(2), g.count) : `${p.name}: ${p.value}`;
          },
        },
        xAxis: {
          type: "category",
          data: gs.map((g) => g.label),
          axisLabel: { rotate: gs.length > 8 ? 30 : 0, fontSize: FONT_SIZE_SM },
        },
        yAxis: { type: "value", name: CHART_COPY.bivariatYMean(record.value_column ?? ""), nameLocation: "middle", nameGap: 36, nameTextStyle: { fontSize: FONT_SIZE_SM } },
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
            return CHART_COPY.bivariatTooltipHeat(rows[i] ?? "", cols[j] ?? "", c, pct);
          },
        },
        xAxis: { type: "category", data: cols, axisLabel: { rotate: cols.length > 8 ? 30 : 0, fontSize: FONT_SIZE_SM } },
        yAxis: { type: "category", data: rows, axisLabel: { fontSize: FONT_SIZE_SM } },
        visualMap: {
          min: 0, max: Math.max(1, ...data.map((d) => d[2])), show: false,
          ...(heatLow && heatHigh ? { inRange: { color: [heatLow, heatHigh] } } : {}),
        },
        series: [{ type: "heatmap", data, label: { show: true, fontSize: FONT_SIZE_SM } }],
      });
    }
    // P2-4: render ulang saat container berubah (resize viewport,
    // toggle rail/panel, dsb.) — bukan hanya event window resize.
    const ro = new ResizeObserver(() => chart.resize());
    ro.observe(ref.current);
    return () => { ro.disconnect(); chart.dispose(); };
  }, [record]);

  const summary = summarySentence(record);
  const footnote = record.mode === "num-num"
    ? CHART_COPY.correlationFootnote
    : record.sampled
      ? CHART_COPY.sampled(record.sample_size, record.n_pairs)
      : "";

  return (
    <div>
      <div
        ref={ref}
        role="img"
        aria-label={summary}
        className="chart-canvas"
      />
      <p className="chart-caption">
        {summary}{footnote ? ` ${footnote}` : ""} {CHART_COPY.fingerprint(record.fingerprint.slice(0, 12))}{" "}
        {record.sampled ? CHART_COPY.sampledBadge(record.sample_size) : CHART_COPY.exact} · {CHART_COPY.pairs(record.n_pairs)}
        {record.missing_pairs > 0 ? ` · ${CHART_COPY.missingPairs(record.missing_pairs)}` : ""}
      </p>
      <BivariateDataTable record={record} />
    </div>
  );
}

export function BivariateDataTable({ record }: Props) {
  return (
    <details>
      <summary>{CHART_COPY.dataTable}</summary>
      <div className="table-scroll">
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
            <thead><tr><th>{record.group_column ?? CHART_COPY.categoryHeader}</th><th>{CHART_COPY.countHeader}</th><th>{CHART_COPY.meanHeader}</th><th>{CHART_COPY.medianHeader}</th><th>{CHART_COPY.minHeader}</th><th>{CHART_COPY.maxHeader}</th></tr></thead>
            <tbody>
              {(record.groups ?? []).map((g) => (
                <tr key={g.label}><td>{g.label}</td><td>{g.count}</td><td>{g.mean_value}</td><td>{g.median_value}</td><td>{g.min_value}</td><td>{g.max_value}</td></tr>
              ))}
            </tbody>
          </table>
        )}
        {record.mode === "cat-cat" && (
          <table>
            <thead><tr><th>{record.column_a} \\ {record.column_b}</th>{(record.col_labels ?? []).map((c) => <th key={c}>{c}</th>)}<th>{CHART_COPY.totalHeader}</th></tr></thead>
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
                <th>{CHART_COPY.totalHeader}</th>
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
