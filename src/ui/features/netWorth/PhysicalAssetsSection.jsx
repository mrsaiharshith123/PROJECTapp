import { useMemo, useState } from "react";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { useNetWorth } from "../../../context/NetWorthContext.jsx";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { isSalariedFamily } from "../../../constants/modeExperience.js";
import { formatInr } from "../../../constants/symbols.js";
import { isPhysicalAssetCategory } from "../../../utils/netWorth/physicalAssetHelpers.js";
import { EmptyState } from "../../index.js";
import WealthEntryCard from "./WealthEntryCard.jsx";
import WealthEntryModal from "./WealthEntryModal.jsx";
import { Caption } from "../../primitives/Text.jsx";

/** Physical assets panel — property, vehicle, gold, business. */
export default function PhysicalAssetsSection() {
  const { t } = useTranslation();
  const { settings } = usePerovo();
  const isFamily = isSalariedFamily(settings);
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
    <section className="ct-nw-panel ct-animate-fade-up" aria-labelledby="physical-assets-heading">
      <div className="ct-hero-card wealth ct-tool-answer-hero">
        <div className="ct-hero-glow teal" aria-hidden />
        <p className="ct-hero-label">{isFamily ? t("netWorth.physical.titleHousehold") : t("netWorth.physical.title")}</p>
        <p className="ct-hero-number">{privacyMode ? "••••" : formatInr(totalValue)}</p>
        <Caption className="block mt-1 relative opacity-90">
          {isFamily ? t("netWorth.physical.subtitleHousehold") : t("netWorth.physical.subtitle")}
        </Caption>
      </div>

      {physicalAssets.length === 0 ? (
        <EmptyState
          icon="house"
          title={isFamily ? t("netWorth.physical.emptyHousehold") : t("netWorth.physical.empty")}
          hint={t("netWorth.physical.emptyHint")}
        />
      ) : (
        <div className="ct-stack mt-3">
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

      <button type="button" className="ct-btn ct-btn-primary w-full mt-3" onClick={openAdd}>
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
