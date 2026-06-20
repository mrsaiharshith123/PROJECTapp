import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Caption } from "../../index.js";
import { formatInr } from "../../../constants/symbols.js";
import { computeSafeToSpendDaily } from "../../../engines/safeToSpend.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";

/** Daily safe-to-spend until next salary credit. */
export default function SafeToSpendCard({
  bufferAfterBills,
  salaryCreditDay,
  todayStr,
  compact = false,
  scope = "personal",
}) {
  const { t } = useTranslation();
  const titleKey =
    scope === "household" ? "paycheck.safeToSpendTitleHousehold" : "paycheck.safeToSpendTitle";
  const hintKey =
    scope === "household" ? "paycheck.safeToSpendHintHousehold" : "paycheck.safeToSpendHint";
  const safe = useMemo(
    () =>
      computeSafeToSpendDaily({
        bufferAfterBills,
        salaryCreditDay,
        todayStr,
      }),
    [bufferAfterBills, salaryCreditDay, todayStr],
  );

  if (!salaryCreditDay || safe.daily <= 0) return null;

  if (compact) {
    return (
      <div className="ct-stat-tile teal !p-3">
        <div className="ct-row-between gap-2">
          <div>
            <p className="ct-stat-label">{t(titleKey)}</p>
            <p className="ct-stat-value ct-numeral">
              {formatInr(safe.daily)}
              <span className="text-xs font-normal opacity-75"> /{t("paycheck.perDay")}</span>
            </p>
          </div>
          <Link to="/paycheck" className="ct-link !text-xs shrink-0">
            {t("paycheck.viewTimeline")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="ct-hero-card wealth relative">
      <div className="ct-hero-glow teal" aria-hidden />
      <p className="ct-hero-label">{t(titleKey)}</p>
      <p className="ct-hero-number ct-numeral relative">
        {formatInr(safe.daily)}
        <span className="text-sm font-normal opacity-75"> /{t("paycheck.perDay")}</span>
      </p>
      <Caption className="block relative opacity-90">
        {t(hintKey, { days: safe.daysUntilSalary ?? 0 })}
      </Caption>
      <Caption className="block relative mt-1 opacity-80">
        {t("paycheck.safeToSpendBuffer", { amount: formatInr(safe.bufferAfterBills) })}
      </Caption>
    </div>
  );
}
