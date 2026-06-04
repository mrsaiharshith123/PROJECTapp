/** @typedef {"light" | "dark"} ChartThemeMode */

/** @param {ChartThemeMode} mode */
export function getChartTheme(mode) {
  const isLight = mode === "light";
  return {
    colors: isLight
      ? ["#6d4aff", "#7c5cff", "#16a34a", "#d97706", "#0284c7", "#db2777", "#9333ea", "#94a3b8"]
      : ["#7c5cff", "#9178ff", "#22c55e", "#f59e0b", "#38bdf8", "#ec4899", "#a78bfa", "#6e7b91"],
    tick: { fontSize: 11, fill: isLight ? "#64748b" : "#6e7b91" },
    grid: { stroke: isLight ? "rgba(15, 23, 42, 0.08)" : "rgba(255, 255, 255, 0.08)", strokeDasharray: "4 4" },
    tooltip: {
      contentStyle: {
        backgroundColor: isLight ? "#ffffff" : "#1a1a2e",
        border: isLight ? "1px solid rgba(15, 23, 42, 0.12)" : "1px solid rgba(124, 92, 255, 0.45)",
        borderRadius: "12px",
        boxShadow: isLight
          ? "0 12px 32px -12px rgba(15, 23, 42, 0.2)"
          : "0 12px 40px -12px rgba(0,0,0,0.75)",
        color: isLight ? "#1a1d2e" : "#f5f7fa",
        fontSize: "12px",
      },
      labelStyle: { color: isLight ? "#64748b" : "#a8b2c7", fontWeight: 600 },
      itemStyle: { color: isLight ? "#1a1d2e" : "#f5f7fa" },
    },
    legend: {
      wrapperStyle: { fontSize: 11, color: isLight ? "#64748b" : "#a8b2c7", paddingTop: 8 },
    },
    series: {
      accent: "#7c5cff",
      accentSoft: isLight ? "#8b6cff" : "#9178ff",
      success: isLight ? "#16a34a" : "#22c55e",
      warning: isLight ? "#d97706" : "#f59e0b",
      info: isLight ? "#0284c7" : "#38bdf8",
    },
    barRadius: /** @type {[number, number, number, number]} */ ([6, 6, 0, 0]),
  };
}
