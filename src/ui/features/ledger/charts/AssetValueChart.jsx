import { useCallback, useId, useMemo, useRef, useState } from "react";
import { formatCompactInr } from "../../../../constants/symbols.js";
import { computeYearAxisTicks } from "../../../../utils/netWorth/propertyValueHistory.js";

const VB_W = 320;
const VB_H = 128;
const PAD_L = 8;
const PAD_R = 8;
const PAD_T = 8;
const PAD_B = 22;
const CHART_W = VB_W - PAD_L - PAD_R;
const CHART_H = VB_H - PAD_T - PAD_B;

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

/**
 * @typedef {{ year: number, value: number, ratePerSqyd?: number }} ValueHistoryPoint
 * @typedef {{ year: number, labelKey: string, labelParams?: Record<string, string | number>, kind?: string, seriesIndex?: number }} ChartMilestone
 * @typedef {{
 *   series: ValueHistoryPoint[],
 *   milestones?: ChartMilestone[],
 *   color?: string,
 *   caption?: string,
 *   formatAmount: (n: number) => string,
 *   t: (key: string, params?: object) => string,
 *   areaUnit?: string,
 *   showAxes?: boolean,
 * }} AssetValueChartProps
 */

/**
 * Editorial sparkline — thin gold/red line, milestone dots, touch crosshair + inset tooltip.
 * @param {AssetValueChartProps} props
 */
