import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PlansModal from "../PlansModal.jsx";
import YouSubPageShell from "./YouSubPageShell.jsx";

export default function YouPlansPage() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (!open) navigate("/profile", { replace: true });
  }, [open, navigate]);

  return (
    <YouSubPageShell titleKey="settings.row.subscription">
      <PlansModal open={open} onClose={() => setOpen(false)} />
    </YouSubPageShell>
  );
}
