import { useMemo } from "react";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { getCategoryById } from "../../../constants/categories.js";
import { repeatTypeLabel } from "../../../constants/repeatTypes.js";
import { formatInr, EM_DASH } from "../../../constants/symbols.js";
import { computeBiggestOpenCategory, computeHighestRecurring } from "../../../utils/billInsightStats.js";
import { Card } from "../../primitives/Card.jsx";
import { Caption, Body } from "../../primitives/Text.jsx";
import { CtIcon } from "../../icons/CtIcon.jsx";

/**
 * @param {{ eyebrow: string, title?: import('react').ReactNode, detail?: string, empty?: string, icon?: string }} props
 */
function InsightStatCard({ eyebrow, title, detail, empty, icon }) {
  return (
    <Card>
      <Caption className="font-semibold uppercase tracking-wide mb-1">{eyebrow}</Caption>
      {title ? (
        <>
          <p className="ct-display ct-numeral text-lg flex items-center gap-2">
            {icon ? (
              <span className="inline-flex shrink-0" aria-hidden>
                <CtIcon name={icon} size={20} />
              </span>
            ) : null}
            {title}
          </p>
          {detail ? <Body className="!text-sm mt-1">{detail}</Body> : null}
        </>
      ) : (
        <Body className="!text-sm">{empty}</Body>
      )}
    </Card>
  );
}

/** Open-balance category + highest recurring bill — analytics context only. */
export default function BillInsightsCards() {
  const { t } = useTranslation();
  const { commitments, getEffectiveStatus } = useCommitTrack();

  const biggestCategory = useMemo(
    () => computeBiggestOpenCategory(commitments, getEffectiveStatus),
    [commitments, getEffectiveStatus],
  );

  const highestRecurring = useMemo(
    () => computeHighestRecurring(commitments),
    [commitments],
  );

  return (
    <div className="ct-grid-2">
      <InsightStatCard
        eyebrow={t("home.biggestCategory")}
        icon={biggestCategory ? getCategoryById(biggestCategory.name).icon : undefined}
        title={biggestCategory ? getCategoryById(biggestCategory.name).label : undefined}
        detail={biggestCategory ? t("home.openAmount", { amount: formatInr(biggestCategory.value) }) : undefined}
        empty={t("home.noOpenBills")}
      />
      <InsightStatCard
        eyebrow={t("home.highestRecurring")}
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
