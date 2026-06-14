import { useMemo } from "react";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import {
  computeHouseholdSpendBreakdown,
  computeHouseholdCategorySpend,
} from "../../../engines/householdSpendBreakdown.js";
import { formatInr } from "../../../constants/symbols.js";
import { Card, Heading, Caption, Body } from "../../index.js";

const MEMBER_LABEL_KEYS = {
  self: "household.member.self",
  spouse: "household.member.spouse",
  shared: "household.member.shared",
  child: "household.member.child",
};

/** Who spends more + household categories — Analytics house view. */
export default function HouseholdSpendPanel() {
  const { t } = useTranslation();
  const { commitments, dailySpends, getEffectiveStatus, todayStr } = useCommitTrack();

  const memberRows = useMemo(
    () =>
      computeHouseholdSpendBreakdown(commitments, dailySpends, todayStr, getEffectiveStatus).sort(
        (a, b) => b.total - a.total,
      ),
    [commitments, dailySpends, todayStr, getEffectiveStatus],
  );

  const categoryRows = useMemo(
    () => computeHouseholdCategorySpend(commitments, dailySpends, todayStr, getEffectiveStatus),
    [commitments, dailySpends, todayStr, getEffectiveStatus],
  );

  if (!memberRows.length && !categoryRows.length) return null;

  return (
    <div className="ct-stack">
      {memberRows.length > 0 && (
        <Card className="ct-stack">
          <Heading level={3}>{t("analytics.household.spendByPerson")}</Heading>
          <Caption className="block">{t("analytics.household.spendByPersonHint")}</Caption>
          {memberRows.map((row, index) => (
            <div key={row.id} className="ct-row-between gap-2 py-2 border-b border-[var(--ct-border)] last:border-0">
              <div>
                <Body className="font-semibold">
                  {index === 0 ? `${t("analytics.household.topSpender")} · ` : ""}
                  {t(MEMBER_LABEL_KEYS[row.id] || "household.member.shared")}
                </Body>
                <Caption>
                  {t("analytics.household.billsAndVariable", {
                    bills: formatInr(row.bills),
                    variable: formatInr(row.variable),
                  })}
                </Caption>
              </div>
              <Body className="ct-numeral font-bold">{formatInr(row.total)}</Body>
            </div>
          ))}
        </Card>
      )}

      {categoryRows.length > 0 && (
        <Card className="ct-stack">
          <Heading level={3}>{t("analytics.household.spendByCategory")}</Heading>
          <Caption className="block">{t("analytics.household.spendByCategoryHint")}</Caption>
          {categoryRows.map((row) => (
            <div key={row.category} className="ct-row-between gap-2 py-2 border-b border-[var(--ct-border)] last:border-0">
              <Body className="font-semibold">{row.category}</Body>
              <Body className="ct-numeral font-semibold">{formatInr(Math.round(row.amount))}</Body>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
