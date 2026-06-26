import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import PlansModal from "../PlansModal.jsx";
import YouSubPageShell from "./YouSubPageShell.jsx";

export default function YouPlansPage() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);

  const closedRef = useRef(false);
  useEffect(() => {
    if (open || closedRef.current) return;
    closedRef.current = true;
    navigate("/you", { replace: true });
  }, [open, navigate]);

  return (
    <YouSubPageShell titleKey="settings.row.subscription">
      <div className="ct-stat-tile gold !bg-transparent !border-0 !shadow-none !p-0">
        <PlansModal open={open} onClose={() => setOpen(false)} />
      </div>
    </YouSubPageShell>
  );
}
