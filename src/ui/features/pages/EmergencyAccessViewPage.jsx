import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Body, Caption, Heading, Screen } from "../../index.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { fetchEmergencyAccessView } from "../../../services/supabase/emergencyAccess.js";
import { formatInr } from "../../../constants/symbols.js";
import { LoadingSpinner } from "../../patterns/Loading.jsx";

/**
 * Public, token-based view — no Perovo account or sign-in required. This is
 * what a trusted person sees after being shared an Emergency Access link.
 * Shows only the four safe fields the emergency-access-view edge function
 * returns; never anything else.
 */
export default function EmergencyAccessViewPage() {
  const { t } = useTranslation();
  const { token } = useParams();
  const [state, setState] = useState(/** @type {"loading"|"ready"|"error"} */ ("loading"));
  const [snapshot, setSnapshot] = useState(null);
  const [errorReason, setErrorReason] = useState("");

  useEffect(() => {
    let cancelled = false;
    if (!token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot route-param validation, no token to fetch
      setState("error");
      setErrorReason("invalid_token");
      return undefined;
    }
    fetchEmergencyAccessView(token)
      .then((data) => {
        if (cancelled) return;
        setSnapshot(data);
        setState("ready");
      })
      .catch((err) => {
        if (cancelled) return;
        setErrorReason(String(err?.message || "internal_error"));
        setState("error");
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (state === "loading") {
    return (
      <Screen narrow>
        <LoadingSpinner size="md" showLogo />
      </Screen>
    );
  }

  if (state === "error") {
    return (
      <Screen narrow>
        <div className="ed-inset ed-stack-sm">
          <Heading level={2}>{t("emergencyAccessView.errorTitle")}</Heading>
          <Body>
            {errorReason === "rate_limited"
              ? t("emergencyAccessView.errorRateLimited")
              : t("emergencyAccessView.errorGeneric")}
          </Body>
        </div>
      </Screen>
    );
  }

  return (
    <Screen narrow>
      <div className="ed-stack" style={{ gap: 24, padding: 16 }}>
        <Caption>{t("emergencyAccessView.intro")}</Caption>

        <section className="ed-inset ed-stack-sm">
          <Caption>{t("emergencyMode.cashNow")}</Caption>
          <div style={{ fontSize: 40, fontWeight: 700, lineHeight: 1.1 }} className="ed-numeral">
            {formatInr(snapshot.instantCash)}
          </div>
          <Caption>{t("emergencyMode.within7Days", { amount: formatInr(snapshot.within7DaysCash) })}</Caption>
        </section>

        <section className="ed-stack-sm">
          <Heading level={3}>{t("emergencyMode.insuranceTitle")}</Heading>
          {snapshot.activeInsurance.length === 0 ? (
            <Body>{t("emergencyMode.noInsurance")}</Body>
          ) : (
            snapshot.activeInsurance.map((policy, i) => (
              <div key={`${policy.name}-${i}`} className="ed-inset ed-stack-sm">
                <Body className="font-semibold" style={{ fontSize: 18 }}>
                  {policy.name}
                </Body>
                {policy.insurer ? <Caption>{policy.insurer}</Caption> : null}
                {policy.sumAssured ? <Caption>{t("emergencyMode.sumAssured", { amount: formatInr(policy.sumAssured) })}</Caption> : null}
                {policy.claimContact ? (
                  <a href={`tel:${policy.claimContact}`} style={{ fontSize: 22, fontWeight: 700 }}>
                    {policy.claimContact}
                  </a>
                ) : (
                  <Caption style={{ color: "var(--ed-amber)" }}>{t("emergencyMode.noClaimContact")}</Caption>
                )}
              </div>
            ))
          )}
        </section>

        <section className="ed-stack-sm">
          <Heading level={3}>{t("emergencyMode.owedTitle")}</Heading>
          {snapshot.owedToUser.length === 0 ? (
            <Body>{t("emergencyMode.noneOwed")}</Body>
          ) : (
            <>
              <div style={{ fontSize: 28, fontWeight: 700 }} className="ed-numeral">
                {formatInr(snapshot.totalOwedToUser)}
              </div>
              {snapshot.owedToUser.map((row, i) => (
                <div key={`${row.personName}-${i}`} className="ed-row-between">
                  <Body>{row.personName}</Body>
                  <Body className="font-semibold ed-numeral">{formatInr(row.remainingAmount)}</Body>
                </div>
              ))}
            </>
          )}
        </section>
      </div>
    </Screen>
  );
}
