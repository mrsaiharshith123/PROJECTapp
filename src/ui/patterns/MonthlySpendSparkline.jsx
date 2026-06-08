import { ResponsiveContainer, LineChart, Line, YAxis, ReferenceLine } from "recharts";
import { salarySpendBarColor } from "../../utils/salarySpendBar.js";

/**
 * Small bottom sparkline — cumulative spend through the month vs salary cap.
 * @param {{ data: { day: number, value: number }[], salary: number, spendPct: number, overBudget?: boolean }} props
 */
export function MonthlySpendSparkline({ data, salary, spendPct, overBudget = false }) {
  if (!data?.length) return null;

  const color =
    overBudget || spendPct >= 100 ? "#ef4444" : salarySpendBarColor(spendPct);
  const cap = Math.max(salary || 0, ...data.map((d) => d.value), 1);

  return (
    <div className="ct-hero-spend-chart" aria-hidden>
      <ResponsiveContainer width="100%" height={56}>
        <LineChart data={data} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
          <YAxis domain={[0, cap]} hide />
          {salary > 0 && (
            <ReferenceLine
              y={salary}
              stroke="rgba(155, 109, 255, 0.35)"
              strokeDasharray="4 4"
              strokeWidth={1}
            />
          )}
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2.5}
            dot={false}
            isAnimationActive
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
