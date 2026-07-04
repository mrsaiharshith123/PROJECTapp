import { Card } from "../primitives/Card.jsx";
import { Heading, Caption } from "../primitives/Text.jsx";

/**
 * @param {{
 *   title?: string,
 *   hint?: string,
 *   children: import('react').ReactNode,
 *   height?: number,
 *   className?: string,
 *   compact?: boolean,
 * }} props
 */
export function ChartShell({ title, hint, children, height = 240, className = "", compact = false }) {
  const showHead = Boolean(title || hint);
  return (
    <Card variant={compact ? "flat" : "default"} className={`ed-chart-shell ed-chart-shell ${className}`.trim()}>
      {showHead ? (
        <div className="ed-section-head">
          {title ? <Heading level={compact ? 4 : 3}>{title}</Heading> : null}
          {hint ? <Caption className="block mt-0.5">{hint}</Caption> : null}
        </div>
      ) : null}
      <div className="ed-chart-area" style={{ height }}>
        {children}
      </div>
    </Card>
  );
}

export default ChartShell;
