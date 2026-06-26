import { useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { buildSchoolFeeProfile } from "../../../engines/schoolFeeTracker.js";
import { formatInr } from "../../../constants/symbols.js";
import { Body, Caption, Button, ToneSurface } from "../../index.js";
import { CtIcon } from "../../icons/CtIcon.jsx";

export default function SchoolFeeCard() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { commitments, getEffectiveStatus, todayStr } = usePerovo();

  const profile = useMemo(
    () => buildSchoolFeeProfile(commitments, todayStr, getEffectiveStatus),
    [commitments, todayStr, getEffectiveStatus],
  );

  if (!profile.monthlyFees && !profile.yearlyFees && profile.upcomingFees.length === 0) return null;

  const overdueTotal = profile.overdueSchoolFees.reduce((s, c) => s + c.amount, 0);
  const heroAmount = overdueTotal > 0 ? overdueTotal : profile.monthlyFees || profile.totalAnnual;

  return (
    <section className="ct-hero-card school ct-stack">
      <div className="ct-hero-glow" aria-hidden />
      <div className="ct-row gap-3 relative">
        <span className="ct-icon-tile violet" aria-hidden>
          <CtIcon name="backpack" size={22} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="ct-hero-label">{t("family.school.heading")}</p>
          <p className="ct-hero-number ct-numeral">{formatInr(heroAmount)}</p>
          <Caption className="block mt-1">
            {overdueTotal > 0
              ? t("family.school.overdue", { amount: formatInr(overdueTotal) })
              : t("family.school.monthlyAnnual", {
                  monthly: formatInr(profile.monthlyFees),
                  annual: formatInr(profile.totalAnnual),
                })}
          </Caption>
        </div>
      </div>

      <div className="ct-grid-2 gap-2 relative">
        <div className="ct-stat-tile indigo">
          <p className="ct-stat-label">{t("family.school.monthlyLabel")}</p>
          <p className="ct-stat-value ct-numeral">{formatInr(profile.monthlyFees)}</p>
        </div>
        <div className="ct-stat-tile indigo">
          <p className="ct-stat-label">{t("family.school.annualLabel")}</p>
          <p className="ct-stat-value ct-numeral">{formatInr(profile.totalAnnual)}</p>
        </div>
      </div>

      {profile.admissionMonth ? (
        <ToneSurface tone="info">
          <Caption className="block">{t("family.school.admissionHint")}</Caption>
        </ToneSurface>
      ) : null}

      {profile.nextBigFee ? (
        <div className="ct-row-between gap-2 ct-stat-tile indigo relative">
          <div>
            <p className="ct-stat-label">{t("family.school.nextFee")}</p>
            <Body className="font-semibold">{profile.nextBigFee.name}</Body>
            <Caption>{profile.nextBigFee.dueDate || "—"}</Caption>
          </div>
          <Body className="font-semibold ct-numeral shrink-0">{formatInr(profile.nextBigFee.amount)}</Body>
        </div>
      ) : null}

      <Button type="button" variant="outline" size="sm" className="relative" onClick={() => navigate("/ledger/bills?filter=School")}>
        {t("family.school.viewAll")}
      </Button>
    </section>
  );
}
