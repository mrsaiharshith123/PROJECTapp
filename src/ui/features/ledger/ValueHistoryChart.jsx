import { useCallback, useMemo, useRef, useState } from "react";
import { formatCompactInr } from "../../../constants/symbols.js";
import { computeYearAxisTicks } from "../../../utils/netWorth/propertyValueHistory.js";

const VB_W = 320;
const VB_H = 132;
const PAD_L = 52;
const PAD_R = 10;
const PAD_T = 10;
const PAD_B = 28;
const CHART_W = VB_W - PAD_L - PAD_R;
const CHART_H = VB_H - PAD_T - PAD_B;

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

/**
 * @typedef {{ year: number, value: number, ratePerSqyd?: number }} ValueHistoryPoint
 * @typedef {{
 *   series: ValueHistoryPoint[],
 *   color?: string,
 *   caption?: string,
 *   formatAmount: (n: number) => string,
 *   t: (key: string, params?: object) => string,
 *   areaUnit?: string,
 * }} ValueHistoryChartProps
 */

/**
 * @param {ValueHistoryChartProps} props
 */
export default function ValueHistoryChart({
  series,
  color = "var(--ed-gold)",
  caption,
  formatAmount,
  t,
  areaUnit = "sqyd",
}) {
  const svgRef = useRef(null);
  const [activeIdx, setActiveIdx] = useState(null);

  const geometry = useMemo(() => {
    if (!series?.length || series.length < 2) return null;
    const values = series.map((p) => p.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const mid = min + range / 2;

    const points = series.map((p, i) => {
      const x = PAD_L + (i / (series.length - 1)) * CHART_W;
      const y = PAD_T + CHART_H - ((p.value - min) / range) * CHART_H * 0.9;
      return { ...p, x, y, i };
    });

    const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
    const fillPath = `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${(PAD_T + CHART_H).toFixed(1)} L ${points[0].x.toFixed(1)} ${(PAD_T + CHART_H).toFixed(1)} Z`;

    const firstYear = series[0].year;
    const lastYear = series[series.length - 1].year;
    const yearTicks = computeYearAxisTicks(firstYear, lastYear, 5);

    const yLabels = [
      { value: max, y: PAD_T + CHART_H * 0.05 },
      { value: mid, y: PAD_T + CHART_H * 0.5 },
      { value: min, y: PAD_T + CHART_H * 0.95 },
    ];

    return { points, linePath, fillPath, min, max, yearTicks, yLabels };
  }, [series]);

  const pickIndex = useCallback(
    (clientX) => {
      const svg = svgRef.current;
      if (!svg || !geometry) return null;
      const pt = svg.createSVGPoint();
      pt.x = clientX;
      pt.y = 0;
      const ctm = svg.getScreenCTM();
      if (!ctm) return null;
      const svgX = pt.matrixTransform(ctm.inverse()).x;
      const frac = (svgX - PAD_L) / CHART_W;
      return clamp(Math.round(frac * (series.length - 1)), 0, series.length - 1);
    },
    [geometry, series],
  );

  const handlePointer = useCallback(
    (clientX) => {
      const idx = pickIndex(clientX);
      if (idx != null) setActiveIdx(idx);
    },
    [pickIndex],
  );

  if (!geometry) return null;

  const active = activeIdx != null ? geometry.points[activeIdx] : null;
  const defaultPoint = geometry.points[geometry.points.length - 1];
  const marker = active || defaultPoint;

  return (
    <div className="ed-value-chart" style={{ marginTop: 10 }}>
      {active ? (
        <div className="ed-value-chart-tooltip" aria-live="polite">
          <span className="ed-value-chart-tooltip-year">{active.year}</span>
          <span className="ed-value-chart-tooltip-value">
            {t("wealthDetail.graph.tooltipValue", { value: formatAmount(active.value) })}
          </span>
          {active.ratePerSqyd != null ? (
            <span className="ed-value-chart-tooltip-rate">
              {t("wealthDetail.graph.tooltipRate", {
                rate: Number(active.ratePerSqyd).toLocaleString("en-IN"),
                unit: areaUnit,
              })}
            </span>
          ) : null}
        </div>
      ) : (
        <p className="ed-value-chart-hint">{t("wealthDetail.graph.touchHint")}</p>
      )}

      <svg
        ref={svgRef}
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        width="100%"
        height={VB_H}
        className="ed-value-chart-svg"
        role="img"
        aria-label={t("wealthDetail.graph.ariaLabel", {
          start: series[0].year,
          end: series[series.length - 1].year,
        })}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          handlePointer(e.clientX);
        }}
        onPointerMove={(e) => handlePointer(e.clientX)}
        onPointerUp={(e) => {
          try {
            e.currentTarget.releasePointerCapture(e.pointerId);
          } catch {
            /* ignore */
          }
        }}
        onPointerLeave={() => setActiveIdx(null)}
      >
        <defs>
          <linearGradient id="edValueChartFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {geometry.yLabels.map((lbl) => (
          <text
            key={lbl.value}
            x={PAD_L - 6}
            y={lbl.y}
            textAnchor="end"
            dominantBaseline="middle"
            className="ed-value-chart-axis-y"
          >
            {formatCompactInr(lbl.value)}
          </text>
        ))}

        {[0.25, 0.5, 0.75].map((frac) => (
          <line
            key={frac}
            x1={PAD_L}
            y1={PAD_T + CHART_H * frac}
            x2={PAD_L + CHART_W}
            y2={PAD_T + CHART_H * frac}
            className="ed-value-chart-grid"
          />
        ))}

        <path d={geometry.fillPath} fill="url(#edValueChartFill)" />
        <path
          d={geometry.linePath}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {active ? (
          <line
            x1={active.x}
            y1={PAD_T}
            x2={active.x}
            y2={PAD_T + CHART_H}
            className="ed-value-chart-crosshair"
          />
        ) : null}

        <circle cx={marker.x} cy={marker.y} r={active ? 5 : 3.5} fill={color} stroke="var(--ed-bg)" strokeWidth="1.5" />

        {geometry.yearTicks.map((year) => {
          const i = series.findIndex((p) => p.year === year);
          const idx = i >= 0 ? i : Math.round(((year - series[0].year) / (series[series.length - 1].year - series[0].year || 1)) * (series.length - 1));
          const x = PAD_L + (idx / (series.length - 1)) * CHART_W;
          return (
            <text
              key={year}
              x={x}
              y={VB_H - 6}
              textAnchor={year === series[0].year ? "start" : year === series[series.length - 1].year ? "end" : "middle"}
              className="ed-value-chart-axis-x"
            >
              {year}
            </text>
          );
        })}

        <rect
          x={PAD_L}
          y={PAD_T}
          width={CHART_W}
          height={CHART_H}
          fill="transparent"
          style={{ cursor: "crosshair" }}
        />
      </svg>

      {caption ? (
        <p className="ed-ins-body ed-value-chart-caption">{caption}</p>
      ) : null}
    </div>
  );
}
