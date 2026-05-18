import Card from "../../Card.jsx";
import { formatInr } from "../../../constants/symbols.js";
import InfoTip from "../../InfoTip.jsx";
import { CALC_HELP } from "../../../constants/calculationHelp.js";

/**
 * Unified pressure view: top bills + single payoff suggestion (no duplicate insight lines).
 */
export default function StressContributorsCard({ stress, payoffRec }) {
  if (!stress?.top?.length && !payoffRec) return null;

  const top = stress?.top?.[0];

  return (
    <Card className="space-y-3">
      <div>
        <h2 className="text-base font-semibold text-gray-800 dark:text-slate-100 inline-flex items-center">
          What weighs on you most
          <InfoTip text={CALC_HELP.monthlyBurden} />
        </h2>
        <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
          Biggest monthly commitments and what to tackle first
        </p>
      </div>

      {stress?.top?.length > 0 && (
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
      )}

      {payoffRec && top && payoffRec.commitmentId === top.id && (
        <p className="text-sm rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800 px-3 py-2 text-indigo-900 dark:text-indigo-100">
          <span className="font-semibold">Focus first:</span> {top.name} is your heaviest pressure and the top payoff
          pick (overdue, interest, and balance considered).
        </p>
      )}

      {payoffRec && (!top || payoffRec.commitmentId !== top.id) && (
        <p className="text-sm rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800 px-3 py-2 text-indigo-900 dark:text-indigo-100">
          <span className="font-semibold">Focus first:</span> {payoffRec.name} — pay this before smaller bills when you
          have extra cash.
        </p>
      )}
    </Card>
  );
}
