import Card from "../../Card.jsx";
import { formatInr } from "../../../constants/symbols.js";

export default function StressContributorsCard({ stress }) {
  if (!stress?.top?.length) return null;
  return (
    <Card className="space-y-3">
      <h2 className="text-base font-semibold text-gray-800 dark:text-slate-100">Pressure sources</h2>
      <p className="text-xs text-gray-500 dark:text-slate-400">What weighs on your month most</p>
      <ol className="space-y-2">
        {stress.top.map((r, i) => (
          <li key={r.id} className="flex items-center justify-between gap-2 text-sm">
            <span className="text-gray-700 dark:text-slate-300 truncate">
              {i + 1}. {r.name}
              <span className="text-gray-400 text-xs ml-1">({r.category})</span>
            </span>
            <span className="font-semibold text-gray-900 dark:text-slate-100 shrink-0">
              {formatInr(Math.round(r.weight))}/mo
            </span>
          </li>
        ))}
      </ol>
    </Card>
  );
}
