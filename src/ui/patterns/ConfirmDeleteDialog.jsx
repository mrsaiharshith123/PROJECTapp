import { Modal, Button } from "../index.js";
import { Body } from "../primitives/Text.jsx";
import { useTranslation } from "../../i18n/I18nProvider.js";

/**
 * Shared one-tap-away-from-irreversible confirm step. Renders nothing when
 * not open — callers gate on their own "pending delete id/target" state.
 * @param {{ open: boolean, title: string, message: string, onCancel: () => void, onConfirm: () => void }} props
 */
export default function ConfirmDeleteDialog({ open, title, message, onCancel, onConfirm }) {
  const { t } = useTranslation();
  if (!open) return null;

  return (
    <Modal
      title={title}
      onClose={onCancel}
      footer={
        <div className="flex gap-2 w-full">
          <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
            {t("common.cancel")}
          </Button>
          <Button type="button" variant="danger" className="flex-1" onClick={onConfirm}>
            {t("common.delete")}
          </Button>
        </div>
      }
    >
      <Body>{message}</Body>
    </Modal>
  );
}
