import { useState } from "react";
import { useLocation } from "react-router-dom";
import { cn } from "../utils/cn.js";
import { useCommitTrack } from "../../context/CommitTrackContext.jsx";
import PlansModal from "../features/profile/PlansModal.jsx";

const TIER_LABEL = { free: "Free", pro: "Pro", power: "Power" };

/**
 * Compact plan chip — opens plan picker modal (replaces large Plans section).
 * @param {{ className?: string }} props
 */
export function PlansButton({ className = "" }) {
  const location = useLocation();
  const { settings } = useCommitTrack();
  const tier = settings.subscriptionTier || "free";
  const [open, setOpen] = useState(() => location.hash === "#upgrade");

  const closePlans = () => {
    setOpen(false);
    if (typeof window !== "undefined" && window.location.hash) {
      window.history.replaceState(null, "", location.pathname + location.search);
    }
  };

  return (
    <>
      <button
        type="button"
        className={cn("ct-chip ct-plan-chip", tier !== "free" && "ct-chip-active", className)}
        onClick={() => setOpen(true)}
        aria-label={`Current plan: ${TIER_LABEL[tier] || "Free"}. Change plan.`}
      >
        {TIER_LABEL[tier] || "Free"}
      </button>
      <PlansModal open={open} onClose={closePlans} />
    </>
  );
}

export default PlansButton;
