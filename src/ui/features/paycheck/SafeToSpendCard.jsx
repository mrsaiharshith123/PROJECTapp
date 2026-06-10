import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, Heading, Caption, Body } from "../../index.js";
import { formatInr } from "../../../constants/symbols.js";
import { computeSafeToSpendDaily } from "../../../engines/safeToSpend.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";

/** Daily safe-to-spend until next salary credit. */
export default function SafeToSpendCard({ bufferAfterBills, salaryCreditDay, todayStr, compact = false }) {
  const { t } = useTranslation();
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
      <Card className="ct-stack-sm !p-3">
        <div className="ct-row-between gap-2">
          <div>
            <Caption className="block font-semibold">{t("paycheck.safeToSpendTitle")}</Caption>
            <Body className="font-bold text-[var(--ct-accent)]">
              {formatInr(safe.daily)}
              <span className="text-xs font-normal text-[var(--ct-text-muted)]"> /{t("paycheck.perDay")}</span>
            </Body>
          </div>
          <Link to="/paycheck" className="ct-link !text-xs shrink-0">
            {t("paycheck.viewTimeline")}
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card className="ct-stack-sm">
      <Heading level={3}>{t("paycheck.safeToSpendTitle")}</Heading>
      <Caption className="block">{t("paycheck.safeToSpendHint", { days: safe.daysUntilSalary ?? 0 })}</Caption>
      <p className="text-2xl font-bold text-[var(--ct-accent)] ct-numeral">
        {formatInr(safe.daily)}
        <span className="text-sm font-normal text-[var(--ct-text-muted)]"> /{t("paycheck.perDay")}</span>
      </p>
      <Caption className="block">
        {t("paycheck.safeToSpendBuffer", { amount: formatInr(safe.bufferAfterBills) })}
      </Caption>
    </Card>
  );
}
