import { cn } from "../utils/cn.js";
import { ProgressBar } from "../patterns/ProgressBar.jsx";

export function HeroMonthCard({
  title,
  monthLabel,
  emoji,
  left,
  paid,
  due,
  paidPct,
  footerLeft,
  footerRight,
  footerRow2Left = undefined,
  footerRow2Right = undefined,
  statusLine = undefined,
  onClick,
  className = "",
}) {
  return (
    <button type="button" onClick={onClick} className={cn("ct-hero-month", className)} aria-label="Open analytics">
      <div className="ct-row-between px-1 pt-1 pb-2">
        <div className="text-left">
          <p className="ct-eyebrow">{title}</p>
          <p className="ct-caption mt-0.5">{monthLabel}</p>
        </div>
        <span className="text-2xl" aria-hidden>
          {emoji}
        </span>
      </div>

      <div className="ct-grid-3 gap-2 px-1">
        {[
          { label: "Left", value: left },
          { label: "Paid", value: paid, valueClass: "ct-hero-metric-success" },
          { label: "Due", value: due, valueClass: "ct-hero-metric-warn" },
        ].map((m) => (
          <div key={m.label} className="ct-hero-inset">
            <p className="ct-caption font-semibold uppercase">{m.label}</p>
            <p className={cn("ct-hero-metric mt-1", m.valueClass)}>{m.value}</p>
          </div>
        ))}
      </div>

      <div className="px-1 mt-3">
        <div className="ct-row-between ct-caption mb-1">
          <span>Month progress</span>
          <span>{paidPct}%</span>
        </div>
        <ProgressBar value={paidPct} />
      </div>

      <div className="ct-hero-inset mt-3 mx-1 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
        <p className="ct-body !text-xs">{footerLeft}</p>
        <p className="ct-body !text-xs text-right">{footerRight}</p>
        {footerRow2Left != null && <p className="ct-body !text-xs">{footerRow2Left}</p>}
        {footerRow2Right != null && <p className="ct-body !text-xs text-right">{footerRow2Right}</p>}
      </div>

      {statusLine ? (
        <p className="ct-hero-inset mt-2 mx-1 ct-body !text-xs text-center">{statusLine}</p>
      ) : null}

      <div className="ct-hero-wave" aria-hidden />
      <p className="ct-caption text-center pb-3 pt-2">Tap for full analytics →</p>
    </button>
  );
}

export default HeroMonthCard;
