import { Card, PageHeader, Body, Caption } from "../../index.js";

const CONTACT_EMAIL = "support@committrack.app";

export default function PrivacyPage() {
  return (
    <div className="ct-page ct-stack">
      <PageHeader title="Privacy Policy" />
      <Card className="ct-stack max-h-[70vh] overflow-y-auto">
        <Caption className="block">Effective: June 2026</Caption>

        <Body className="font-semibold mt-4">WHAT WE COLLECT</Body>
        <Body>
          Display name, email, mobile number, monthly income, PAN (optional), financial commitments,
          lending records, monthly snapshots.
        </Body>

        <Body className="font-semibold mt-4">WHY WE COLLECT IT</Body>
        <Body>
          Solely to calculate your financial pressure score, commitments burden, survival runway, and
          lending records. No other purpose.
        </Body>

        <Body className="font-semibold mt-4">WHERE IT IS STORED</Body>
        <Body>
          Primarily on your device (localStorage). Optionally in Supabase (encrypted at rest, isolated
          per user) when cloud sync is enabled.
        </Body>

        <Body className="font-semibold mt-4">WHAT WE DO NOT DO</Body>
        <Body>
          We do not sell your data. We do not share with credit bureaus. We do not use data for
          advertising. Razorpay handles payments — CommitTrack never sees your card details.
        </Body>

        <Body className="font-semibold mt-4">YOUR RIGHTS (DPDP Act 2023)</Body>
        <Body>
          Access: Profile → Export Data
          {"\n"}
          Correction: edit directly in the app
          {"\n"}
          Erasure: Profile → Delete all data
          {"\n"}
          Grievance: {CONTACT_EMAIL}
        </Body>

        <Body className="font-semibold mt-4">DATA RETENTION</Body>
        <Body>
          Local data: until you delete the app or use Delete all data.
          {"\n"}
          Cloud data: deleted within 30 days of account deletion.
        </Body>

        <Body className="font-semibold mt-4">CONTACT</Body>
        <Body>{CONTACT_EMAIL}</Body>
      </Card>
    </div>
  );
}
