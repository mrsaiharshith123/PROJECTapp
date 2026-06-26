import { useCallback } from "react";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { exportLendingToExcel } from "../../../utils/excelExport.js";
import { CtIcon } from "../../icons/CtIcon.jsx";
import { Button } from "../../primitives/Button.jsx";

/** Visible action row for Agreements — export, request, add (no overflow menu). */
export default function AgreementsHeaderActions({ lendings, onAdd, onRequestMoney }) {
  const { t } = useTranslation();

  const handleExport = useCallback(() => {
    void exportLendingToExcel(lendings);
  }, [lendings]);

  const handleAdd = useCallback(() => onAdd(), [onAdd]);

  return (
    <div className="ct-money-import-row">
      <Button type="button" size="sm" variant="secondary" onClick={handleExport}>
        <CtIcon name="clipboard-text" size={16} />
        {t("export.excel.lending")}
      </Button>
      <Button type="button" size="sm" variant="secondary" onClick={onRequestMoney}>
        <CtIcon name="handshake" size={16} />
        {t("lending.requestMoney")}
      </Button>
      <Button type="button" size="sm" onClick={handleAdd}>
        {t("lending.addShort")}
      </Button>
    </div>
  );
}
