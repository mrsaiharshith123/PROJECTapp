import { Outlet } from "react-router-dom";

/** Pass-through layout so /ledger, /ledger/bills, and /ledger/spends share a route tree. */
export default function LedgerRootLayout() {
  return <Outlet />;
}
