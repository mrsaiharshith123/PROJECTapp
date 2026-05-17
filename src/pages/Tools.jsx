import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/** Legacy route — calculators live on the Home dashboard. */
export default function Tools() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate("/#dashboard-tools", { replace: true });
  }, [navigate]);
  return null;
}
