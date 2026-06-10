import { useMemo, useState } from "react";
import { computeFdRdProjection } from "../../../engines/fdRdTracker.js";
import { formatInr } from "../../../constants/symbols.js";
import { Caption, Body, SegmentedControl } from "../../index.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";

/** FD / RD maturity projector — opened from Retirement tool on Home. */
export default function FdRdTrackerPanel() {
  const { t } = useTranslation();
  const [kind, setKind] = useState("fd");
  const [principal, setPrincipal] = useState("");
  const [monthlyDeposit, setMonthlyDeposit] = useState("");
  const [rate, setRate] = useState("7");
  const [tenure, setTenure] = useState("12");

  const projection = useMemo(
    () =>
      computeFdRdProjection({
        principal: Number(principal) || 0,
        annualRate: Number(rate) || 0,
        tenureMonths: Number(tenure) || 12,
        isRd: kind === "rd",
        monthlyDeposit: Number(monthlyDeposit) || 0,
      }),
    [principal, rate, tenure, kind, monthlyDeposit],
  );

  return (
    <div className="ct-stack">
      <Caption>{t("tier.fdrd.subtitle")}</Caption>
      <SegmentedControl
        options={[
          { id: "fd", label: t("tier.fdrd.fd") },
          { id: "rd", label: t("tier.fdrd.rd") },
        ]}
        value={kind}
        onChange={setKind}
      />
      {kind === "fd" ? (
        <div>
          <label className="ct-metric-label block">{t("tier.fdrd.principal")}</label>
          <input
            className="ct-input mt-1"
            value={principal}
            onChange={(e) => setPrincipal(e.target.value.replace(/[^\d]/g, ""))}
            inputMode="numeric"
          />
        </div>
      ) : (
        <div>
          <label className="ct-metric-label block">{t("tier.fdrd.monthlyDeposit")}</label>
          <input
            className="ct-input mt-1"
            value={monthlyDeposit}
            onChange={(e) => setMonthlyDeposit(e.target.value.replace(/[^\d]/g, ""))}
            inputMode="numeric"
          />
        </div>
      )}
      <div className="ct-row gap-3 flex-wrap">
        <div className="flex-1 min-w-[120px]">
          <label className="ct-metric-label block">{t("tier.fdrd.rate")}</label>
          <input
            className="ct-input mt-1"
            value={rate}
            onChange={(e) => setRate(e.target.value.replace(/[^\d.]/g, ""))}
            inputMode="decimal"
          />
        </div>
        <div className="flex-1 min-w-[120px]">
          <label className="ct-metric-label block">{t("tier.fdrd.tenure")}</label>
          <input
            className="ct-input mt-1"
            value={tenure}
            onChange={(e) => setTenure(e.target.value.replace(/[^\d]/g, ""))}
            inputMode="numeric"
          />
        </div>
      </div>
      <div className="ct-inset ct-stack-sm">
        <Body className="font-semibold">{t("tier.fdrd.maturity", { amount: formatInr(projection.maturityAmount) })}</Body>
        <Caption className="block">
          {t("tier.fdrd.invested", { amount: formatInr(projection.totalInvested) })} ·{" "}
          {t("tier.fdrd.interest", { amount: formatInr(projection.interestEarned) })}
        </Caption>
        {projection.narrativeLines.map((line) => (
          <Caption key={line} className="block">
            {line}
          </Caption>
        ))}
      </div>
    </div>
  );
}
