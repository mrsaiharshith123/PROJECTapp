import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { useNetWorth } from "../../../context/NetWorthContext.jsx";
import { useCommitIntel } from "../../../hooks/useCommitIntel.js";
import { useStabilityIntel } from "../../../hooks/useStabilityIntel.js";
import { usePerovoScore } from "../../../hooks/usePerovoScore.js";
import { usePrivacyAmount } from "../../../hooks/usePrivacyAmount.js";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { yearlyBurdenFromCommitments } from "../../../engines/analyticsSeries.js";
import { PEROVO_PILLARS } from "../../../constants/metricTaxonomy.js";
import { getBillDisplayName } from "../../../utils/billDisplayName.js";
import { getTier } from "../../../utils/tierAccess.js";
import { EditorialMastheadRight } from "../../patterns/EditorialMastheadRight.jsx";
import { EngineGuard } from "../../primitives/EngineGuard.jsx";

/** Build sparkline SVG path from forecast rows */
function buildForecastPath(rows, w, h) {
  if (!rows || rows.length < 2) return "";
  const values = rows.map((r) => r.balance ?? r.cumulativeBalance ?? 0);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = ((i / (values.length - 1)) * w).toFixed(1);
    const y = (h - ((v - min) / range) * (h * 0.8)).toFixed(1);
    return `${x},${y}`;
  });
  return `M ${pts.join(" L ")}`;
}

function pillarColor(score) {
  if (score >= 70) return "var(--ed-green)";
  if (score >= 45) return "var(--ed-gold)";
  return "var(--ed-red)";
}

/**
 * @route /insights — Direction H editorial briefing
 * Full vertical scroll, no carousels, no swipe cards.
 */
