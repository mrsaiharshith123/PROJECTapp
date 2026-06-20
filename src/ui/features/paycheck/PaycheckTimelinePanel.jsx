import { Heading, Caption } from "../../index.js";
import { formatInr } from "../../../constants/symbols.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";

/**
 * @param {{ timeline: ReturnType<import('../../../engines/paycheckTimeline.js').buildPaycheckTimeline> }} props
 */
export default function PaycheckTimelinePanel({ timeline }) {
  const { t } = useTranslation();
  if (!timeline?.days?.length) return null;

  return (
    <section className="ct-stack">
      <Heading level={3}>{t("paycheck.timelineTitle")}</Heading>
      <Caption className="block">{t("paycheck.timelineSubtitle")}</Caption>
      <div className="ct-grid-2 gap-2 mt-2">
        <div className="ct-stat-tile amber">
          <p className="ct-stat-label">{t("paycheck.duesAfterSalary")}</p>
          <p className="ct-stat-value ct-numeral">{formatInr(timeline.totalDueBeforeNextSalary)}</p>
        </div>
        <div className="ct-stat-tile teal">
          <p className="ct-stat-label">{t("paycheck.bufferAfterBills")}</p>
          <p className="ct-stat-value ct-numeral">{formatInr(timeline.bufferAfterBills)}</p>
        </div>
      </div>
      <ul className="ct-stack-sm mt-2">
        {timeline.days.slice(0, 12).map((ev) => (
          <li key={`${ev.date}-${ev.type}-${ev.name || ""}`} className="ct-row-between gap-2 text-sm">
            <span>
              <span className="font-semibold">{ev.label}</span>
              {ev.type === "bill" && ev.name ? ` · ${ev.name}` : null}
              {ev.type === "salary" ? ` · ${t("paycheck.salaryCredit")}` : null}
            </span>
            <span className="ct-numeral font-semibold">{formatInr(ev.amount)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
