import { useMemo, useState } from "react";
import { Caption, Heading } from "../../index.js";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { buildCashflowCalendar } from "../../../engines/cashflowCalendar.js";
import { combinedMonthlyIncome } from "../../../utils/combinedIncome.js";
import { formatInr } from "../../../constants/symbols.js";
import { cashflowDaysForTier } from "../../../utils/tierAccess.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { CtIcon } from "../../icons/CtIcon.jsx";

const PRESSURE_CLASS = {
  salary: "ct-cashflow-day ct-cashflow-salary",
  heavy: "ct-cashflow-day ct-cashflow-heavy",
  moderate: "ct-cashflow-day ct-cashflow-moderate",
  light: "ct-cashflow-day ct-cashflow-light",
  free: "ct-cashflow-day ct-cashflow-free",
};

export default function CashflowCalendarStrip() {
  const { t } = useTranslation();
  const { commitments, settings, getEffectiveStatus, todayStr } = usePerovo();
  const [selected, setSelected] = useState(null);
  const daysAhead = cashflowDaysForTier(settings);

  const cal = useMemo(
    () =>
      buildCashflowCalendar({
        commitments,
        getEffectiveStatus,
        todayStr,
        salaryCreditDay: settings.salaryCreditDay,
        income: combinedMonthlyIncome(settings),
        daysAhead,
      }),
    [commitments, getEffectiveStatus, todayStr, settings, daysAhead],
  );

  const active = selected ? cal.days.find((d) => d.date === selected) : null;

  return (
    <section className="ct-stack">
      <div className="ct-row gap-3 items-start">
        <span className="ct-icon-tile teal" aria-hidden>
          <CtIcon name="calendar" size={22} />
        </span>
        <div>
          <Heading level={3}>{t("tier.cashflow.title", { days: daysAhead })}</Heading>
          <Caption className="block">{t("tier.cashflow.subtitle")}</Caption>
        </div>
      </div>

      <div className="ct-cashflow-strip" role="list">
        {cal.days.map((d) => (
          <button
            key={d.date}
            type="button"
            role="listitem"
            className={PRESSURE_CLASS[d.pressure] || PRESSURE_CLASS.free}
            aria-pressed={selected === d.date}
            onClick={() => setSelected(selected === d.date ? null : d.date)}
          >
            <span className="ct-cashflow-day-label">{d.label}</span>
            {d.amount > 0 ? <span className="ct-cashflow-day-amt ct-numeral">{formatInr(d.amount)}</span> : null}
          </button>
        ))}
      </div>

      {active && active.items.length > 0 ? (
        <div className="ct-hero-card pressure ct-stack-sm">
          <div className="ct-hero-glow teal" aria-hidden />
          <p className="ct-hero-label relative">{active.label}</p>
          <p className="ct-hero-number ct-numeral relative">{formatInr(active.amount)}</p>
          <div className="relative ct-stack-sm">
            {active.items.map((it) => (
              <Caption key={`${active.date}-${it.name}`} className="block">
                {it.name} — <span className="ct-numeral">{formatInr(it.amount)}</span>
              </Caption>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
