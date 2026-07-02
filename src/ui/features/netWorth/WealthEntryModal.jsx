import { useTranslation } from "../../../i18n/I18nProvider.js";
import { Modal } from "../../index.js";
import WealthEntryForm from "./WealthEntryForm.jsx";

export default function WealthEntryModal({
  open,
  kind,
  entry,
  defaultCategoryId = undefined,
  restrictedCategories = undefined,
  onClose,
  onSave,
}) {
  const { t } = useTranslation();
  if (!open) return null;

  return (
    <Modal
      title={t(entry ? "netWorth.editEntry" : kind === "asset" ? "netWorth.addAsset" : "netWorth.addLiability")}
      onClose={onClose}
    >
      <WealthEntryForm
        key={`${kind}-${entry?.id ?? "new"}-${defaultCategoryId ?? ""}`}
        kind={kind}
        entry={entry}
        defaultCategoryId={defaultCategoryId}
        restrictedCategories={restrictedCategories}
        onClose={onClose}
        onSave={onSave}
      />
    </Modal>
  );
}
