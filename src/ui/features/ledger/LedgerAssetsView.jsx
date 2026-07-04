import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { useNetWorth } from "../../../context/NetWorthContext.jsx";
import { usePrivacyAmount } from "../../../hooks/usePrivacyAmount.js";
import WealthEntryCard from "../netWorth/WealthEntryCard.jsx";
import WealthEntryModal from "../netWorth/WealthEntryModal.jsx";
import { CORE_ASSET_CATEGORIES } from "../../../constants/netWorth/wealthCategories.js";
import {
  ASSET_GROUP_LIQUID,
  ASSET_GROUP_MARKET,
  ASSET_GROUP_PROPERTY,
  filterWealthByCategories,
  isCoreAssetEntry,
  sumEntryValues,
} from "../../../utils/ledger/ledgerBuckets.js";

const GROUPS = [
  { id: "property", labelKey: "ledger.group.property", ids: ASSET_GROUP_PROPERTY },
  { id: "liquid", labelKey: "ledger.group.liquid", ids: ASSET_GROUP_LIQUID },
  { id: "market", labelKey: "ledger.group.market", ids: ASSET_GROUP_MARKET },
];

/** @param {{ onAdd?: () => void, openAddOnMount?: boolean }} props */
export default function LedgerAssetsView({ onAdd, openAddOnMount = false }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { entries, privacyMode, growth, addEntry, updateEntry, deleteEntry } = useNetWorth();
  const { formatAmount } = usePrivacyAmount();
  const [modalOpen, setModalOpen] = useState(openAddOnMount);
  const [editEntry, setEditEntry] = useState(null);

  const assets = useMemo(() => entries.filter(isCoreAssetEntry), [entries]);
  const total = useMemo(() => sumEntryValues(assets), [assets]);

  const openAdd = () => {
    setEditEntry(null);
    setModalOpen(true);
    onAdd?.();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="ed-ins-story ed-ledger-hero">
        <div className="ed-ins-kicker">{t("ledger.totalAssets")}</div>
        <div className="ed-ledger-hero-row">
          <div className="ed-ins-bignum">
            <span className="sym">₹</span>
            {formatAmount(total).replace("₹", "").trim()}
          </div>
          <button type="button" className="ed-ins-link" onClick={() => navigate("/insights/assets")}>
            {t("ledger.viewInsightsLink")}
          </button>
        </div>
        <div className="ed-ins-body">
          {t("ledger.assetsMeta", {
            count: assets.length,
            growth:
              growth?.yearlyPct != null
                ? `${growth.yearlyPct >= 0 ? "+" : ""}${growth.yearlyPct.toFixed(1)}%`
                : "—",
          })}
        </div>
      </div>

      {GROUPS.map((group) => {
        const groupEntries = filterWealthByCategories(assets, group.ids);
        if (!groupEntries.length) return null;
        const subtotal = sumEntryValues(groupEntries);
        return (
          <section key={group.id}>
            <div className="pos-group-header">
              <span>{t(group.labelKey)}</span>
              <span className="ed-display-sm">{formatAmount(subtotal)}</span>
            </div>
            <div className="pos-group-card">
              {groupEntries.map((entry) => (
                <WealthEntryCard
                  key={entry.id}
                  entry={entry}
                  privacyMode={privacyMode}
                  onAnalyze={() => navigate(`/insights/entry/${entry.id}`)}
                  onEdit={() => {
                    setEditEntry(entry);
                    setModalOpen(true);
                  }}
                  onDelete={deleteEntry}
                />
              ))}
            </div>
          </section>
        );
      })}

      <button type="button" className="ed-btn ed-btn-ghost ed-btn-block" onClick={openAdd}>
        + {t("ledger.addAsset")}
      </button>

      <WealthEntryModal
        open={modalOpen}
        kind={editEntry?.kind || "asset"}
        entry={editEntry}
        restrictedCategories={CORE_ASSET_CATEGORIES}
        onClose={() => {
          setModalOpen(false);
          setEditEntry(null);
        }}
        onSave={(payload) => {
          if (editEntry) {
            updateEntry(editEntry.id, payload);
          } else {
            addEntry(payload);
          }
          setModalOpen(false);
          setEditEntry(null);
        }}
      />
    </div>
  );
}
