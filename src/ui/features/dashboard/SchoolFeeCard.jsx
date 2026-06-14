import { useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { buildSchoolFeeProfile } from "../../../engines/schoolFeeTracker.js";
import { formatInr } from "../../../constants/symbols.js";
import { Card, Heading, Body, Caption, Button, ToneSurface } from "../../index.js";

export default function SchoolFeeCard() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { commitments, getEffectiveStatus, todayStr } = useCommitTrack();

  const profile = useMemo(
    () => buildSchoolFeeProfile(commitments, todayStr, getEffectiveStatus),
    [commitments, todayStr, getEffectiveStatus],
  );

  if (!profile.monthlyFees && !profile.yearlyFees && profile.upcomingFees.length === 0) return null;

  const overdueTotal = profile.overdueSchoolFees.reduce((s, c) => s + c.amount, 0);

  return (
    <Card variant="flat" className="ct-stack">
      <Heading level={3}>{t("family.school.heading")}</Heading>
      <Caption className="block">
        {t("family.school.monthlyAnnual", {
          monthly: formatInr(profile.monthlyFees),
          annual: formatInr(profile.totalAnnual),
        })}
      </Caption>

      {overdueTotal > 0 && (
        <ToneSurface tone="danger">
          <Body className="font-semibold">{t("family.school.overdue", { amount: formatInr(overdueTotal) })}</Body>
        </ToneSurface>
      )}

      {profile.admissionMonth && (
        <Caption className="block">{t("family.school.admissionHint")}</Caption>
      )}

      {profile.nextBigFee && (
        <div className="ct-row-between gap-2 ct-inset">
          <div>
            <Body className="font-semibold">{profile.nextBigFee.name}</Body>
            <Caption>{profile.nextBigFee.dueDate || "—"}</Caption>
          </div>
          <Body className="font-semibold ct-numeral">{formatInr(profile.nextBigFee.amount)}</Body>
        </div>
      )}

      <Button type="button" variant="outline" size="sm" onClick={() => navigate("/commitments?filter=School")}>
        {t("family.school.viewAll")}
      </Button>
    </Card>
  );
}
