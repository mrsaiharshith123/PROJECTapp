import { ResponsiveContainer, LineChart, Line } from "recharts";

export function NetWorthSparkline({ data }) {
  if (!data?.length) return null;
  const color = data[data.length - 1].value >= (data[0]?.value || 0) ? "#34d399" : "#f87171";
  return (
    <div className="ct-nw-sparkline" aria-hidden>
      <ResponsiveContainer width="100%" height={36}>
        <LineChart data={data}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
            isAnimationActive
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
