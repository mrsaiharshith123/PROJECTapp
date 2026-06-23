import { useMemo, useState } from "react";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { useNetWorth } from "../../../context/NetWorthContext.jsx";
import { formatInr } from "../../../constants/symbols.js";
import { getBillDisplayName } from "../../../utils/billDisplayName.js";
import WealthEntryModal from "../netWorth/WealthEntryModal.jsx";
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
  const { entries, privacyMode } = useNetWorth();
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
    <div className="ct-stack">
      <div className="pos-hero instrument">
        <div className="pos-hero-glow instrument" aria-hidden />
        <p className="ct-caption uppercase tracking-wide">{t("ledger.tab.instruments")}</p>
        <p className="pos-display-amount instrument">{formatInr(total)}</p>
        <p className="ct-caption mt-1">{t("ledger.instrumentsMeta", { count })}</p>
      </div>

      {Object.entries(groups).map(([key, group]) => {
        if (!group.wealth.length && !group.bills.length) return null;
        const subtotal =
          sumEntryValues(group.wealth) + group.bills.reduce((s, b) => s + (Number(b.amount) || 0), 0);
        return (
          <section key={key}>
            <div className="pos-group-header">
              <span>{t(groupLabels[key])}</span>
              <span className="ct-numeral">{formatInr(subtotal)}</span>
            </div>
            <div className="pos-group-card ct-stack-sm">
              {group.wealth.map((entry) => (
                <div key={entry.id} className="ct-row-between gap-2 min-w-0">
                  <div className="ct-row gap-2 min-w-0">
                    <span className="ct-icon-tile pos-icon instrument shrink-0">
                      <CtIcon name="shield" size={18} />
                    </span>
                    <div className="min-w-0">
                      <p className="ct-body-strong truncate">{entry.name}</p>
                      <p className="ct-caption">{instrumentValueLabel(entry, t)}</p>
                    </div>
                  </div>
                  <span className="ct-numeral shrink-0" style={{ color: "var(--pos-inst)" }}>
                    {privacyMode ? "••••" : formatInr(entry.value)}
                  </span>
                </div>
              ))}
              {group.bills.map((bill) => {
                const displayAmount =
                  bill.category === "Insurance" && Number(bill.insuranceSumAssured) > 0
                    ? Number(bill.insuranceSumAssured)
                    : Number(bill.amount) || 0;
                return (
                <div key={bill.id} className="ct-row-between gap-2 min-w-0">
                  <div className="ct-row gap-2 min-w-0">
                    <span className="ct-icon-tile pos-icon instrument shrink-0">
                      <CtIcon name="shield" size={18} />
                    </span>
                    <div className="min-w-0">
                      <p className="ct-body-strong truncate">{getBillDisplayName(bill)}</p>
                      <p className="ct-caption">{billInstrumentLabel(bill, t)}</p>
                    </div>
                  </div>
                  <span className="ct-numeral shrink-0" style={{ color: "var(--pos-inst)" }}>
                    {formatInr(displayAmount)}
                  </span>
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
        onClose={() => setModalOpen(false)}
        onSave={() => setModalOpen(false)}
      />
    </div>
  );
}
