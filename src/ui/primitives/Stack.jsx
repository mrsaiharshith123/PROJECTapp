export function Stack({ children, gap = "default", className = "" }) {
  const g = gap === "sm" ? "ct-stack-sm" : gap === "lg" ? "ct-stack-lg" : "ct-stack";
  return <div className={`${g} ${className}`.trim()}>{children}</div>;
}

export function Row({ children, between = false, className = "" }) {
  return <div className={`${between ? "ct-row-between" : "ct-row"} ${className}`.trim()}>{children}</div>;
}

export function Grid({ cols = 2, children, className = "" }) {
  const c = cols === 4 ? "ct-grid-4" : "ct-grid-2";
  return <div className={`${c} ${className}`.trim()}>{children}</div>;
}
