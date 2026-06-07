import { Caption, Body } from "../../primitives/Text.jsx";

/**
 * @param {{ label: string, value: import('react').ReactNode, hint?: string, tone?: 'default' | 'positive' | 'caution' }} props
 */
export default function AdminMetricCard({ label, value, hint, tone = "default" }) {
  return (
    <div className={`ct-admin-metric ct-admin-metric-${tone}`}>
      <Caption className="block ct-admin-metric-label">{label}</Caption>
      <Body className="ct-admin-metric-value">{value}</Body>
      {hint ? <Caption className="block ct-admin-metric-hint">{hint}</Caption> : null}
    </div>
  );
}