export default function InsightsEditorialPage({ data }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { core } = useNetWorth();
  const { formatAmount, formatScore } = usePrivacyAmount();
  const { getEffectiveStatus, sortedCommitments, settings, effectiveSubscriptionTier } = usePerovo();
  const stable = useStabilityIntel();
  const perovo = usePerovoScore();
  const { stability, freeMoneyAfterBurden } = useCommitIntel();

  const score = perovo.score ?? stability?.score ?? 0;
  const scoreLabel = stability?.label ?? "Safe";
  const freeCash = freeMoneyAfterBurden ?? stability?.freeMoney ?? 0;
  const burdenRatio = stable.burdenRatio ?? 0;
  const runwayMonths = stable.survival?.survivalMonths ?? null;
  const scoreColor =
    score >= 70 ? "var(--ed-green)" : score >= 45 ? "var(--ed-gold)" : "var(--ed-red)";
  const ringDeg = Math.max(0, Math.min(360, (score / 100) * 360));

  const { biggestCat, highestRecurring } = useMemo(() => {
    const byCat = {};
    let highest = null;
    let highestAmt = 0;
    for (const c of sortedCommitments) {
      const status = getEffectiveStatus(c);
      if (status === "paid" || status === "upnext") continue;
      const amt = Number(c.amount ?? 0);
      const cat = c.category || "Other";
      byCat[cat] = (byCat[cat] || 0) + amt;
      if (amt > highestAmt) {
        highestAmt = amt;
        highest = c;
      }
    }
    const sorted = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
    return {
      biggestCat: sorted[0] ? { name: sorted[0][0], amount: sorted[0][1] } : null,
      highestRecurring: highest,
    };
  }, [sortedCommitments, getEffectiveStatus]);

  const overdueBills = useMemo(
    () => sortedCommitments.filter((c) => getEffectiveStatus(c) === "overdue").slice(0, 3),
    [sortedCommitments, getEffectiveStatus],
  );

  const yearlyBurden = useMemo(
    () => yearlyBurdenFromCommitments(sortedCommitments, getEffectiveStatus),
    [sortedCommitments, getEffectiveStatus],
  );

  const forecastPath = useMemo(
    () => buildForecastPath(data?.forecastSeries, 280, 56),
    [data?.forecastSeries],
  );
  const hasForecast = forecastPath.length > 0;

  const netPosition = (core?.totalAssets ?? 0) - (core?.totalLiabilities ?? 0);
  const netColor = netPosition >= 0 ? "var(--ed-green)" : "var(--ed-red)";

  const pillarStatus = (pScore) => {
    if (pScore >= 70) return t("insights.editorial.pillarStrong");
    if (pScore >= 45) return t("insights.editorial.pillarWatch");
    return t("insights.editorial.pillarAct");
  };

  const paycheckRows = data?.paycheckFlow
    ? [
        {
          label: data.incomeLabel || t("analytics.freeCashRemaining"),
          val: data.paycheckFlow.income,
          sub: null,
        },
        {
          label: t("analytics.recurringBills"),
          val: data.paycheckFlow.recurringMonthly ?? data.paycheckFlow.fixedMonthly,
          sub: t("insights.editorial.recurringSub"),
        },
        {
          label: t("analytics.freeCashRemaining"),
          val: data.paycheckFlow.freeCash,
          sub: t("insights.editorial.freeAfterDues"),
        },
      ].filter((r) => r.val != null)
    : [];

  const tier = getTier(settings, effectiveSubscriptionTier);

  return (
    <div className="ed-page-full">
      <header className="ed-masthead">
        <div className="ed-masthead-top">
          <div className="ed-masthead-brand">
            <h1 className="ed-title">{t("nav.insights")}</h1>
            <div className="ed-tagline">{t("analytics.hub.subtitle")}</div>
          </div>
          <EditorialMastheadRight tier={tier} />
        </div>
      </header>

      <EngineGuard>
      <div className="ed-ins-story">
        <div className="ed-ins-kicker">{t("insights.editorial.cashflowKicker")}</div>
        <div className="ed-ins-cols">
          <div className="ed-ins-col">
            <span className="ed-ins-col-label">{t("home.ed.statFree")}</span>
            <span
              className="ed-ins-col-val"
              style={{ color: freeCash > 0 ? "var(--ed-green)" : "var(--ed-red)" }}
            >
              {formatAmount(freeCash)}
            </span>
            <span className="ed-ins-col-meta">{t("insights.editorial.afterAllBills")}</span>
          </div>
          <div className="ed-ins-col">
            <span className="ed-ins-col-label">{t("home.ed.statBurden")}</span>
            <span
              className="ed-ins-col-val"
              style={{ color: burdenRatio > 0.6 ? "var(--ed-red)" : "var(--ed-ink)" }}
            >
              {(burdenRatio * 100).toFixed(0)}%
            </span>
            <span className="ed-ins-col-meta">{t("insights.editorial.ofIncome")}</span>
          </div>
          {runwayMonths != null ? (
            <div className="ed-ins-col">
              <span className="ed-ins-col-label">{t("home.ed.statRunway")}</span>
              <span
                className="ed-ins-col-val"
                style={{ color: runwayMonths > 3 ? "var(--ed-green)" : "var(--ed-gold)" }}
              >
                {runwayMonths > 99 ? "∞" : `${runwayMonths.toFixed(1)}`}
              </span>
              <span className="ed-ins-col-meta">{t("insights.editorial.months")}</span>
            </div>
          ) : null}
        </div>

        {hasForecast ? (
          <>
            <svg
              viewBox="0 0 280 56"
              className="ed-ins-sparkline"
              aria-hidden="true"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="insGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--ed-green)" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="var(--ed-green)" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={`${forecastPath} L 280,56 L 0,56 Z`} fill="url(#insGrad)" />
              <path
                d={forecastPath}
                fill="none"
                stroke="var(--ed-green)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="ed-ins-body" style={{ display: "block", marginTop: 0 }}>
              {t("insights.editorial.forecastLabel")}
            </span>
          </>
        ) : (
          <p className="ed-ins-empty" style={{ marginTop: 10 }}>
            {t("insights.editorial.forecastEmpty")}
          </p>
        )}
      </div>

      {paycheckRows.length > 0 ? (
        <div className="ed-ins-story ed-ins-story--rows">
          <div className="ed-ins-kicker">{t("insights.editorial.paycheckKicker")}</div>
          {paycheckRows.map((row) => (
            <div key={row.label} className="ed-profile-sheet-row ed-profile-sheet-row--static">
              <span className="ed-profile-sheet-row-label">
                {row.label}
                {row.sub ? <span className="ed-caption" style={{ display: "block", marginTop: 2 }}>{row.sub}</span> : null}
              </span>
              <span className="ed-profile-sheet-row-value">{formatAmount(row.val)}</span>
            </div>
          ))}
          <button type="button" className="ed-ins-link" onClick={() => navigate("/insights/spending")}>
            {t("insights.editorial.paycheckFlow")}
          </button>
        </div>
      ) : null}

      {overdueBills.length > 0 ? (
        <div className="ed-ins-story">
          <div className="ed-ins-kicker">{t("insights.editorial.overdue")}</div>
          {overdueBills.map((c) => (
            <button
              key={c.id}
              type="button"
              className="ed-ins-row"
              onClick={() => navigate("/ledger/bills")}
            >
              <div className="ed-ins-row-left">
                <div className="ed-ins-row-cat">{c.category || t("insights.editorial.billFallback")}</div>
                <div className="ed-ins-row-name">{getBillDisplayName(c)}</div>
              </div>
              <div className="ed-ins-row-val danger">{formatAmount(Number(c.amount ?? 0))}</div>
            </button>
          ))}
          <button type="button" className="ed-ins-link" onClick={() => navigate("/ledger/bills")}>
            {t("insights.editorial.viewAllBills")}
          </button>
        </div>
      ) : null}

      <div className="ed-ins-story">
        <div className="ed-ins-kicker">{t("insights.editorial.scoreKicker")}</div>
        <button type="button" className="ed-ins-score" onClick={() => navigate("/insights/score")}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              flexShrink: 0,
              background: `conic-gradient(${scoreColor} 0deg ${ringDeg}deg, var(--ed-rule) ${ringDeg}deg 360deg)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: "var(--ed-bg)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  fontFamily: "'Fraunces', Georgia, serif",
                  fontSize: 14,
                  fontWeight: 700,
                  color: "var(--ed-ink)",
                  lineHeight: 1,
                }}
              >
                {formatScore(score)}
              </span>
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="ed-ins-score-label">{scoreLabel}</div>
            <div className="ed-ins-score-sub">
              {t("perovoScore.title")} · {t("home.position.trendBuilding")}
            </div>
          </div>
          <span className="ed-ins-link" style={{ padding: 0 }}>
            {t("scoreDetail.fullBreakdown")}
          </span>
        </button>

        {perovo.pillars ? (
          <div className="ed-ins-pillars" style={{ marginTop: 14 }}>
            {PEROVO_PILLARS.map((pillar) => {
              const p = perovo.pillars[pillar.id];
              const pScore = p?.score ?? 0;
              let displayVal = `${pScore}`;
              if (pillar.id === "debt") {
                displayVal = `${(((core?.totalLiabilities ?? 0) / Math.max(core?.totalAssets ?? 1, 1)) * 100).toFixed(0)}%`;
              }
              if (pillar.id === "savings" && runwayMonths != null) {
                displayVal = `${Number(runwayMonths).toFixed(1)}${t("scoreDetail.monthsShort")}`;
              }
              return (
                <div key={pillar.id} className="ed-ins-pillar">
                  <div className="ed-ins-pillar-lbl">{t(`perovoScore.pillar.${pillar.id}`)}</div>
                  <div className="ed-ins-pillar-val" style={{ color: pillarColor(pScore) }}>
                    {displayVal}
                  </div>
                  <div className="ed-ins-pillar-status">{pillarStatus(pScore)}</div>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>

      <div className="ed-ins-story">
        <div className="ed-ins-kicker">{t("insights.editorial.spendingKicker")}</div>
        {biggestCat ? (
          <button type="button" className="ed-ins-row" onClick={() => navigate("/insights/spending")}>
            <div className="ed-ins-row-left">
              <div className="ed-ins-row-cat">{t("insights.editorial.biggestCategory")}</div>
              <div className="ed-ins-row-name">{biggestCat.name}</div>
            </div>
            <div className="ed-ins-row-val">{formatAmount(biggestCat.amount)}</div>
          </button>
        ) : (
          <p className="ed-ins-empty">{t("insights.editorial.spendingEmpty")}</p>
        )}
        {highestRecurring ? (
          <button type="button" className="ed-ins-row" onClick={() => navigate("/ledger/bills")}>
            <div className="ed-ins-row-left">
              <div className="ed-ins-row-cat">{t("insights.editorial.highestRecurring")}</div>
              <div className="ed-ins-row-name">{getBillDisplayName(highestRecurring)}</div>
              <div className="ed-ins-row-sub">
                {formatAmount(Number(highestRecurring.amount ?? 0))} — {t("insights.editorial.everyMonth")}
              </div>
            </div>
            <div className="ed-ins-row-val">{formatAmount(Number(highestRecurring.amount ?? 0))}</div>
          </button>
        ) : null}
        <button type="button" className="ed-ins-link" onClick={() => navigate("/insights/spending")}>
          {t("insights.editorial.spendingBreakdown")}
        </button>
      </div>

      <div className="ed-ins-story">
        <div className="ed-ins-kicker">{t("insights.editorial.yearlyKicker")}</div>
        <div className="ed-ins-bignum">{formatAmount(yearlyBurden)}</div>
        <p className="ed-ins-body">{t("analytics.yearly.burdenHint")}</p>
        <button type="button" className="ed-ins-link" onClick={() => navigate("/insights/spending/yearly")}>
          {t("insights.editorial.yearlyDetail")}
        </button>
      </div>

      <div className="ed-ins-story">
        <div className="ed-ins-kicker">{t("insights.editorial.networthKicker")}</div>
        <div className="ed-ins-worth">
          <div className="ed-ins-worth-item">
            <div className="ed-ins-col-label">{t("home.position.assets")}</div>
            <div className="ed-ins-col-val" style={{ color: "var(--ed-green)" }}>
              {formatAmount(core?.totalAssets ?? 0)}
            </div>
          </div>
          <div className="ed-ins-worth-item">
            <div className="ed-ins-col-label">{t("home.position.liabilities")}</div>
            <div className="ed-ins-col-val" style={{ color: "var(--ed-red)" }}>
              {formatAmount(core?.totalLiabilities ?? 0)}
            </div>
          </div>
          <div className="ed-ins-worth-item">
            <div className="ed-ins-col-label">{t("insights.editorial.netLabel")}</div>
            <div className="ed-ins-col-val" style={{ color: netColor }}>
              {netPosition < 0 ? "−" : ""}
              {formatAmount(Math.abs(netPosition))}
            </div>
          </div>
        </div>
        <button type="button" className="ed-ins-link" onClick={() => navigate("/insights/networth")}>
          {t("insights.editorial.networthBreakdown")}
        </button>
      </div>

      <div className="ed-ins-story" style={{ borderBottom: "none" }}>
        <div className="ed-ins-kicker">{t("insights.advanced.title")}</div>
        <p className="ed-ins-body">{t("insights.advanced.hubHint")}</p>
        <button type="button" className="ed-ins-link" onClick={() => navigate("/insights/advanced")}>
          {t("insights.advanced.hubCta")}
        </button>
      </div>
      </EngineGuard>
      <div className="ed-safe-bottom" />
    </div>
  );
}
