import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CtIcon } from "../../icons/CtIcon.jsx";
import SpendSmsDetectModal from "../modals/SpendSmsDetectModal.jsx";
import LogSpendModal from "../modals/LogSpendModal.jsx";
import BankStatementImportModal from "../modals/BankStatementImportModal.jsx";
import DailySpendPanel from "../commitments/DailySpendPanel.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { tierHasFeature } from "../../../utils/tierAccess.js";
import { Button } from "../../primitives/Button.jsx";

/** Variable spends — import row + list. */
export default function SpendsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { settings, effectiveSubscriptionTier } = usePerovo();
  const [spendSmsOpen, setSpendSmsOpen] = useState(false);
  const [logSpendOpen, setLogSpendOpen] = useState(false);
  const [bankImportOpen, setBankImportOpen] = useState(false);

  const openBankImport = () => {
    if (!tierHasFeature("bank_import", settings, effectiveSubscriptionTier)) {
      navigate("/profile#upgrade");
      return;
    }
    setBankImportOpen(true);
  };

  return (
    <div className="ct-page ct-stack ct-money-spends-page">
      <div className="pos-tile instrument" style={{ margin: "0 0 10px" }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: "var(--pos-inst)",
            marginBottom: 4,
          }}
        >
          {t("money.spends.cashFlowLabel")}
        </div>
        <div style={{ fontSize: 12, color: "var(--ct-text-muted)" }}>{t("money.spends.cashFlowSub")}</div>
      </div>

      <div className="ct-money-import-row">
        <Button type="button" size="sm" variant="secondary" onClick={() => setSpendSmsOpen(true)}>
          <CtIcon name="device-mobile" size={16} />
          {t("money.spends.importSms")}
        </Button>
        <Button type="button" size="sm" variant="secondary" onClick={openBankImport}>
          <CtIcon name="file-text" size={16} />
          {t("money.spends.importBank")}
        </Button>
        <Button type="button" size="sm" onClick={() => setLogSpendOpen(true)}>
          {t("bills.actionLogSpend")}
        </Button>
      </div>

      <DailySpendPanel />

      <SpendSmsDetectModal open={spendSmsOpen} onClose={() => setSpendSmsOpen(false)} />
      {logSpendOpen ? <LogSpendModal onClose={() => setLogSpendOpen(false)} /> : null}
      {bankImportOpen ? <BankStatementImportModal onClose={() => setBankImportOpen(false)} /> : null}
    </div>
  );
}