export default function AssetValueChart({
  series,
  milestones = [],
  color = "var(--ed-gold)",
  caption,
  formatAmount,
  t,
  areaUnit = "sqyd",
  showAxes = false,
}) {
  const svgRef = useRef(null);
  const [activeIdx, setActiveIdx] = useState(null);
  const gradientId = useId().replace(/:/g, "");

  const geometry = useMemo(() => {
    if (!series?.length || series.length < 2) return null;
    const values = series.map((p) => p.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    const points = series.map((p, i) => {
      const x = PAD_L + (i / (series.length - 1)) * CHART_W;
      const y = PAD_T + CHART_H - ((p.value - min) / range) * CHART_H * 0.92;
      return { ...p, x, y, i };
    });

    const linePath = points
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
      .join(" ");
    const fillPath = `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${(PAD_T + CHART_H).toFixed(1)} L ${points[0].x.toFixed(1)} ${(PAD_T + CHART_H).toFixed(1)} Z`;

    const firstYear = series[0].year;
    const lastYear = series[series.length - 1].year;
    const yearTicks = showAxes ? computeYearAxisTicks(firstYear, lastYear, 5) : [firstYear, lastYear];

    const milestonePoints = milestones
      .map((m) => {
        const idx =
          m.seriesIndex != null
            ? clamp(m.seriesIndex, 0, points.length - 1)
            : points.findIndex((p) => p.year === m.year);
        if (idx < 0) return null;
        return { ...m, ...points[idx], seriesIndex: idx };
      })
      .filter(Boolean);

    return { points, linePath, fillPath, min, max, yearTicks, milestonePoints };
  }, [series, milestones, showAxes]);

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
  const activeMilestone = active
    ? geometry.milestonePoints.find((m) => m.seriesIndex === activeIdx)
    : null;
  const defaultPoint = geometry.points[geometry.points.length - 1];
  const marker = active || defaultPoint;

  const cagrHint =
    series.length >= 2 && series[0].value > 0
      ? Math.round(((series[series.length - 1].value / series[0].value) ** (1 / (series.length - 1)) - 1) * 1000) / 10
      : null;

  return (
    <div className="ed-asset-chart ed-value-chart" style={{ marginTop: 10 }}>
      <div className={`ed-asset-chart-tooltip ed-value-chart-tooltip${active ? " is-active" : ""}`} aria-live="polite">
        {active ? (
          <>
            <span className="ed-value-chart-tooltip-year">{active.year}</span>
            <span className="ed-asset-chart-tooltip-value ed-value-chart-tooltip-value">
              {formatAmount(active.value)}
            </span>
            {active.ratePerSqyd != null ? (
              <span className="ed-value-chart-tooltip-rate">
                {t("wealthDetail.graph.tooltipRate", {
                  rate: Number(active.ratePerSqyd).toLocaleString("en-IN"),
                  unit: areaUnit,
                })}
              </span>
            ) : null}
            {activeMilestone ? (
              <span className="ed-asset-chart-milestone-label">
                {t(activeMilestone.labelKey, activeMilestone.labelParams)}
              </span>
            ) : null}
          </>
        ) : (
          <p className="ed-value-chart-hint" style={{ margin: 0 }}>
            {t("wealthDetail.graph.touchHint")}
            {cagrHint != null ? (
              <span className="ed-asset-chart-cagr-hint">
                {" · "}
                {t("wealthDetail.graph.avgYearly", { pct: cagrHint })}
              </span>
            ) : null}
          </p>
        )}
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        width="100%"
        height={VB_H}
        className="ed-value-chart-svg ed-asset-chart-svg"
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
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.18" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {showAxes
          ? [0.25, 0.5, 0.75].map((frac) => (
              <line
                key={frac}
                x1={PAD_L}
                y1={PAD_T + CHART_H * frac}
                x2={PAD_L + CHART_W}
                y2={PAD_T + CHART_H * frac}
                className="ed-value-chart-grid"
              />
            ))
          : null}

        <path d={geometry.fillPath} fill={`url(#${gradientId})`} />
        <path
          d={geometry.linePath}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />

        {geometry.milestonePoints.map((m) => (
          <circle
            key={`${m.year}-${m.labelKey}`}
            cx={m.x}
            cy={m.y}
            r={activeIdx === m.seriesIndex ? 5 : 4}
            className={`ed-asset-chart-milestone-dot${m.kind === "dip" ? " is-dip" : ""}`}
            fill={color}
            stroke="var(--ed-bg)"
            strokeWidth="1.5"
          />
        ))}

        {active ? (
          <line
            x1={active.x}
            y1={PAD_T}
            x2={active.x}
            y2={PAD_T + CHART_H}
            className="ed-value-chart-crosshair"
          />
        ) : null}

        {active ? (
          <circle
            cx={marker.x}
            cy={marker.y}
            r={5}
            fill={color}
            stroke="var(--ed-bg)"
            strokeWidth="1.5"
          />
        ) : null}

        {geometry.yearTicks.map((year) => {
          const i = series.findIndex((p) => p.year === year);
          const idx =
            i >= 0
              ? i
              : Math.round(
                  ((year - series[0].year) / (series[series.length - 1].year - series[0].year || 1)) *
                    (series.length - 1),
                );
          const x = PAD_L + (idx / (series.length - 1)) * CHART_W;
          return (
            <text
              key={year}
              x={x}
              y={VB_H - 4}
              textAnchor={
                year === series[0].year ? "start" : year === series[series.length - 1].year ? "end" : "middle"
              }
              className="ed-value-chart-axis-x"
            >
              {year}
            </text>
          );
        })}

        {showAxes
          ? [
              { value: geometry.max, y: PAD_T + CHART_H * 0.05 },
              { value: geometry.min, y: PAD_T + CHART_H * 0.95 },
            ].map((lbl) => (
              <text
                key={lbl.value}
                x={PAD_L + CHART_W + 2}
                y={lbl.y}
                textAnchor="start"
                dominantBaseline="middle"
                className="ed-value-chart-axis-y"
              >
                {formatCompactInr(lbl.value)}
              </text>
            ))
          : null}

        <rect
          x={PAD_L}
          y={PAD_T}
          width={CHART_W}
          height={CHART_H}
          fill="transparent"
          style={{ cursor: "crosshair" }}
        />
      </svg>

      {caption ? <p className="ed-ins-body ed-value-chart-caption">{caption}</p> : null}
    </div>
  );
}
