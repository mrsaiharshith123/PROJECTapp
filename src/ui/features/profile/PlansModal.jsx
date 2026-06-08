import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Modal, Button, Badge, Caption, Heading, Body, ToneSurface } from "../../index.js";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import { useAuth } from "../../../context/AuthContext.jsx";
import { PLAN_PRESENTATION } from "../../../constants/subscriptionTiers.js";
import { openRazorpayCheckout } from "../../../services/razorpay.js";
import { saveSubscriptionTier } from "../../../services/supabase/auth.js";
import {
  completeSimulatedSubscriptionUpgrade,
  isPaymentSimulationEnabled,
} from "../../../services/simulateSubscriptionPayment.js";
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

    const amountPaise = tier === "pro" ? 79900 : 149900;

    openRazorpayCheckout({
      amountPaise,
      description: `CommitTrack ${tier === "pro" ? "Pro" : "Power"} Annual`,
      prefillName: settings.displayName || "",
      prefillEmail: user?.email || "",
      onSuccess: async (paymentId) => {
        await saveSubscriptionTier(user?.id, tier, paymentId);
        updateSettings({ subscriptionTier: tier });
        setMsg({ type: "success", text: `Your plan is now ${tier}. Thank you for subscribing.` });
        setPaying(null);
      },
      onDismiss: () => setPaying(null),
      onError: (err) => {
        setMsg({ type: "error", text: "Payment could not be completed. Please try again." });
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
              Test mode: upgrades simulate payment (no Razorpay). Console:{" "}
              <code className="text-[11px]">__commitTrackDev.simulatePayment(&quot;pro&quot;)</code>
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
                    disabled={paying !== null}
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
            ? "Production builds use Razorpay. This dev session skips real checkout."
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
