import Verdict from "./Verdict.jsx";

export default function VehicleDetailSections({ entry: _entry, intel, formatAmount, t }) {
  if (!intel.isVehicle || intel.vehicleEstimate == null) return null;
  return (
    <>
        <div className="ed-ins-story">
          <div className="ed-ins-kicker">{t("wealthDetail.vehicle.depreciation")}</div>
          <div className="ed-ins-cols">
            <div className="ed-ins-col">
              <span className="ed-ins-col-label">{t("wealthDetail.vehicle.marketEstimate")}</span>
              <span className="ed-ins-col-val" style={{ color: "var(--ed-red)" }}>
                {formatAmount(intel.vehicleEstimate)}
              </span>
            </div>
            {intel.gain != null ? (
              <div className="ed-ins-col">
                <span className="ed-ins-col-label">{t("wealthDetail.vehicle.depreciationLabel")}</span>
                <span className="ed-ins-col-val" style={{ color: "var(--ed-red)" }}>
                  {formatAmount(Math.abs(intel.gain))}
                </span>
                {intel.gainPct != null ? (
                  <span className="ed-ins-col-meta">
                    {t("wealthDetail.vehicle.lostPct", { pct: intel.gainPct })}
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
          <p className="ed-ins-body" style={{ marginTop: 8 }}>
            {t("wealthDetail.vehicle.depreciationNote")}
          </p>
          <Verdict t={t} verdict="review" reasonKey="wealthDetail.vehicle.reviewReason" />
        </div>
    </>
  );
}
