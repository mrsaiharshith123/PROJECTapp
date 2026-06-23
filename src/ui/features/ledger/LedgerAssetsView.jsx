import { useMemo, useState } from "react";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { useNetWorth } from "../../../context/NetWorthContext.jsx";
import { formatInr } from "../../../constants/symbols.js";
import WealthEntryCard from "../netWorth/WealthEntryCard.jsx";
import WealthEntryModal from "../netWorth/WealthEntryModal.jsx";
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
  const { entries, privacyMode, growth } = useNetWorth();
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
    <div className="ct-stack">
      <div className="pos-hero asset">
        <div className="pos-hero-glow asset" aria-hidden />
        <p className="ct-caption uppercase tracking-wide">{t("ledger.totalAssets")}</p>
        <p className="pos-display-amount">{formatInr(total)}</p>
        <p className="ct-caption mt-1">
          {t("ledger.assetsMeta", {
            count: assets.length,
            growth: growth?.yearlyPct != null ? `${growth.yearlyPct >= 0 ? "+" : ""}${growth.yearlyPct.toFixed(1)}%` : "—",
          })}
        </p>
      </div>

      {GROUPS.map((group) => {
        const groupEntries = filterWealthByCategories(assets, group.ids);
        if (!groupEntries.length) return null;
        const subtotal = sumEntryValues(groupEntries);
        return (
          <section key={group.id}>
            <div className="pos-group-header">
              <span>{t(group.labelKey)}</span>
              <span className="ct-numeral">{formatInr(subtotal)}</span>
            </div>
            <div className="pos-group-card">
              {groupEntries.map((entry) => (
                <WealthEntryCard
                  key={entry.id}
                  entry={entry}
                  privacyMode={privacyMode}
                  onEdit={() => {
                    setEditEntry(entry);
                    setModalOpen(true);
                  }}
                />
              ))}
            </div>
          </section>
        );
      })}

      <button type="button" className="ct-btn ct-btn-ghost w-full" onClick={openAdd}>
        + {t("ledger.addAsset")}
      </button>

      <WealthEntryModal
        open={modalOpen}
        kind={editEntry?.kind || "asset"}
        entry={editEntry}
        onClose={() => {
          setModalOpen(false);
          setEditEntry(null);
        }}
        onSave={() => {
          setModalOpen(false);
          setEditEntry(null);
        }}
      />
    </div>
  );
}
