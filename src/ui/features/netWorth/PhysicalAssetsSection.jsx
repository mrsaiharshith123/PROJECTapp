import { useMemo, useState } from "react";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { useNetWorth } from "../../../context/NetWorthContext.jsx";
import { formatInr } from "../../../constants/symbols.js";
import { isPhysicalAssetCategory } from "../../../utils/netWorth/physicalAssetHelpers.js";
import { EmptyState } from "../../index.js";
import WealthEntryCard from "./WealthEntryCard.jsx";
import WealthEntryModal from "./WealthEntryModal.jsx";
import { Caption } from "../../primitives/Text.jsx";

/** Physical assets panel — property, vehicle, gold, business. */
export default function PhysicalAssetsSection() {
  const { t } = useTranslation();
  const { entries, addEntry, updateEntry, deleteEntry, privacyMode } = useNetWorth();
  const [modal, setModal] = useState(/** @type {{ entry?: object } | null} */ (null));

  const physicalAssets = useMemo(
    () => entries.filter((e) => e.kind === "asset" && isPhysicalAssetCategory(e.categoryId)),
    [entries],
  );

  const totalValue = useMemo(
    () => physicalAssets.reduce((sum, e) => sum + (Number(e.value) || 0), 0),
    [physicalAssets],
  );

  const openAdd = () => setModal({});
  const openEdit = (entry) => setModal({ entry });

  const handleSave = (raw) => {
    if (modal?.entry) {
      updateEntry(modal.entry.id, raw);
    } else {
      addEntry(raw);
    }
  };

  return (
    <section className="ed-inset" aria-labelledby="physical-assets-heading">
      <div className="ed-inset">
<p className="ed-kicker">{t("netWorth.physical.title")}</p>
        <p className="ed-hero-number">{privacyMode ? "••••" : formatInr(totalValue)}</p>
        <Caption className="block mt-1 relative opacity-90">{t("netWorth.physical.subtitle")}</Caption>
      </div>

      {physicalAssets.length === 0 ? (
        <EmptyState icon="house" title={t("netWorth.physical.empty")} hint={t("netWorth.physical.emptyHint")} />
      ) : (
        <div className="ed-stack mt-3">
          {physicalAssets.map((entry) => (
            <WealthEntryCard
              key={entry.id}
              entry={entry}
              privacyMode={privacyMode}
              onEdit={openEdit}
              onDelete={deleteEntry}
            />
          ))}
        </div>
      )}

      <button type="button" className="ed-btn ed-btn-primary w-full mt-3" onClick={openAdd}>
        {t("netWorth.physical.addCta")}
      </button>

      <WealthEntryModal
        open={Boolean(modal)}
        kind="asset"
        entry={modal?.entry}
        defaultCategoryId="property_residential"
        onClose={() => setModal(null)}
        onSave={handleSave}
      />
    </section>
  );
}
