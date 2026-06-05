import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Modal, Button, Badge, Caption, Heading, Body, ToneSurface } from "../../index.js";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import { useAuth } from "../../../context/AuthContext.jsx";
import { PLAN_PRESENTATION } from "../../../constants/subscriptionTiers.js";
import { openRazorpayCheckout } from "../../../services/razorpay.js";

const TIER_AMOUNTS = {
  pro: 79900,
  power: 149900,
};

/**
 * @param {{ open: boolean, onClose: () => void }} props
 */
export default function PlansModal({ open, onClose }) {
  const navigate = useNavigate();
  const { settings, updateSettings } = useCommitTrack();
  const { user } = useAuth();
  const current = settings.subscriptionTier || "free";
  const [paying, setPaying] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  if (!open) return null;

  const handleUpgrade = (tier) => {
    const amountPaise = TIER_AMOUNTS[tier];
    if (!amountPaise) return;

    setSuccessMsg("");
    setErrorMsg("");
    setPaying(tier);

    openRazorpayCheckout({
      amountPaise,
      description: `CommitTrack ${tier === "pro" ? "Pro" : "Power"} — annual`,
      prefillName: settings.displayName || "",
      prefillEmail: user?.email || "",
      onSuccess: (paymentId) => {
        updateSettings({ subscriptionTier: tier });
        setSuccessMsg(`You're now on ${tier.charAt(0).toUpperCase() + tier.slice(1)}! Payment ID: ${paymentId}`);
        setPaying(null);
      },
      onDismiss: () => setPaying(null),
      onError: (err) => {
        const msg = err instanceof Error ? err.message : "Payment could not be completed. Please try again.";
        if (!String(msg).toLowerCase().includes("dismiss")) {
          setErrorMsg(msg);
        }
        setPaying(null);
      },
    });
  };

  return (
    <Modal onClose={onClose} title="Plans">
      <div className="ct-stack-sm">
        <Caption className="block">
          Free = local only. Pro & Power add account backup and advanced reports.
        </Caption>

        {successMsg && (
          <ToneSurface tone="success">
            <Caption>{successMsg}</Caption>
          </ToneSurface>
        )}
        {errorMsg && (
          <ToneSurface tone="danger">
            <Caption>{errorMsg}</Caption>
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
                  {isCurrent && <Badge tone="success">Current</Badge>}
                </div>
                <Caption className="block">{plan.price}</Caption>
                <Body className="!text-xs mt-0.5 opacity-90">{plan.subtitle}</Body>
                <Caption className="block mt-1">{plan.features[0]}</Caption>
              </div>
              <div className="shrink-0 flex flex-col gap-1 items-end">
                {isCurrent ? (
                  <Caption className="font-semibold">Active</Caption>
                ) : isPaid ? (
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    disabled={paying !== null}
                    onClick={() => handleUpgrade(plan.tier)}
                  >
                    {paying === plan.tier ? "Processing…" : `Upgrade to ${plan.title}`}
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

        <Caption className="block">Payments processed by Razorpay. Cancel anytime from Profile.</Caption>

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
