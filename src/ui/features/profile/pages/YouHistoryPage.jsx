import { usePerovo } from "../../../../context/PerovoContext.jsx";
import ProfileHistorySection from "../ProfileHistorySection.jsx";
import YouSubPageShell from "./YouSubPageShell.jsx";

export default function YouHistoryPage() {
  const { commitments, getEffectiveStatus, todayStr, deleteCommitment, removeCommitmentPayment, updateCommitment } =
    usePerovo();
  return (
    <YouSubPageShell titleKey="settings.row.paymentHistory">
      <div className="ct-stat-tile !bg-transparent !border-0 !shadow-none !p-0">
        <ProfileHistorySection
          commitments={commitments}
          getEffectiveStatus={getEffectiveStatus}
          todayStr={todayStr}
          deleteCommitment={deleteCommitment}
          removeCommitmentPayment={removeCommitmentPayment}
          updateCommitment={updateCommitment}
        />
      </div>
    </YouSubPageShell>
  );
}
