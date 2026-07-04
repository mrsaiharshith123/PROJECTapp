export function Stack({ children, gap = "default", className = "" }) {
  const g = gap === "sm" ? "ed-stack-sm" : gap === "lg" ? "ed-stack-lg" : "ed-stack";
  return <div className={`${g} ${className}`.trim()}>{children}</div>;
}

export function Row({ children, between = false, className = "" }) {
  return <div className={`${between ? "ed-row-between" : "ed-row"} ${className}`.trim()}>{children}</div>;
}

export function Grid({ cols = 2, children, className = "" }) {
  const c = cols === 4 ? "ed-grid-4" : "ed-grid-2";
  return <div className={`${c} ${className}`.trim()}>{children}</div>;
}
