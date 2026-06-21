import { useMemo } from "react";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import {
  computeHouseholdSpendBreakdown,
  computeHouseholdCategorySpend,
} from "../../../engines/householdSpendBreakdown.js";
import { formatInr } from "../../../constants/symbols.js";
import { Heading, Caption, Body } from "../../index.js";
import { CtIcon } from "../../icons/CtIcon.jsx";

const MEMBER_LABEL_KEYS = {
  self: "household.member.self",
  spouse: "household.member.spouse",
  shared: "household.member.shared",
  child: "household.member.child",
};

/** Who spends more + household categories — Analytics house view. */
export default function HouseholdSpendPanel() {
  const { t } = useTranslation();
  const { commitments, dailySpends, getEffectiveStatus, todayStr } = usePerovo();

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

  const combinedSpend = memberRows.reduce((sum, row) => sum + row.total, 0);

  return (
    <div className="ct-stack">
      {memberRows.length > 0 && (
        <div className="ct-hero-card lending ct-stack relative">
          <div className="ct-hero-glow teal" aria-hidden />
          <div className="relative ct-stack-sm">
            <div className="ct-stat-tile teal">
              <p className="ct-stat-label">{t("analytics.household.combinedLabel")}</p>
              <p className="ct-stat-value ct-numeral" style={{ color: "#5eead4" }}>
                {formatInr(combinedSpend)}
              </p>
              <Caption className="block mt-0.5">{t("analytics.household.combinedSpendHint")}</Caption>
            </div>
          <div className="ct-row gap-3 items-start">
            <span className="ct-icon-tile violet shrink-0" aria-hidden>
              <CtIcon name="users-three" size={22} />
            </span>
            <div className="min-w-0">
              <Heading level={3} className="!text-base !font-semibold">
                {t("analytics.household.spendByPerson")}
              </Heading>
              <Caption className="block mt-0.5">{t("analytics.household.spendByPersonHint")}</Caption>
            </div>
          </div>
          <div className="relative ct-stack-sm">
            {memberRows.map((row, index) => (
              <div
                key={row.id}
                className={`ct-stat-tile ${index === 0 ? "teal" : "indigo"} ct-row-between gap-2 items-center`}
              >
                <div className="min-w-0">
                  <Body className="font-semibold text-sm">
                    {index === 0 ? `${t("analytics.household.topSpender")} · ` : ""}
                    {t(MEMBER_LABEL_KEYS[row.id] || "household.member.shared")}
                  </Body>
                  <Caption className="block ct-numeral">
                    {t("analytics.household.billsAndVariable", {
                      bills: formatInr(row.bills),
                      variable: formatInr(row.variable),
                    })}
                  </Caption>
                </div>
                <p className="ct-stat-value ct-numeral shrink-0">{formatInr(row.total)}</p>
              </div>
            ))}
          </div>
          </div>
        </div>
      )}

      {categoryRows.length > 0 && (
        <div className="ct-hero-card pressure ct-stack relative">
          <div className="ct-hero-glow" aria-hidden />
          <div className="ct-row gap-3 items-start relative">
            <span className="ct-icon-tile amber shrink-0" aria-hidden>
              <CtIcon name="chart-bar" size={22} />
            </span>
            <div className="min-w-0">
              <Heading level={3} className="!text-base !font-semibold">
                {t("analytics.household.spendByCategory")}
              </Heading>
              <Caption className="block mt-0.5">{t("analytics.household.spendByCategoryHint")}</Caption>
            </div>
          </div>
          <div className="relative ct-stack-sm">
            {categoryRows.map((row) => (
              <div key={row.category} className="ct-stat-tile indigo ct-row-between gap-2 items-center">
                <Body className="font-semibold text-sm truncate">{row.category}</Body>
                <p className="ct-stat-value ct-numeral shrink-0">{formatInr(Math.round(row.amount))}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
