import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { useNetWorth } from "../../../context/NetWorthContext.jsx";
import { usePrivacyAmount } from "../../../hooks/usePrivacyAmount.js";
import { getBillDisplayName } from "../../../utils/billDisplayName.js";
import WealthEntryModal from "../netWorth/WealthEntryModal.jsx";
import {
  isLiabilityCommitment,
  sumEntryValues,
} from "../../../utils/ledger/ledgerBuckets.js";
import { computeBillPaymentProgress } from "../../../utils/billPaymentProgress.js";
import { CtIcon } from "../../icons/CtIcon.jsx";

const SECURED = new Set(["Home Loan", "Car Loan", "EMI"]);
const UNSECURED = new Set(["Personal Loan", "Credit Card", "BNPL", "Loan"]);

function liabilityGroup(category) {
  if (SECURED.has(category)) return "secured";
  if (UNSECURED.has(category)) return "unsecured";
  return "informal";
}

function statusStripe(effectiveStatus) {
  if (effectiveStatus === "overdue") return "var(--pos-danger)";
  if (effectiveStatus === "pending" || effectiveStatus === "upnext") return "var(--pos-warning)";
  return "rgba(255,255,255,0.12)";
}

/**
 * @param {{ onAdd?: () => void, openAddOnMount?: boolean }} props
 */
