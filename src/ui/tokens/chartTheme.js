/** @typedef {"light" | "dark"} ChartThemeMode */

/** Neon minimal analytics theme — thin lines, soft grid, violet accent. */
/** @param {ChartThemeMode} mode */
export function getChartTheme(mode) {
  const isLight = mode === "light";
  return {
    colors: isLight
      ? ["#6d4aff", "#5b4dff", "#10b981", "#d97706", "#0284c7", "#db2777", "#7c4dff", "#8b93a7"]
      : ["#5b4dff", "#9b6dff", "#34d399", "#ffb020", "#6ecbff", "#ff4d6d", "#b8a8ff", "#7a7894"],
    tick: { fontSize: 10, fill: isLight ? "#8b93a7" : "#9a97b0" },
    grid: {
      stroke: isLight ? "rgba(15, 23, 42, 0.06)" : "rgba(124, 92, 255, 0.08)",
      strokeDasharray: "3 6",
    },
    tooltip: {
      contentStyle: {
        backgroundColor: isLight ? "#ffffff" : "rgba(18, 18, 37, 0.94)",
        border: isLight ? "1px solid rgba(15, 23, 42, 0.1)" : "1px solid rgba(124, 77, 255, 0.35)",
        borderRadius: "14px",
        boxShadow: isLight
          ? "0 12px 32px -12px rgba(15, 23, 42, 0.18)"
          : "0 16px 48px -16px rgba(0, 0, 0, 0.85), 0 0 24px -8px rgba(124, 77, 255, 0.25)",
        color: isLight ? "#12121f" : "#f2f2f7",
        fontSize: "12px",
        backdropFilter: isLight ? "none" : "blur(12px)",
      },
      labelStyle: { color: isLight ? "#64748b" : "#9a9aaf", fontWeight: 600 },
      itemStyle: { color: isLight ? "#12121f" : "#f2f2f7" },
    },
    legend: {
      wrapperStyle: { fontSize: 10, color: isLight ? "#64748b" : "#9a9aaf", paddingTop: 8 },
    },
    series: {
      accent: isLight ? "#6d4aff" : "#5b4dff",
      accentSoft: isLight ? "#7c4dff" : "#9b6dff",
      success: isLight ? "#10b981" : "#34d399",
      warning: isLight ? "#d97706" : "#ffb020",
      info: isLight ? "#0284c7" : "#6ecbff",
    },
    barRadius: /** @type {[number, number, number, number]} */ ([8, 8, 0, 0]),
    lineWidth: 2,
    dotRadius: 3,
  };
}
