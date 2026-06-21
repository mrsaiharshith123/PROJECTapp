/** @typedef {"light" | "dark"} ChartThemeMode */

/** Obsidian analytics palette — thin lines, soft grid, indigo accent. */
/** @param {ChartThemeMode} mode */
export function getChartTheme(mode) {
  const isLight = mode === "light";
  return {
    colors: isLight
      ? ["#6366f1", "#4f46e5", "#2dd4bf", "#fcd34d", "#38bdf8", "#f87171", "#818cf8", "#94a3b8"]
      : ["#6366f1", "#818cf8", "#2dd4bf", "#fcd34d", "#6ecbff", "#f87171", "#a5b4fc", "#9a97b0"],
    tick: { fontSize: 10, fill: isLight ? "#64748b" : "var(--ct-text-muted, #9a97b0)" },
    grid: {
      stroke: isLight ? "rgba(15, 23, 42, 0.06)" : "rgba(255, 255, 255, 0.04)",
      strokeDasharray: "3 6",
    },
    tooltip: {
      contentStyle: {
        backgroundColor: isLight ? "#ffffff" : "var(--ct-surface-raised, rgba(13, 14, 24, 0.94))",
        border: isLight ? "1px solid rgba(15, 23, 42, 0.1)" : "1px solid rgba(99, 102, 241, 0.35)",
        borderRadius: "14px",
        boxShadow: isLight
          ? "0 12px 32px -12px rgba(15, 23, 42, 0.18)"
          : "0 16px 48px -16px rgba(0, 0, 0, 0.85), 0 0 24px -8px rgba(99, 102, 241, 0.25)",
        color: isLight ? "#0d0e18" : "#f2f2f7",
        fontSize: "12px",
        backdropFilter: isLight ? "none" : "blur(12px)",
      },
      labelStyle: { color: isLight ? "#64748b" : "#9a9aaf", fontWeight: 600 },
      itemStyle: { color: isLight ? "#0d0e18" : "#f2f2f7" },
    },
    legend: {
      wrapperStyle: { fontSize: 10, color: isLight ? "#64748b" : "#9a9aaf", paddingTop: 8 },
    },
    series: {
      accent: isLight ? "#6366f1" : "#6366f1",
      accentSoft: isLight ? "#818cf8" : "#818cf8",
      success: isLight ? "#2dd4bf" : "#2dd4bf",
      warning: isLight ? "#fcd34d" : "#fcd34d",
      danger: isLight ? "#f87171" : "#f87171",
      info: isLight ? "#38bdf8" : "#6ecbff",
    },
    barRadius: /** @type {[number, number, number, number]} */ ([8, 8, 0, 0]),
    lineWidth: 2,
    dotRadius: 3,
    dotFill: "#0d0e18",
  };
}
