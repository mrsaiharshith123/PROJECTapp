import Verdict from "./Verdict.jsx";

export default function VehicleDetailSections({ entry: _entry, intel, formatAmount, t }) {
  const vehicle = intel.vehicleIntel;
  if (!intel.isVehicle) return null;

  const estimate = vehicle?.estimatedValue ?? intel.vehicleEstimate;
  if (estimate == null && !vehicle) return null;

  return (
    <>
      <div className="ed-ins-story">
        <div className="ed-ins-kicker">{t("wealthDetail.vehicle.depreciation")}</div>
        <div className="ed-ins-cols">
          {estimate != null ? (
            <div className="ed-ins-col">
              <span className="ed-ins-col-label">{t("wealthDetail.vehicle.marketEstimate")}</span>
              <span className="ed-ins-col-val" style={{ color: "var(--ed-red)" }}>
                {formatAmount(estimate)}
              </span>
            </div>
          ) : null}
          {(vehicle?.depreciationLoss ?? intel.gain) != null ? (
            <div className="ed-ins-col">
              <span className="ed-ins-col-label">{t("wealthDetail.vehicle.depreciationLabel")}</span>
              <span className="ed-ins-col-val" style={{ color: "var(--ed-red)" }}>
                {formatAmount(Math.abs(vehicle?.depreciationLoss ?? intel.gain))}
              </span>
              {intel.gainPct != null ? (
                <span className="ed-ins-col-meta">
                  {t("wealthDetail.vehicle.lostPct", { pct: intel.gainPct })}
                </span>
              ) : null}
            </div>
          ) : null}
          {vehicle?.totalCostIncurred != null ? (
            <div className="ed-ins-col">
              <span className="ed-ins-col-label">{t("wealthDetail.vehicle.totalCost")}</span>
              <span className="ed-ins-col-val">{formatAmount(vehicle.totalCostIncurred)}</span>
            </div>
          ) : null}
          {vehicle?.annualInsurance != null ? (
            <div className="ed-ins-col">
              <span className="ed-ins-col-label">{t("wealthDetail.vehicle.annualInsurance")}</span>
              <span className="ed-ins-col-val">{formatAmount(vehicle.annualInsurance)}</span>
            </div>
          ) : null}
          {vehicle?.annualRunning != null ? (
            <div className="ed-ins-col">
              <span className="ed-ins-col-label">{t("wealthDetail.vehicle.annualRunning")}</span>
              <span className="ed-ins-col-val">{formatAmount(vehicle.annualRunning)}</span>
            </div>
          ) : null}
        </div>
        <p className="ed-ins-body" style={{ marginTop: 8 }}>
          {t("wealthDetail.vehicle.depreciationNote")}
        </p>
        {vehicle ? (
          <Verdict t={t} verdict={vehicle.holdVerdict} reasonKey={vehicle.holdDetailKey} />
        ) : (
          <Verdict t={t} verdict="review" reasonKey="wealthDetail.vehicle.reviewReason" />
        )}
      </div>
    </>
  );
}
