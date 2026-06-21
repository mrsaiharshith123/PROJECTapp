import { usePerovo } from "../../../../context/PerovoContext.jsx";
import ProfileHistorySection from "../ProfileHistorySection.jsx";
import YouSubPageShell from "./YouSubPageShell.jsx";

export default function YouHistoryPage() {
  const { commitments, getEffectiveStatus, todayStr, deleteCommitment, removeCommitmentPayment, updateCommitment } =
    usePerovo();
  return (
    <YouSubPageShell titleKey="settings.row.paymentHistory">
      <ProfileHistorySection
        commitments={commitments}
        getEffectiveStatus={getEffectiveStatus}
        todayStr={todayStr}
        deleteCommitment={deleteCommitment}
        removeCommitmentPayment={removeCommitmentPayment}
        updateCommitment={updateCommitment}
      />
    </YouSubPageShell>
  );
}
