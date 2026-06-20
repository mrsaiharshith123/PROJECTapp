import { useMemo } from "react";
import { Heading, Caption } from "../../index.js";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { buildFamilyExpenseCalendar } from "../../../engines/familyCalendar.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { translateInsight } from "../../../i18n/insightLabels.js";
import { formatInr } from "../../../constants/symbols.js";
import { CtIcon } from "../../icons/CtIcon.jsx";

export default function FamilyCalendarWidget() {
  const { t } = useTranslation();
  const { commitments, getEffectiveStatus, todayStr } = usePerovo();

  const cal = useMemo(
    () => buildFamilyExpenseCalendar(commitments, todayStr, getEffectiveStatus, 6),
    [commitments, todayStr, getEffectiveStatus],
  );

  const heavyKeys = new Set((cal.heavyMonths || []).map((m) => m.monthKey));
  const peakMonth = (cal.months || []).reduce(
    (best, m) => (!best || m.amount > best.amount ? m : best),
    null,
  );

  return (
    <section className="ct-stack">
      <div className="ct-row gap-3 items-start">
        <span className="ct-icon-tile amber" aria-hidden>
          <CtIcon name="chart-bar" size={22} />
        </span>
        <Heading level={3}>{t("family.calendar.title")}</Heading>
      </div>

      {peakMonth ? (
        <div className="ct-hero-card survival">
          <div className="ct-hero-glow amber" aria-hidden />
          <p className="ct-hero-label relative">{peakMonth.label}</p>
          <p className="ct-hero-number ct-numeral relative">{formatInr(Math.round(peakMonth.amount))}</p>
        </div>
      ) : null}

      <div className="ct-row-wrap">
        {(cal.months || []).slice(0, 6).map((m) => (
          <div
            key={m.monthKey}
            className={`ct-stat-tile ${heavyKeys.has(m.monthKey) ? "amber" : "indigo"}`}
            style={{ minWidth: "100px" }}
          >
            <p className="ct-stat-label">{m.label}</p>
            <p className="ct-stat-value ct-numeral">{formatInr(Math.round(m.amount))}</p>
          </div>
        ))}
      </div>

      {(cal.insights || []).map((ins) => (
        <Caption key={ins.id} className="block">
          {translateInsight(t, ins)}
        </Caption>
      ))}
    </section>
  );
}
