import { Navigate } from "react-router-dom";

/** @deprecated — merged into Personal details. */
export default function YouAccountPage() {
  return <Navigate to="/you/personal" replace />;
}
