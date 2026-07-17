import { useMemo } from "react";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { scanChitFundRedFlags } from "../../../engines/chitFraudScanner.js";

const FLAG_LABEL_KEYS = {
  "no-organizer-name": "bill.detail.chitFraud.flag.noOrganizerName",
  "guaranteed-return": "bill.detail.chitFraud.flag.guaranteedReturn",
  "cash-only": "bill.detail.chitFraud.flag.cashOnly",
  "no-registration-number": "bill.detail.chitFraud.flag.noRegistrationNumber",
  "implausible-registration-number": "bill.detail.chitFraud.flag.implausibleRegistrationNumber",
};

const RISK_COLOR = {
  critical: "var(--ed-red)",
  high: "var(--ed-red)",
  medium: "var(--ed-gold)",
  low: "var(--ed-green)",
};

/**
 * Rule-based fraud red-flag panel for Chit Fund bill detail.
 * @param {{ bill: object }} props
 */
export default function ChitFraudPanel({ bill }) {
  const { t } = useTranslation();

  const result = useMemo(() => {
    if (!bill || bill.category !== "Chit Fund") return null;
    return scanChitFundRedFlags(bill);
  }, [bill]);

  if (!result) return null;

  return (
    <div className="ed-ins-story" style={{ marginTop: 12 }}>
      <div className="ed-ins-kicker">{t("bill.detail.chitFraud.title")}</div>
      {bill.chitOrganizerCompany ? (
        <p className="ed-ins-body" style={{ opacity: 0.85 }}>
          {bill.chitOrganizerCompany}
        </p>
      ) : null}
      <p className="ed-ins-body" style={{ fontWeight: 600, color: RISK_COLOR[result.riskLevel] }}>
        {t(`bill.detail.chitFraud.riskLevel.${result.riskLevel}`)}
      </p>
      {result.flags.length === 0 ? (
        <p className="ed-ins-body">{t("bill.detail.chitFraud.noFlags")}</p>
      ) : (
        <ul className="ed-ins-body" style={{ paddingLeft: 18, listStyle: "disc" }}>
          {result.flags.map((flag) => (
            <li key={flag.id} style={{ marginTop: 4 }}>
              {t(FLAG_LABEL_KEYS[flag.id] || flag.id)}
            </li>
          ))}
        </ul>
      )}
      <p className="ed-ins-body" style={{ marginTop: 8, opacity: 0.75 }}>
        {t("bill.detail.chitFraud.disclaimer")}
      </p>
    </div>
  );
}
