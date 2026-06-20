import { lazy, Suspense, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { QuickAction, QuickActionRow } from "../QuickAction.jsx";
import { Modal } from "../../primitives/Modal.jsx";
import MathCalculatorModal from "../modals/MathCalculatorModal.jsx";
import { LoadingSpinner } from "../../patterns/Loading.jsx";

const BillScannerTool = lazy(() => import("../tools/BillScannerTool.jsx"));

/**
 * Exactly four quick actions — Add, Scan bill, Log spend, Calculator.
 * @param {{ onOpenScanBill?: () => void }} props
 */
export default function HomeQuickActions({ onOpenScanBill }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [mathCalcOpen, setMathCalcOpen] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);

  const openScan = () => {
    if (onOpenScanBill) {
      onOpenScanBill();
      return;
    }
    setScanOpen(true);
  };

  return (
    <>
      <QuickActionRow>
        <QuickAction
          icon="+"
          label={t("copy.addBill")}
          primary
          onClick={() => navigate("/add")}
        />
        <QuickAction
          icon="receipt"
          label={t("home.actionScanBill")}
          tone="amber"
          onClick={openScan}
        />
        <QuickAction
          icon="fork-knife"
          label={t("bills.actionLogSpend")}
          tone="teal"
          onClick={() => navigate("/money/spends")}
        />
        <QuickAction
          icon="calculator"
          label={t("tools.mathCalc.short")}
          tone="violet"
          onClick={() => setMathCalcOpen(true)}
        />
      </QuickActionRow>

      {mathCalcOpen ? <MathCalculatorModal onClose={() => setMathCalcOpen(false)} /> : null}

      {scanOpen ? (
        <Modal title={t("tools.billScanner.title")} onClose={() => setScanOpen(false)}>
          <Suspense fallback={<LoadingSpinner size="sm" />}>
            <BillScannerTool />
          </Suspense>
        </Modal>
      ) : null}
    </>
  );
}
