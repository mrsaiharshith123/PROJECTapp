/** @typedef {"light" | "dark"} ChartThemeMode */

/** Neon minimal analytics theme — thin lines, soft grid, violet accent. */
/** @param {ChartThemeMode} mode */
export function getChartTheme(mode) {
  const isLight = mode === "light";
  return {
    colors: isLight
      ? ["#6d4aff", "#7c4dff", "#16a34a", "#d97706", "#0284c7", "#db2777", "#9333ea", "#94a3b8"]
      : ["#7c4dff", "#9b6dff", "#3be58f", "#ffb020", "#6ecbff", "#ff4d6d", "#b794ff", "#6e6e82"],
    tick: { fontSize: 10, fill: isLight ? "#64748b" : "#9a9aaf" },
    grid: {
      stroke: isLight ? "rgba(15, 23, 42, 0.06)" : "rgba(155, 109, 255, 0.08)",
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
      accent: "#7c4dff",
      accentSoft: isLight ? "#8b6cff" : "#9b6dff",
      success: isLight ? "#16a34a" : "#3be58f",
      warning: isLight ? "#d97706" : "#ffb020",
      info: isLight ? "#0284c7" : "#6ecbff",
    },
    barRadius: /** @type {[number, number, number, number]} */ ([8, 8, 0, 0]),
    lineWidth: 2,
    dotRadius: 3,
  };
}
