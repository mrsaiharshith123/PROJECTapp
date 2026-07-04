import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { useNetWorth } from "../../../context/NetWorthContext.jsx";
import { usePrivacyAmount } from "../../../hooks/usePrivacyAmount.js";
import { getBillDisplayName } from "../../../utils/billDisplayName.js";
import WealthEntryModal from "../netWorth/WealthEntryModal.jsx";
import { INSTRUMENT_CATEGORIES } from "../../../constants/netWorth/wealthCategories.js";
import {
  isInstrumentCommitment,
  isInstrumentWealthEntry,
  sumEntryValues,
} from "../../../utils/ledger/ledgerBuckets.js";
import { CtIcon } from "../../icons/CtIcon.jsx";

const GROUP_INSURANCE = new Set(["insurance"]);
const GROUP_RETIREMENT = new Set(["pf_epf"]);
const GROUP_FIXED = new Set(["fd", "rd"]);
const GROUP_SIP = new Set(["sip"]);

function instrumentWealthGroup(categoryId) {
  if (GROUP_INSURANCE.has(categoryId)) return "insurance";
  if (GROUP_RETIREMENT.has(categoryId)) return "retirement";
  if (GROUP_FIXED.has(categoryId)) return "fixed";
  if (GROUP_SIP.has(categoryId)) return "sip";
  return "insurance";
}

function instrumentValueLabel(entry, t) {
  if (entry.categoryId === "insurance") return t("ledger.instrumentSumAssured");
  if (entry.categoryId === "pf_epf") return t("ledger.instrumentCorpus");
  return t("ledger.instrumentCurrentValue");
}

function billInstrumentLabel(bill, t) {
  if (bill.category === "Insurance") {
    const sum = Number(bill.insuranceSumAssured) || 0;
    return sum > 0 ? t("ledger.instrumentSumAssured") : t("ledger.instrumentPremium");
  }
  return bill.category;
}

/**
 * @param {{ onAdd?: () => void, openAddOnMount?: boolean }} props
 */
export default function LedgerInstrumentsView({ onAdd, openAddOnMount = false }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { entries, addEntry } = useNetWorth();
  const { formatAmount } = usePrivacyAmount();
  const { sortedCommitments } = usePerovo();
  const [modalOpen, setModalOpen] = useState(openAddOnMount);

  const wealthInstruments = useMemo(() => entries.filter(isInstrumentWealthEntry), [entries]);
  const insuranceBills = useMemo(
    () => sortedCommitments.filter((c) => isInstrumentCommitment(c)),
    [sortedCommitments],
  );

  const wealthTotal = sumEntryValues(wealthInstruments);
  const billsTotal = insuranceBills.reduce((s, c) => s + (Number(c.amount) || 0), 0);
  const total = wealthTotal + billsTotal;
  const count = wealthInstruments.length + insuranceBills.length;

  const groups = useMemo(() => {
    /** @type {Record<string, { wealth: object[], bills: object[] }>} */
    const out = {
      insurance: { wealth: [], bills: [] },
      retirement: { wealth: [], bills: [] },
      fixed: { wealth: [], bills: [] },
      sip: { wealth: [], bills: [] },
    };
    for (const w of wealthInstruments) {
      out[instrumentWealthGroup(w.categoryId)].wealth.push(w);
    }
    for (const b of insuranceBills) {
      const key = b.category === "SIP" ? "sip" : "insurance";
      out[key].bills.push(b);
    }
    return out;
  }, [wealthInstruments, insuranceBills]);

  const groupLabels = {
    insurance: "ledger.group.insurance",
    retirement: "ledger.group.retirement",
    fixed: "ledger.group.fixedIncome",
    sip: "ledger.group.sipPlans",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="ed-ins-story ed-ledger-hero">
        <div className="ed-ins-kicker">{t("ledger.tab.instruments")}</div>
        <div className="ed-ledger-hero-row">
          <div className="ed-ins-bignum ed-ledger-hero-val-inst">
            <span className="sym">₹</span>
            {formatAmount(total).replace("₹", "").trim()}
          </div>
          <button type="button" className="ed-ins-link" onClick={() => navigate("/insights/instruments")}>
            {t("ledger.viewInsightsLink")}
          </button>
        </div>
        <div className="ed-ins-body">{t("ledger.instrumentsMeta", { count })}</div>
      </div>

      {Object.entries(groups).map(([key, group]) => {
        if (!group.wealth.length && !group.bills.length) return null;
        const subtotal =
          sumEntryValues(group.wealth) + group.bills.reduce((s, b) => s + (Number(b.amount) || 0), 0);
        return (
          <section key={key}>
            <div className="pos-group-header">
              <span>{t(groupLabels[key])}</span>
              <span className="ed-display-sm">{formatAmount(subtotal)}</span>
            </div>
            <div className="pos-group-card" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {group.wealth.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  className="ed-row ed-row-press"
                  style={{ width: "100%", textAlign: "left" }}
                  onClick={() => navigate(`/insights/entry/${entry.id}`)}
                >
                  <div className="ed-row-icon">
                    <CtIcon name="shield" size={16} />
                  </div>
                  <div className="ed-row-left">
                    <div className="ed-row-title">{entry.name}</div>
                    <div className="ed-row-sub">{instrumentValueLabel(entry, t)}</div>
                  </div>
                  <div className="ed-row-right">
                    <div className="ed-row-value" style={{ color: "var(--pos-inst)" }}>
                      {formatAmount(entry.value)}
                    </div>
                  </div>
                </button>
              ))}
              {group.bills.map((bill) => {
                const displayAmount =
                  bill.category === "Insurance" && Number(bill.insuranceSumAssured) > 0
                    ? Number(bill.insuranceSumAssured)
                    : Number(bill.amount) || 0;
                return (
                <button
                  key={bill.id}
                  type="button"
                  className="ed-row ed-row-press"
                  style={{ width: "100%", textAlign: "left" }}
                  onClick={() => navigate("/ledger/bills", { state: { openBillId: bill.id } })}
                >
                  <div className="ed-row-icon">
                    <CtIcon name="shield" size={16} />
                  </div>
                  <div className="ed-row-left">
                    <div className="ed-row-title">{getBillDisplayName(bill)}</div>
                    <div className="ed-row-sub">{billInstrumentLabel(bill, t)}</div>
                  </div>
                  <div className="ed-row-right">
                    <div className="ed-row-value" style={{ color: "var(--pos-inst)" }}>
                      {formatAmount(displayAmount)}
                    </div>
                  </div>
                </button>
              );
              })}
            </div>
          </section>
        );
      })}

      <button
        type="button"
        className="ed-btn ed-btn-ghost ed-btn-block"
        onClick={() => {
          onAdd?.();
          setModalOpen(true);
        }}
      >
        + {t("ledger.addInstrument")}
      </button>

      <WealthEntryModal
        open={modalOpen}
        kind="asset"
        entry={null}
        defaultCategoryId="insurance"
        restrictedCategories={INSTRUMENT_CATEGORIES}
        onClose={() => setModalOpen(false)}
        onSave={(payload) => {
          addEntry(payload);
          setModalOpen(false);
        }}
      />
    </div>
  );
}
