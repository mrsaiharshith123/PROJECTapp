import { useCallback, useMemo } from "react";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { exportLendingToExcel } from "../../../utils/excelExport.js";
import MoneyOverflowMenu from "../money/MoneyOverflowMenu.jsx";

/**
 * Stable header actions for Agreements — avoids remounting overflow menu on parent re-renders.
 */
export default function AgreementsHeaderActions({ lendings, onAdd, onRequestMoney }) {
  const { t } = useTranslation();

  const overflowItems = useMemo(
    () => [
      {
        id: "export",
        label: t("export.excel.lending"),
        onClick: () => {
          void exportLendingToExcel(lendings);
        },
      },
      {
        id: "request",
        label: t("lending.requestMoney"),
        onClick: onRequestMoney,
      },
    ],
    [lendings, t, onRequestMoney],
  );

  const handleAdd = useCallback(() => onAdd(), [onAdd]);

  return (
    <div className="ct-header-actions">
      <MoneyOverflowMenu items={overflowItems} />
      <button type="button" className="ct-btn ct-btn-primary ct-btn-sm" onClick={handleAdd}>
        {t("lending.addShort")}
      </button>
    </div>
  );
}
