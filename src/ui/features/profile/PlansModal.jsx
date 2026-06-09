import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Modal, Button, Badge, Caption, Heading, Body, ToneSurface } from "../../index.js";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import { useAuth } from "../../../context/AuthContext.jsx";
import { PLAN_PRESENTATION } from "../../../constants/subscriptionTiers.js";
import {
  isPaymentSimulationEnabled,
  isRazorpayConfigured,
  isRazorpayTestMode,
} from "../../../services/razorpayConfig.js";
import { startSubscriptionCheckout } from "../../../services/razorpaySubscription.js";
import { completeSimulatedSubscriptionUpgrade } from "../../../services/simulateSubscriptionPayment.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";

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
            text: `[Test] Simulated payment complete. Your plan is now ${tier}. Pro features are enabled.`,
          });
        })
        .catch((err) => {
          setMsg({ type: "error", text: err?.message || "Simulation failed." });
          console.error("Simulated payment:", err);
        })
        .finally(() => setPaying(null));
      return;
    }

    if (!user?.id) {
      setMsg({ type: "error", text: "Sign in from Profile to pay with Razorpay." });
      setPaying(null);
      return;
    }

    startSubscriptionCheckout({
      tier,
      userId: user.id,
      settings,
      user,
      updateSettings,
      onSuccess: ({ tier: paidTier, verified }) => {
        setMsg({
          type: "success",
          text: verified
            ? `Your plan is now ${paidTier}. Payment verified — thank you!`
            : `Your plan is now ${paidTier}. Thank you for subscribing.`,
        });
        setPaying(null);
      },
      onDismiss: () => setPaying(null),
      onError: (err) => {
        setMsg({
          type: "error",
          text: err?.message || "Payment could not be completed. Please try again.",
        });
        console.error("Razorpay:", err);
        setPaying(null);
      },
    });
  };

  return (
    <Modal onClose={onClose} title={t("plans.title")}>
      <div className="ct-stack-sm">
        <Caption className="block">
          Free = local only. Pro & Power add account backup and advanced reports.
        </Caption>

        {simulatePay && (
          <ToneSurface tone="warning">
            <Caption className="block">
              Simulation mode: no Razorpay checkout. Add{" "}
              <code className="text-[11px]">VITE_RAZORPAY_KEY_ID=rzp_test_…</code> to{" "}
              <code className="text-[11px]">.env</code> and restart dev to use test payments.
            </Caption>
          </ToneSurface>
        )}

        {razorpayReady && razorpayTest && (
          <ToneSurface tone="warning">
            <Caption className="block">
              Razorpay test mode — India-only account. Easiest: choose <strong>UPI</strong> and enter{" "}
              <strong>success@razorpay</strong>. Or <strong>Netbanking</strong> → any bank → Success. Domestic test
              card: <strong>5267 3181 8797 5449</strong> (any expiry/CVV). Foreign cards show “International cards
              are not supported”.
            </Caption>
          </ToneSurface>
        )}

        {razorpayReady && !razorpayTest && (
          <ToneSurface tone="info">
            <Caption className="block">Live Razorpay checkout — real charges apply.</Caption>
          </ToneSurface>
        )}

        {!razorpayReady && !simulatePay && (
          <ToneSurface tone="danger">
            <Caption className="block">
              Razorpay is not configured. Set <code className="text-[11px]">VITE_RAZORPAY_KEY_ID</code> in your build
              environment.
            </Caption>
          </ToneSurface>
        )}

        {msg.text && (
          <ToneSurface tone={msg.type === "success" ? "success" : "danger"}>
            <Caption>{msg.text}</Caption>
          </ToneSurface>
        )}

        {PLAN_PRESENTATION.map((plan) => {
          const isCurrent = current === plan.tier;
          const isPaid = plan.tier === "pro" || plan.tier === "power";
          return (
            <div key={plan.tier} className="ct-plan-row">
              <div className="min-w-0 flex-1">
                <div className="ct-row-between gap-2">
                  <Heading level={4}>{plan.title}</Heading>
                  {isCurrent && <Badge tone="success">{t("plans.currentBadge")}</Badge>}
                </div>
                <Caption className="block">{plan.price}</Caption>
                <Body className="!text-xs mt-0.5 opacity-90">{plan.subtitle}</Body>
                <Caption className="block mt-1">{plan.features[0]}</Caption>
              </div>
              <div className="shrink-0 flex flex-col gap-1 items-end">
                {isCurrent ? (
                  <Badge tone="success">{t("plans.current")}</Badge>
                ) : isPaid ? (
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    disabled={paying !== null || (!simulatePay && !razorpayReady)}
                    onClick={() => handleUpgrade(plan.tier)}
                  >
                    {paying === plan.tier
                      ? "Processing..."
                      : simulatePay
                        ? `Simulate ${plan.title}`
                        : `Upgrade to ${plan.title}`}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={paying !== null}
                    onClick={() => {
                      updateSettings({ subscriptionTier: "free", cloudSyncEnabled: false });
                    }}
                  >
                    Free
                  </Button>
                )}
              </div>
            </div>
          );
        })}

        <Caption className="block">
          {simulatePay
            ? "Add Razorpay test keys to .env for real checkout in dev."
            : "Payments processed by Razorpay. Cancel anytime from Profile."}
        </Caption>

        {current === "free" && (
          <button
            type="button"
            className="ct-link !text-xs"
            onClick={() => {
              onClose();
              navigate("/profile", { state: { openSection: "backup" } });
            }}
          >
            File backup → Backup & data
          </button>
        )}
      </div>
    </Modal>
  );
}
