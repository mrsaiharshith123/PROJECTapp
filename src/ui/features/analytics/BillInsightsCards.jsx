import { useMemo } from "react";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { getCategoryById } from "../../../constants/categories.js";
import { repeatTypeLabel } from "../../../constants/repeatTypes.js";
import { formatInr, EM_DASH } from "../../../constants/symbols.js";
import { computeBiggestOpenCategory, computeHighestRecurring } from "../../../utils/billInsightStats.js";
import { CtIcon } from "../../icons/CtIcon.jsx";

/**
 * @param {{ eyebrow: string, title?: import('react').ReactNode, detail?: string, empty?: string, icon?: string, tone?: "positive"|"warning"|"danger", iconTone?: string }} props
 */
function InsightStatCard({ eyebrow, title, detail, empty, icon, tone: _tone = "positive", iconTone = "violet" }) {
  return (
    <div className="ct-analytics-insight-card">
      <div className="ct-row gap-2 items-start">
        {icon ? (
          <span className={`ct-icon-tile ct-icon-tile-sm ${iconTone} shrink-0`} aria-hidden>
            <CtIcon name={icon} size={18} />
          </span>
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="ct-stat-label">{eyebrow}</p>
          {title ? (
            <>
              <p className="ct-stat-value truncate">{title}</p>
              {detail ? <p className="ct-stat-label mt-0.5 ct-numeral">{detail}</p> : null}
            </>
          ) : (
            <p className="ct-stat-label mt-0.5">{empty}</p>
          )}
        </div>
      </div>
    </div>
  );
}

/** Open-balance category + highest recurring bill — analytics context only. */
export default function BillInsightsCards() {
  const { t } = useTranslation();
  const { commitments, getEffectiveStatus } = usePerovo();

  const biggestCategory = useMemo(
    () => computeBiggestOpenCategory(commitments, getEffectiveStatus),
    [commitments, getEffectiveStatus],
  );

  const highestRecurring = useMemo(
    () => computeHighestRecurring(commitments),
    [commitments],
  );

  return (
    <div className="ct-grid-2 gap-2">
      <InsightStatCard
        eyebrow={t("home.biggestCategory")}
        tone="positive"
        iconTone="violet"
        icon={biggestCategory ? getCategoryById(biggestCategory.name).icon : undefined}
        title={biggestCategory ? getCategoryById(biggestCategory.name).label : undefined}
        detail={biggestCategory ? t("home.openAmount", { amount: formatInr(biggestCategory.value) }) : undefined}
        empty={t("home.noOpenBills")}
      />
      <InsightStatCard
        eyebrow={t("home.highestRecurring")}
        tone="warning"
        iconTone="amber"
        icon="arrows-clockwise"
        title={highestRecurring?.name}
        detail={
          highestRecurring
            ? `${formatInr(highestRecurring.amount)} ${EM_DASH} ${repeatTypeLabel(highestRecurring.repeatType)}`
            : undefined
        }
        empty={t("home.noRecurring")}
      />
    </div>
  );
}
