import Card from "../../Card.jsx";
import InfoTip from "../../InfoTip.jsx";
import { CALC_HELP } from "../../../constants/calculationHelp.js";
import { formatInr } from "../../../constants/symbols.js";

export default function EmergencyFundCard({ emergency }) {
  if (!emergency) return null;
  return (
    <Card className="space-y-3">
      <h2 className="text-base font-semibold text-gray-800 dark:text-slate-100 inline-flex items-center">
        Emergency reserve
        <InfoTip text={CALC_HELP.emergencyReserve} />
      </h2>
      <p className="text-xs text-gray-500 dark:text-slate-400">{emergency.message}</p>
      <div className="h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-emerald-500 rounded-full transition-all"
          style={{ width: `${Math.min(100, emergency.progressPercent)}%` }}
        />
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs text-center">
        <div>
          <p className="text-gray-500">Current</p>
          <p className="font-semibold">{formatInr(emergency.current)}</p>
        </div>
        <div>
          <p className="text-gray-500">Target</p>
          <p className="font-semibold">{formatInr(emergency.recommended)}</p>
        </div>
        <div>
          <p className="text-gray-500">Gap</p>
          <p className="font-semibold">{formatInr(emergency.gap)}</p>
        </div>
      </div>
    </Card>
  );
}


