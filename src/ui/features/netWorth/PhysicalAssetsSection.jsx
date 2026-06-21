import { useMemo, useState } from "react";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { useNetWorth } from "../../../context/NetWorthContext.jsx";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { isSalariedFamily } from "../../../constants/modeExperience.js";
import { formatInr } from "../../../constants/symbols.js";
import { isPhysicalAssetCategory } from "../../../utils/netWorth/physicalAssetHelpers.js";
import { Button, Caption, Heading, EmptyState } from "../../index.js";
import WealthEntryCard from "./WealthEntryCard.jsx";
import WealthEntryModal from "./WealthEntryModal.jsx";

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
      <div className="ct-row-between gap-2">
        <div>
          <Heading level={3} id="physical-assets-heading">
            {isFamily ? t("netWorth.physical.titleHousehold") : t("netWorth.physical.title")}
          </Heading>
          <Caption className="block mt-1">
            {isFamily ? t("netWorth.physical.subtitleHousehold") : t("netWorth.physical.subtitle")}
          </Caption>
        </div>
        {!privacyMode && physicalAssets.length > 0 && (
          <span className="ct-stat-value ct-numeral text-sm shrink-0">{formatInr(totalValue)}</span>
        )}
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

      <Button type="button" variant="secondary" className="w-full mt-3" onClick={openAdd}>
        {t("netWorth.physical.addCta")}
      </Button>

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
