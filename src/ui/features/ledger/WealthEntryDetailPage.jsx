import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { useNetWorth } from "../../../context/NetWorthContext.jsx";
import { usePrivacyAmount } from "../../../hooks/usePrivacyAmount.js";
import { buildWealthEntryIntel } from "../../../engines/wealthEntryIntel.js";
import { formatHoldingPeriod } from "../../../utils/netWorth/physicalAssetHelpers.js";
import WealthEntryModal from "../netWorth/WealthEntryModal.jsx";

/** @route /insights/entry/:id */
export default function WealthEntryDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { settings } = usePerovo();
  const { entries, updateEntry } = useNetWorth();
  const { formatAmount } = usePrivacyAmount();
  const [editOpen, setEditOpen] = useState(false);

  const entry = useMemo(() => entries.find((e) => e.id === id), [entries, id]);
  const intel = useMemo(
    () => (entry ? buildWealthEntryIntel(entry, settings) : null),
    [entry, settings],
  );

  if (!entry || !intel) {
    return (
      <div className="ct-page ed-paper ed-ins-page">
        <div className="ed-ins-sub-mast">
          <button type="button" className="ed-ins-back" onClick={() => navigate(-1)}>
            {t("insights.subpages.back")}
          </button>
          <h1 className="ed-ins-sub-title">{t("wealthDetail.notFound")}</h1>
        </div>
      </div>
    );
  }

  const holding = intel.purchaseYear ? formatHoldingPeriod(intel.purchaseYear, t) : "";
  const chartData = intel.valueSeries.map((p) => ({ label: String(p.year), value: p.value }));
  const prop = intel.propertyIntel;

  return (
    <div className="ct-page ed-paper ed-ins-page">
      <div className="ed-ins-sub-mast">
        <button type="button" className="ed-ins-back" onClick={() => navigate(-1)}>
          {t("insights.subpages.back")}
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 className="ed-ins-sub-title">{entry.name}</h1>
          <p className="ed-ins-sub-sub">{t(intel.categoryLabelKey)}</p>
        </div>
        <button type="button" className="ed-ins-link" style={{ flexShrink: 0 }} onClick={() => setEditOpen(true)}>
          {t("common.edit")}
        </button>
      </div>

      <div className="ed-ins-story">
        <div className="ed-ins-kicker">{t("wealthDetail.currentValue")}</div>
        <div
          className="ed-ins-bignum"
          style={{ color: entry.kind === "liability" ? "var(--ed-red)" : "var(--ed-green)" }}
        >
          {formatAmount(entry.value || 0)}
        </div>
        {holding ? <p className="ed-ins-body">{holding}</p> : null}
      </div>

      {(intel.cagr != null || intel.gain != null) && (
        <div className="ed-ins-story">
          <div className="ed-ins-kicker">{t("wealthDetail.growth")}</div>
          <div className="ed-ins-cols">
            {intel.cagr != null ? (
              <div className="ed-ins-col">
                <span className="ed-ins-col-label">{t("wealthDetail.cagr")}</span>
                <span className="ed-ins-col-val" style={{ color: intel.cagr >= 0 ? "var(--ed-green)" : "var(--ed-red)" }}>
                  {intel.cagr >= 0 ? "+" : ""}
                  {intel.cagr.toFixed(1)}%
                </span>
              </div>
            ) : null}
            {intel.gain != null ? (
              <div className="ed-ins-col">
                <span className="ed-ins-col-label">{t("wealthDetail.totalGain")}</span>
                <span className="ed-ins-col-val">{formatAmount(intel.gain)}</span>
              </div>
            ) : null}
            {intel.gainPct != null ? (
              <div className="ed-ins-col">
                <span className="ed-ins-col-label">{t("wealthDetail.gainPct")}</span>
                <span className="ed-ins-col-val">{intel.gainPct}%</span>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {chartData.length > 1 ? (
        <div className="ed-ins-story">
          <div className="ed-ins-kicker">{t("wealthDetail.valueOverTime")}</div>
          <div style={{ width: "100%", height: 160 }}>
            <ResponsiveContainer>
              <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "var(--ed-ink-faint)" }} />
                <YAxis hide />
                <Tooltip formatter={(v) => formatAmount(Number(v))} />
                <Line type="monotone" dataKey="value" stroke="var(--ed-gold)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : null}

      {prop ? (
        <div className="ed-ins-story">
          <div className="ed-ins-kicker">{t("wealthDetail.property.analysis")}</div>
          {prop.locationLabel ? <p className="ed-ins-body">{prop.locationLabel}</p> : null}
          <div className="ed-ins-cols">
            {prop.purchasePrice > 0 ? (
              <div className="ed-ins-col">
                <span className="ed-ins-col-label">{t("wealthDetail.property.purchaseThen")}</span>
                <span className="ed-ins-col-val">{formatAmount(prop.purchasePrice)}</span>
              </div>
            ) : null}
            {prop.inflationAdjustedCost != null ? (
              <div className="ed-ins-col">
                <span className="ed-ins-col-label">{t("wealthDetail.property.inflationCostToday")}</span>
                <span className="ed-ins-col-val">{formatAmount(prop.inflationAdjustedCost)}</span>
              </div>
            ) : null}
            {prop.realReturn != null ? (
              <div className="ed-ins-col">
                <span className="ed-ins-col-label">{t("wealthDetail.property.realReturn")}</span>
                <span className="ed-ins-col-val">{prop.realReturn}%</span>
              </div>
            ) : null}
            {prop.vsBenchmark != null ? (
              <div className="ed-ins-col">
                <span className="ed-ins-col-label">{t("wealthDetail.property.vsBenchmark")}</span>
                <span className="ed-ins-col-val">
                  {prop.vsBenchmark >= 0 ? "+" : ""}
                  {prop.vsBenchmark}%
                </span>
              </div>
            ) : null}
            {prop.yieldPct != null ? (
              <div className="ed-ins-col">
                <span className="ed-ins-col-label">{t("wealthDetail.property.rentYield")}</span>
                <span className="ed-ins-col-val">{prop.yieldPct}%</span>
              </div>
            ) : null}
          </div>
          {prop.inflationAdjustedCost != null ? (
            <p className="ed-ins-body" style={{ marginTop: 8, fontSize: "0.85rem", opacity: 0.85 }}>
              {t("wealthDetail.property.inflationCostHint")}
            </p>
          ) : null}
          {prop.realReturn != null && prop.inflationPct != null ? (
            <p className="ed-ins-body" style={{ marginTop: 8, fontSize: "0.85rem", opacity: 0.85 }}>
              {t("wealthDetail.property.realReturnNote", { inflation: prop.inflationPct })}
            </p>
          ) : null}
          <p className="ed-ins-body" style={{ marginTop: 10, fontWeight: 600 }}>
            {t(prop.holdLabelKey)}
          </p>
          <p className="ed-ins-body">{t(prop.holdDetailKey)}</p>
          {prop.narrativeKeys?.length ? (
            <div style={{ marginTop: 12 }}>
              <div className="ed-ins-kicker" style={{ marginBottom: 8 }}>
                {t("wealthDetail.property.deepAnalysis")}
              </div>
              <ul className="ed-ins-body" style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 8 }}>
                {prop.narrativeKeys.map((item) => (
                  <li key={item.id}>{t(item.id, item.params)}</li>
                ))}
              </ul>
            </div>
          ) : null}
          <p className="ed-ins-body" style={{ fontStyle: "italic", marginTop: 12 }}>
            {t(prop.developmentOutlookKey, {
              area: prop.outlookArea || t("wealthDetail.property.outlookAreaFallback"),
            })}
          </p>
          {prop.yearsToTarget != null && prop.yearsToTarget <= 10 ? (
            <p className="ed-ins-body">{t("wealthDetail.property.yearsToTarget", { years: prop.yearsToTarget })}</p>
          ) : null}
          {prop.hasPin ? (
            <a
              className="ed-ins-link"
              href={`https://www.openstreetmap.org/?mlat=${prop.latitude}&mlon=${prop.longitude}#map=16/${prop.latitude}/${prop.longitude}`}
              target="_blank"
              rel="noreferrer"
            >
              {t("wealthDetail.map.openInMaps")}
            </a>
          ) : (
            <p className="ed-ins-empty">{t("wealthDetail.map.noPin")}</p>
          )}
        </div>
      ) : null}

      {intel.isVehicle && intel.vehicleEstimate != null ? (
        <div className="ed-ins-story">
          <div className="ed-ins-kicker">{t("wealthDetail.vehicle.title")}</div>
          <p className="ed-ins-body">
            {t("wealthDetail.vehicle.estimate", { amount: formatAmount(intel.vehicleEstimate) })}
          </p>
        </div>
      ) : null}

      {entry.kind === "liability" && (intel.emi > 0 || intel.interestRate > 0) ? (
        <div className="ed-ins-story">
          <div className="ed-ins-kicker">{t("wealthDetail.liability.title")}</div>
          <div className="ed-ins-cols">
            {intel.emi > 0 ? (
              <div className="ed-ins-col">
                <span className="ed-ins-col-label">{t("netWorth.form.emi")}</span>
                <span className="ed-ins-col-val">{formatAmount(intel.emi)}/mo</span>
              </div>
            ) : null}
            {intel.emiBurdenPct != null ? (
              <div className="ed-ins-col">
                <span className="ed-ins-col-label">{t("wealthDetail.liability.emiBurden")}</span>
                <span className="ed-ins-col-val">{intel.emiBurdenPct}%</span>
              </div>
            ) : null}
            {intel.interestRate > 0 ? (
              <div className="ed-ins-col">
                <span className="ed-ins-col-label">{t("netWorth.form.interestRate")}</span>
                <span className="ed-ins-col-val">{intel.interestRate}%</span>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {intel.isInstrument && intel.instrumentMaturityYears != null ? (
        <div className="ed-ins-story">
          <div className="ed-ins-kicker">{t("wealthDetail.instrument.title")}</div>
          <p className="ed-ins-body">
            {t("wealthDetail.instrument.maturityYears", { years: intel.instrumentMaturityYears })}
          </p>
        </div>
      ) : null}

      {entry.notes ? (
        <div className="ed-ins-story" style={{ borderBottom: "none" }}>
          <div className="ed-ins-kicker">{t("netWorth.form.notes")}</div>
          <p className="ed-ins-body">{entry.notes}</p>
        </div>
      ) : null}

      <WealthEntryModal
        open={editOpen}
        kind={entry.kind}
        entry={entry}
        onClose={() => setEditOpen(false)}
        onSave={(payload) => updateEntry(entry.id, payload)}
      />
    </div>
  );
}
