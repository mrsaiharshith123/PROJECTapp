import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/** Legacy route — calculators live on the Plan tab. */
export default function ToolsRedirect() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate("/plan", { replace: true });
  }, [navigate]);
  return null;
}
