import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageShell, Body, Caption, Heading, Button } from "../../index.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { useNetWorth } from "../../../context/NetWorthContext.jsx";
import { useAuth } from "../../../context/AuthContext.jsx";
import { buildEmergencySnapshot } from "../../../engines/emergencyMode.js";
import { formatInr } from "../../../constants/symbols.js";
import {
  createEmergencyAccessGrant,
  listEmergencyAccessGrants,
  revokeEmergencyAccessGrant,
} from "../../../services/supabase/emergencyAccess.js";
import { getAuthRedirectUrl } from "../../../services/supabase/auth.js";

/**
 * Deliberately not a dashboard. In a hospital-waiting-room moment, nobody
 * wants charts — just: how much can I access right now, is insurance
 * active with a number to call, what can I collect from others. Large
 * text, zero interpretation, nothing else on this screen.
 */
export default function EmergencyModePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { commitments, lendings, getEffectiveStatus } = usePerovo();
  const { entries } = useNetWorth();
  const { isLoggedIn } = useAuth();

  const snapshot = buildEmergencySnapshot({
    wealthEntries: entries.filter((e) => e.kind === "asset"),
    commitments,
    lendings,
    getEffectiveStatus,
  });

  const [grants, setGrants] = useState([]);
  const [grantsLoading, setGrantsLoading] = useState(false);
  const [grantsError, setGrantsError] = useState("");
  const [newName, setNewName] = useState("");
  const [newContact, setNewContact] = useState("");
  const [creating, setCreating] = useState(false);
  const [newLink, setNewLink] = useState("");

  const refreshGrants = () => {
    if (!isLoggedIn) return;
    setGrantsLoading(true);
    setGrantsError("");
    listEmergencyAccessGrants()
      .then(setGrants)
      .catch(() => setGrantsError(t("emergencyMode.grantsLoadError")))
      .finally(() => setGrantsLoading(false));
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot grant list load on mount / login state change
    refreshGrants();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot load on mount / login state change
  }, [isLoggedIn]);

  const handleCreateGrant = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    setNewLink("");
    try {
      const result = await createEmergencyAccessGrant({
        trustedPersonName: newName.trim(),
        trustedPersonContact: newContact.trim() || undefined,
      });
      const link = getAuthRedirectUrl(`emergency-access/${result.token}`);
      setNewLink(link);
      setNewName("");
      setNewContact("");
      refreshGrants();
    } catch {
      setGrantsError(t("emergencyMode.grantCreateError"));
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (grantId) => {
    try {
      await revokeEmergencyAccessGrant(grantId);
      refreshGrants();
    } catch {
      setGrantsError(t("emergencyMode.grantRevokeError"));
    }
  };

  return (
    <PageShell
      title={t("emergencyMode.title")}
      action={
        <button type="button" className="ed-btn ed-btn-ghost ed-btn-sm" onClick={() => navigate(-1)} aria-label={t("common.back")}>
          ←
        </button>
      }
    >
      <div className="ed-stack" style={{ gap: 24 }}>
        <Caption>{t("emergencyMode.intro")}</Caption>

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
            snapshot.activeInsurance.map((policy) => (
              <div key={policy.id} className="ed-inset ed-stack-sm">
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
              {snapshot.owedToUser.map((row) => (
                <div key={row.id} className="ed-row-between">
                  <Body>{row.personName}</Body>
                  <Body className="font-semibold ed-numeral">{formatInr(row.remainingAmount)}</Body>
                </div>
              ))}
            </>
          )}
        </section>

        <section className="ed-stack-sm">
          <Heading level={3}>{t("emergencyMode.trustedAccessTitle")}</Heading>
          <Caption>{t("emergencyMode.trustedAccessIntro")}</Caption>

          {!isLoggedIn ? (
            <Caption style={{ color: "var(--ed-amber)" }}>{t("emergencyMode.trustedAccessNeedsAccount")}</Caption>
          ) : (
            <>
              {grantsError ? <Caption style={{ color: "var(--ed-red)" }}>{grantsError}</Caption> : null}

              <div className="ed-inset ed-stack-sm">
                <input
                  className="ed-input"
                  placeholder={t("emergencyMode.trustedPersonNamePlaceholder")}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
                <input
                  className="ed-input"
                  placeholder={t("emergencyMode.trustedPersonContactPlaceholder")}
                  value={newContact}
                  onChange={(e) => setNewContact(e.target.value)}
                />
                <Button type="button" variant="primary" onClick={handleCreateGrant} disabled={creating || !newName.trim()}>
                  {creating ? t("auth.pleaseWait") : t("emergencyMode.createGrant")}
                </Button>
              </div>

              {newLink ? (
                <div className="ed-inset ed-stack-sm">
                  <Caption style={{ color: "var(--ed-green)" }}>{t("emergencyMode.grantCreatedWarning")}</Caption>
                  <Body className="break-all" style={{ fontFamily: "monospace", fontSize: 13 }}>
                    {newLink}
                  </Body>
                </div>
              ) : null}

              {grantsLoading ? (
                <Caption>{t("auth.pleaseWait")}</Caption>
              ) : grants.length === 0 ? (
                <Body>{t("emergencyMode.noGrants")}</Body>
              ) : (
                grants.map((g) => (
                  <div key={g.id} className="ed-row-between">
                    <div>
                      <Body className="font-semibold">{g.trustedPersonName}</Body>
                      <Caption>{g.status === "revoked" ? t("emergencyMode.grantRevoked") : t("emergencyMode.grantActive")}</Caption>
                    </div>
                    {g.status === "active" ? (
                      <Button type="button" variant="outline" onClick={() => handleRevoke(g.id)}>
                        {t("emergencyMode.revoke")}
                      </Button>
                    ) : null}
                  </div>
                ))
              )}
            </>
          )}
        </section>
      </div>
    </PageShell>
  );
}
