import { useMemo, useState } from "react";
import { CALC_HELP } from "../../../constants/calculationHelp.js";
import { formatInr } from "../../../constants/symbols.js";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import { useCommitIntel } from "../../../hooks/useCommitIntel.js";
import { useStabilityIntel } from "../../../hooks/useStabilityIntel.js";
import { isInvoiceOverdue } from "../../../utils/businessInvoices.js";
import { todayYmd } from "../../../utils/dates.js";
import { dueWithinDays } from "./config/modeDashboardMetrics.js";
import { Card } from "../../primitives/Card.jsx";
import { InfoTip } from "../../primitives/InfoTip.jsx";
import { Input, inputClassName } from "../../primitives/Input.jsx";
import { Heading, Caption, Body } from "../../primitives/Text.jsx";
import { Grid, Stack } from "../../primitives/Stack.jsx";
import { StatCard } from "../../patterns/StatCard.jsx";
import ModeHeroCard from "./shared/ModeHeroCard.jsx";
import ModeInsightStrip from "./shared/ModeInsightStrip.jsx";
import { insightToneClass } from "../../tokens/severity.js";

function formatDue(d) {
  if (!d) return "—";
  return new Date(d + "T12:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

/** Business operating dashboard — receivables, payables, working capital (not salaried framing). */
export default function BusinessModeDashboard() {
  const {
    commitments,
    businessInvoices,
    addBusinessInvoice,
    deleteBusinessInvoice,
    markBusinessInvoicePaid,
    getEffectiveStatus,
    todayStr,
  } = useCommitTrack();
  const stable = useStabilityIntel();
  const intel = useCommitIntel();
  const business = stable.business;

  const [clientName, setClientName] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");

  const openInvoices = useMemo(() => businessInvoices.filter((i) => !i.paid), [businessInvoices]);
  const invoiceOpenTotal = useMemo(
    () => openInvoices.reduce((s, i) => s + (Number(i.amount) || 0), 0),
    [openInvoices],
  );
  const overdueInvoices = useMemo(
    () => openInvoices.filter((i) => isInvoiceOverdue(i, todayStr || todayYmd())),
    [openInvoices, todayStr],
  );

  const weekRisk = useMemo(
    () => dueWithinDays(commitments, getEffectiveStatus, todayStr, 7),
    [commitments, getEffectiveStatus, todayStr],
  );

  const freeCash = intel.stability?.freeMoney ?? 0;
  const lowCash = business && business.vendorDue > freeCash + business.totalReceivables * 0.25;

  if (!business) return null;

  const heroMetrics = [
    {
      label: "Receivables pending",
      value: formatInr(business.totalReceivables),
      sub: `${business.receivableCount} open`,
      tone: "good",
    },
    {
      label: "Payables due",
      value: formatInr(business.vendorDue),
      sub: "Vendors & operating",
      tone: "warn",
    },
    {
      label: "Business stability",
      value: `${business.stabilityScore}%`,
      sub: business.stabilityLabel,
      tone: business.stabilityScore >= 70 ? "good" : "warn",
    },
    {
      label: "Profit after obligations",
      value: formatInr(Math.max(0, freeCash)),
      sub: "Estimated operating room",
      tone: freeCash >= 0 ? "good" : "danger",
    },
  ];

  const handleAdd = (e) => {
    e.preventDefault();
    const amt = Number(amount);
    if (!clientName.trim() || amt <= 0 || !dueDate) return;
    addBusinessInvoice({ clientName: clientName.trim(), amount: amt, dueDate, notes: notes.trim() });
    setClientName("");
    setAmount("");
    setDueDate("");
    setNotes("");
  };

  return (
    <Stack gap="md">
      <ModeHeroCard
        emoji="🏪"
        title="Business operations"
        subtitle="Receivables · payables · working capital"
        metrics={heroMetrics}
        tip="Track client invoices below and vendor bills under Bills — money you lent under Lending."
      />

      <Grid cols={2}>
        <StatCard
          label="Cashflow today"
          value={formatInr(freeCash)}
          valueClassName={freeCash >= 0 ? "ct-hero-metric-success" : "ct-hero-metric-warn"}
        />
        <StatCard
          label="Overdue customers"
          value={String(business.overdueReceivables + overdueInvoices.length)}
          valueClassName={
            business.overdueReceivables + overdueInvoices.length > 0 ? "ct-hero-metric-warn" : ""
          }
        />
        <StatCard label="Collection at risk" value={formatInr(business.overdueRecvAmount)} />
        <StatCard label="7-day cash need" value={formatInr(weekRisk.sum)} />
        <StatCard label="Open invoices" value={formatInr(invoiceOpenTotal)} />
        <StatCard
          label="Borrowed payables"
          value={formatInr(business.payablesAmount)}
          valueClassName="ct-hero-metric-warn"
        />
        <StatCard label="Lending receivables" value={formatInr(business.lendingReceivables)} />
        <StatCard
          label="Business reserve"
          value={formatInr(Math.max(0, Number(stable.emergency?.monthsCovered ?? 0) > 0 ? freeCash : 0))}
        />
      </Grid>

      {lowCash && (
        <Card variant="flat" className={insightToneClass("warning")}>
          <Body className="!text-xs font-semibold">
            Low-cash warning: near-term payables may exceed comfortable operating cash — prioritize collections.
          </Body>
        </Card>
      )}

      <ModeInsightStrip insights={business.insights} />

      <Card className="ct-stack">
        <Heading level={2} className="inline-flex items-center">
          Client invoices
          <InfoTip text={CALC_HELP.businessReceivables} />
        </Heading>
        <Caption>Overdue invoices and collection pressure</Caption>

        <form onSubmit={handleAdd} className="ct-stack gap-2 border-t border-[var(--ct-border)] pt-3">
          <Caption className="font-semibold">Record receivable</Caption>
          <Grid cols={2}>
            <Input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Customer name"
              className={inputClassName()}
            />
            <Input
              type="number"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount (₹)"
              className={inputClassName()}
            />
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputClassName()} />
            <Input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes"
              className={inputClassName()}
            />
          </Grid>
          <button type="submit" className="ct-btn ct-btn-primary !w-auto">
            Save invoice
          </button>
        </form>

        {businessInvoices.length > 0 && (
          <ul className="ct-stack gap-2">
            {businessInvoices.slice(0, 8).map((inv) => {
              const overdue = isInvoiceOverdue(inv, todayStr || todayYmd());
              return (
                <li
                  key={inv.id}
                  className={`ct-row-between flex-wrap gap-2 rounded-xl px-3 py-2 border ${
                    inv.paid
                      ? "ct-inset opacity-70"
                      : overdue
                        ? insightToneClass("warning")
                        : "ct-card ct-card-flat !shadow-none"
                  }`}
                >
                  <div className="min-w-0">
                    <Body className="font-semibold truncate">{inv.clientName}</Body>
                    <Caption>
                      Due {formatDue(inv.dueDate)}
                      {inv.paid ? " · Collected" : overdue ? " · Overdue" : ""}
                    </Caption>
                  </div>
                  <div className="ct-row gap-2 shrink-0">
                    <span className="ct-metric-value">{formatInr(inv.amount)}</span>
                    {!inv.paid && (
                      <button
                        type="button"
                        onClick={() => markBusinessInvoicePaid(inv.id)}
                        className="ct-btn ct-btn-ghost !text-xs !py-1 !px-2"
                      >
                        Collected
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => deleteBusinessInvoice(inv.id)}
                      className="ct-btn ct-btn-ghost !text-xs !py-1 !px-2"
                      aria-label="Remove"
                    >
                      ×
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </Stack>
  );
}
