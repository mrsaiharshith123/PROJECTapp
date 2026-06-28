import { useCallback } from "react";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { exportLendingToExcel } from "../../../utils/excelExport.js";
import { CtIcon } from "../../icons/CtIcon.jsx";

/** Agreements actions — export, request money, enter lender code (no manual add). */
export default function AgreementsHeaderActions({ lendings, onRequestMoney, onEnterCode }) {
  const { t } = useTranslation();

  const handleExport = useCallback(() => {
    void exportLendingToExcel(lendings);
  }, [lendings]);

  return (
    <div className="ed-agreements-actions">
      <button type="button" className="ed-agreements-action secondary" onClick={handleExport}>
        <CtIcon name="clipboard-text" size={13} />
        {t("export.excel.lending")}
      </button>
      <button type="button" className="ed-agreements-action primary" onClick={onRequestMoney}>
        <CtIcon name="handshake" size={13} />
        {t("lending.requestMoney")}
      </button>
      <button type="button" className="ed-agreements-action secondary" onClick={onEnterCode}>
        <CtIcon name="lock" size={13} />
        {t("lending.acceptCode.short")}
      </button>
    </div>
  );
}
