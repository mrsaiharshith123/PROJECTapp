import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/** Legacy route — net worth lives in Profile → Financial life. */
export default function NetWorthPage() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/profile", { replace: true, state: { openSection: "financial-life" } });
  }, [navigate]);

  return null;
}
