import { useNavigate } from "react-router-dom";
import { Modal, Button, Badge, Caption, Heading, Body } from "../../index.js";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import { PLAN_PRESENTATION } from "../../../constants/subscriptionTiers.js";

/**
 * @param {{ open: boolean, onClose: () => void }} props
 */
export default function PlansModal({ open, onClose }) {
  const navigate = useNavigate();
  const { settings, updateSettings } = useCommitTrack();
  const current = settings.subscriptionTier || "free";

  if (!open) return null;

  return (
    <Modal onClose={onClose} title="Plans">
      <div className="ct-stack-sm">
        <Caption className="block">
          Free = local only. Pro & Power add account backup (beta — payment coming soon).
        </Caption>

        {PLAN_PRESENTATION.map((plan) => {
          const isCurrent = current === plan.tier;
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
                ) : (
                  <Button
                    type="button"
                    variant={plan.tier === "free" ? "outline" : "primary"}
                    size="sm"
                    onClick={() => {
                      const patch = { subscriptionTier: plan.tier };
                      if (plan.tier === "free") patch.cloudSyncEnabled = false;
                      updateSettings(patch);
                    }}
                  >
                    {plan.tier === "free" ? "Free" : plan.title}
                  </Button>
                )}
              </div>
            </div>
          );
        })}

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