export default function LedgerLiabilitiesView({ onAdd, openAddOnMount = false }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { entries, core, addEntry, updateEntry } = useNetWorth();
  const { formatAmount } = usePrivacyAmount();
  const { sortedCommitments, commitments, getEffectiveStatus, todayStr } = usePerovo();
  const [modalOpen, setModalOpen] = useState(openAddOnMount);
  const [editEntry, setEditEntry] = useState(null);

  const wealthLiabs = useMemo(() => entries.filter((e) => e.kind === "liability"), [entries]);
  const loanBills = useMemo(() => {
    return sortedCommitments
      .filter((c) => isLiabilityCommitment(c))
      .map((c) => ({ ...c, effectiveStatus: getEffectiveStatus(c) }));
  }, [sortedCommitments, getEffectiveStatus]);

  /** Bills with status for grouping — commitments from filter retain all fields. */
  const loanBillRows = /** @type {Array<{ category?: string; amount?: number; effectiveStatus: string; id?: string; name?: string }>} */ (
    loanBills
  );

  const wealthTotal = sumEntryValues(wealthLiabs);
  const billsTotal = sortedCommitments
    .filter((c) => isLiabilityCommitment(c))
    .reduce((s, c) => s + (Number(c.amount) || 0), 0);
  const total = wealthTotal + billsTotal;
  const debtRatio =
    core.totalAssets > 0 ? `${((total / core.totalAssets) * 100).toFixed(1)}%` : "—";

  const groups = useMemo(() => {
    /** @type {Record<string, { wealth: object[], bills: object[] }>} */
    const out = { secured: { wealth: [], bills: [] }, unsecured: { wealth: [], bills: [] }, informal: { wealth: [], bills: [] } };
    for (const w of wealthLiabs) {
      const g = liabilityGroup(w.categoryId);
      out[g].wealth.push(w);
    }
    for (const b of loanBillRows) {
      const g = liabilityGroup(String(b.category ?? ""));
      out[g].bills.push(b);
    }
    return out;
  }, [wealthLiabs, loanBillRows]);

  const groupLabels = {
    secured: "ledger.group.securedLoans",
    unsecured: "ledger.group.unsecured",
    informal: "ledger.group.informal",
  };

  return (
    <div className="ct-stack">
      <div className="ed-ins-story ed-ledger-hero">
        <div className="ed-ins-kicker">{t("ledger.totalLiabilities")}</div>
        <div className="ed-ledger-hero-row">
          <div className="ed-ins-bignum ed-ledger-hero-val-liab">
            <span className="sym">₹</span>
            {formatAmount(total).replace("₹", "").trim()}
          </div>
          <button type="button" className="ed-ins-link" onClick={() => navigate("/insights/liabilities")}>
            {t("ledger.viewInsightsLink")}
          </button>
        </div>
        <div className="ed-ins-body">{t("ledger.debtRatio", { ratio: debtRatio })}</div>
      </div>

      {Object.entries(groups).map(([key, group]) => {
        if (!group.wealth.length && !group.bills.length) return null;
        const subtotal =
          sumEntryValues(group.wealth) + group.bills.reduce((s, b) => s + (Number(b.amount) || 0), 0);
        return (
          <section key={key}>
            <div className="pos-group-header">
              <span>{t(groupLabels[key])}</span>
              <span className="ct-numeral">{formatAmount(subtotal)}</span>
            </div>
            <div className="pos-group-card ct-stack-sm">
              {group.wealth.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  className="ct-row-between gap-2 min-w-0 w-full text-left"
                  onClick={() => navigate(`/insights/entry/${entry.id}`)}
                >
                  <div className="ct-row gap-2 min-w-0">
                    <span className="ct-icon-tile pos-icon liability shrink-0">
                      <CtIcon name="bank" size={18} />
                    </span>
                    <div className="min-w-0">
                      <p className="ct-body-strong truncate">{entry.name}</p>
                      <p className="ct-caption">
                        {entry.emi ? t("ledger.emiPerMonth", { amount: formatAmount(entry.emi) }) : t("ledger.outstanding")}
                      </p>
                    </div>
                  </div>
                  <span className="ct-numeral shrink-0" style={{ color: "var(--pos-liab)" }}>
                    {formatAmount(entry.value)}
                  </span>
                </button>
              ))}
              {group.bills.map((bill) => {
                const progress = computeBillPaymentProgress(bill, todayStr, commitments);
                const stripe = statusStripe(bill.effectiveStatus);
                const showPay = bill.effectiveStatus === "overdue" || bill.effectiveStatus === "pending";
                return (
                  <div
                    key={bill.id}
                    className="ct-stack-sm"
                    style={{ borderLeft: `3px solid ${stripe}`, paddingLeft: 10, cursor: "pointer" }}
                    onClick={() => navigate("/ledger/bills", { state: { openBillId: bill.id } })}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") navigate("/ledger/bills", { state: { openBillId: bill.id } });
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="ct-row-between gap-2 min-w-0">
                      <div className="ct-row gap-2 min-w-0">
                        <span className="ct-icon-tile pos-icon liability shrink-0">
                          <CtIcon name="credit-card" size={18} />
                        </span>
                        <div className="min-w-0">
                          <p className="ct-body-strong truncate">{getBillDisplayName(bill)}</p>
                          <p className="ct-caption">
                            {t("ledger.emiPerMonth", { amount: formatAmount(Number(bill.amount) || 0) })}
                            {progress.label ? ` · ${progress.label}` : ""}
                          </p>
                        </div>
                      </div>
                      <span className="ct-numeral shrink-0" style={{ color: "var(--pos-liab)" }}>
                        {formatAmount(Number(bill.amount) || 0)}
                      </span>
                    </div>
                    {progress.totalCycles > 0 && (
                      <div className="ct-progress">
                        <div
                          className="ct-progress-bar ct-bar-animated"
                          style={{
                            width: `${Math.min(100, Math.round((progress.doneCycles / progress.totalCycles) * 100))}%`,
                          }}
                        />
                      </div>
                    )}
                    {showPay && (
                      <button
                        type="button"
                        className="ct-btn ct-btn-sm ct-btn-primary w-fit"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate("/ledger/bills", { state: { openBillId: bill.id } });
                        }}
                      >
                        {t("common.pay")}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      <button
        type="button"
        className="ct-btn ct-btn-ghost w-full"
        onClick={() => {
          onAdd?.();
          setEditEntry(null);
          setModalOpen(true);
        }}
      >
        + {t("ledger.addLiability")}
      </button>

      <WealthEntryModal
        open={modalOpen}
        kind={editEntry?.kind || "liability"}
        entry={editEntry}
        onClose={() => {
          setModalOpen(false);
          setEditEntry(null);
        }}
        onSave={(payload) => {
          if (editEntry) updateEntry(editEntry.id, payload);
          else addEntry(payload);
          setModalOpen(false);
          setEditEntry(null);
        }}
      />

      <button
        type="button"
        className="ct-settings-row ct-pressable"
        onClick={() => navigate("/ledger/spends")}
        style={{ marginTop: 4 }}
      >
        <span className="ct-settings-row-label" style={{ color: "var(--pos-text-muted)" }}>
          {t("ledger.viewCashFlow")}
        </span>
        <CtIcon name="arrow-right" size={14} className="text-[var(--pos-text-muted)]" />
      </button>
    </div>
  );
}
