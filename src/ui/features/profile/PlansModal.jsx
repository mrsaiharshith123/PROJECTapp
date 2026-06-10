import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Modal, Button, Badge, Caption, Heading, Body, ToneSurface, SegmentedControl } from "../../index.js";
import { CtIcon } from "../../icons/CtIcon.jsx";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import { useAuth } from "../../../context/AuthContext.jsx";
import {
  effectiveAnnualMonthlyInr,
  PLAN_PRESENTATION,
} from "../../../constants/subscriptionTiers.js";
import {
  isPaymentSimulationEnabled,
  isRazorpayConfigured,
  isRazorpayTestMode,
} from "../../../services/razorpayConfig.js";
import { startSubscriptionCheckout } from "../../../services/razorpaySubscription.js";
import { completeSimulatedSubscriptionUpgrade } from "../../../services/simulateSubscriptionPayment.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { formatInr } from "../../../constants/symbols.js";

/**
 * @param {{ open: boolean, onClose: () => void }} props
 */
export default function PlansModal({ open, onClose }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { settings, updateSettings } = useCommitTrack();
  const { user } = useAuth();
  const current = settings.subscriptionTier || "free";
  const [paying, setPaying] = useState(null);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [billing, setBilling] = useState(/** @type {"monthly"|"yearly"} */ ("yearly"));

  if (!open) return null;

  const simulatePay = isPaymentSimulationEnabled();
  const razorpayReady = isRazorpayConfigured();
  const razorpayTest = isRazorpayTestMode();

  const handleUpgrade = (tier) => {
    setMsg({ type: "", text: "" });
    setPaying(tier);

    if (simulatePay) {
      completeSimulatedSubscriptionUpgrade({ tier, userId: user?.id, updateSettings })
        .then(() => {
          setMsg({
            type: "success",
            text: t("plans.simulateSuccess", { tier }),
          });
        })
        .catch((err) => {
          setMsg({ type: "error", text: err?.message || t("plans.simulateFailed") });
          console.error("Simulated payment:", err);
        })
        .finally(() => setPaying(null));
      return;
    }

    if (!user?.id) {
      setMsg({ type: "error", text: t("plans.signInRequired") });
      setPaying(null);
      return;
    }

    startSubscriptionCheckout({
      tier,
      billing,
      userId: user.id,
      settings,
      user,
      updateSettings,
      onSuccess: ({ tier: paidTier, verified }) => {
        setMsg({
          type: "success",
          text: verified ? t("plans.paySuccessVerified", { tier: paidTier }) : t("plans.paySuccess", { tier: paidTier }),
        });
        setPaying(null);
      },
      onDismiss: () => setPaying(null),
      onError: (err) => {
        setMsg({
          type: "error",
          text: err?.message || t("plans.payFailed"),
        });
        console.error("Razorpay:", err);
        setPaying(null);
      },
    });
  };

  return (
    <Modal onClose={onClose} fullScreen>
      <div className="ct-plans-layout">
        <div className="ct-plans-topbar">
          <button type="button" onClick={onClose} className="ct-btn ct-btn-ghost ct-btn-sm" aria-label={t("common.close")}>
            ×
          </button>
        </div>
        <div className="ct-plans-hero">
          <Heading level={2} className="text-center">
            {t("plans.headline")}
          </Heading>
          <Caption className="block text-center mt-0.5 max-w-md mx-auto">{t("plans.subhead")}</Caption>
        </div>

        <div className="ct-plans-billing-toggle">
          <SegmentedControl
            options={[
              { id: "monthly", label: t("plans.billingMonthly") },
              { id: "yearly", label: t("plans.billingYearly") },
            ]}
            value={billing}
            onChange={setBilling}
          />
        </div>

        <div className="ct-plans-alerts">
          {simulatePay && (
            <ToneSurface tone="warning">
              <Caption className="block">{t("plans.simulateHint")}</Caption>
            </ToneSurface>
          )}

          {razorpayReady && razorpayTest && (
            <ToneSurface tone="warning">
              <Caption className="block">{t("plans.razorpayTestHint")}</Caption>
            </ToneSurface>
          )}

          {razorpayReady && !razorpayTest && (
            <ToneSurface tone="info">
              <Caption className="block">{t("plans.razorpayLiveHint")}</Caption>
            </ToneSurface>
          )}

          {!razorpayReady && !simulatePay && (
            <ToneSurface tone="danger">
              <Caption className="block">{t("plans.razorpayMissing")}</Caption>
            </ToneSurface>
          )}

          {msg.text && (
            <ToneSurface tone={msg.type === "success" ? "success" : "danger"}>
              <Caption>{msg.text}</Caption>
            </ToneSurface>
          )}
        </div>

        <div className="ct-plans-grid">
          {PLAN_PRESENTATION.map((plan) => (
            <PlanTierCard
              key={plan.tier}
              plan={plan}
              billing={billing}
              isCurrent={current === plan.tier}
              paying={paying}
              simulatePay={simulatePay}
              razorpayReady={razorpayReady}
              onUpgrade={handleUpgrade}
              onSelectFree={() => updateSettings({ subscriptionTier: "free", cloudSyncEnabled: false })}
              t={t}
            />
          ))}
        </div>

        <div className="ct-plans-footer">
          <Caption className="block">
            {simulatePay ? t("plans.footerSimulate") : t("plans.footerLive")}
          </Caption>

          {current === "free" && (
            <button
              type="button"
              className="ct-link !text-xs mt-1"
              onClick={() => {
                onClose();
                navigate("/profile", { state: { openSection: "backup" } });
              }}
            >
              {t("plans.fileBackupLink")}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}

/**
 * @param {object} props
 */
function PlanTierCard({
  plan,
  billing,
  isCurrent,
  paying,
  simulatePay,
  razorpayReady,
  onUpgrade,
  onSelectFree,
  t,
}) {
  const isPaid = plan.tier === "pro" || plan.tier === "power";
  const isFree = plan.tier === "free";

  const priceLine =
    isFree || plan.annualInr <= 0
      ? t("plans.priceFree")
      : billing === "yearly"
        ? t("plans.priceYearly", { amount: formatInr(plan.annualInr) })
        : t("plans.priceMonthly", { amount: formatInr(plan.monthlyInr) });

  const priceSub =
    !isFree && plan.annualInr > 0
      ? billing === "yearly"
        ? t("plans.priceYearlySub", {
            monthly: formatInr(effectiveAnnualMonthlyInr(plan.annualInr)),
          })
        : t("plans.priceMonthlySub", { annual: formatInr(plan.annualInr) })
      : null;

  const cardClass = [
    "ct-plan-card",
    plan.featured ? "ct-plan-card--featured" : "",
    isCurrent ? "ct-plan-card--current" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article className={cardClass}>
      <div className="ct-plan-card-top">
        <div className="ct-plan-card-icon" aria-hidden>
          <CtIcon name={isFree ? "wallet" : plan.tier === "power" ? "users-three" : "lightning"} size={18} />
        </div>
        {plan.featured && !isCurrent && (
          <Badge tone="info" className="ct-plan-card-badge">
            {t("plans.popular")}
          </Badge>
        )}
        {isCurrent && (
          <Badge tone="success" className="ct-plan-card-badge">
            {t("plans.currentBadge")}
          </Badge>
        )}
        <Heading level={3} className="ct-plan-card-title">
          {t(plan.titleKey)}
        </Heading>
        <Body className="ct-plan-card-tagline">{t(plan.taglineKey)}</Body>
        <div className="ct-plan-card-price">
          <span className="ct-plan-card-price-main">{priceLine}</span>
          {priceSub && <Caption className="block ct-plan-card-price-sub">{priceSub}</Caption>}
        </div>
      </div>

      <div className="ct-plan-card-cta">
        {isCurrent ? (
          <Button type="button" variant="outline" size="sm" disabled className="w-full">
            {t("plans.current")}
          </Button>
        ) : isPaid ? (
          <Button
            type="button"
            variant={plan.featured ? "primary" : "outline"}
            size="sm"
            className="w-full"
            disabled={paying !== null || (!simulatePay && !razorpayReady)}
            onClick={() => onUpgrade(plan.tier)}
          >
            {paying === plan.tier
              ? t("plans.processing")
              : simulatePay
                ? t("plans.simulateCta", { tier: t(plan.titleKey) })
                : t("plans.upgradeCta", { tier: t(plan.titleKey) })}
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            disabled={paying !== null}
            onClick={onSelectFree}
          >
            {t("plans.useFree")}
          </Button>
        )}
        {isPaid && !isCurrent && <Caption className="block text-center mt-2">{t("plans.cancelAnytime")}</Caption>}
      </div>

      <ul className="ct-plan-card-features">
        {plan.includesKey && (
          <li className="ct-plan-card-includes">
            <Body className="!text-sm font-semibold">{t(plan.includesKey)}</Body>
          </li>
        )}
        {plan.featureKeys.map((key) => (
          <li key={key} className="ct-plan-card-feature">
            <CtIcon name="check" size={13} className="ct-plan-card-check shrink-0" />
            <Caption className="block">{t(key)}</Caption>
          </li>
        ))}
      </ul>
    </article>
  );
}
