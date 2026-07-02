import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import CommitmentEditModal from "../../features/modals/CommitmentEditModal.jsx";
import BillDetailModal from "../../features/modals/BillDetailModal.jsx";
import SmsDetectModal from "../../features/modals/SmsDetectModal.jsx";
import BankStatementImportModal from "../../features/modals/BankStatementImportModal.jsx";
import CommitmentsBillsTab from "../../features/commitments/CommitmentsBillsTab.jsx";
import CommitmentsPaymentModal from "../../features/commitments/CommitmentsPaymentModal.jsx";
import PaymentDeadlineCalendarModal from "../../features/home/PaymentDeadlineCalendarModal.jsx";
import { CtIcon } from "../../icons/CtIcon.jsx";
import { Button } from "../../primitives/Button.jsx";
import { useCommitmentsBillData } from "../../features/commitments/useCommitmentsBillData.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { useCopy } from "../../../i18n/useCopy.js";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { tierHasFeature } from "../../../utils/tierAccess.js";
import { todayYmd } from "../../../utils/dates.js";
import {
  isCurrentCyclePaid,
  suggestedCyclePaymentAmount,
} from "../../../utils/commitmentPayments.js";
import { computeContractPaymentLedger } from "../../../utils/billPaymentProgress.js";
import { CelebrationOverlay } from "../../patterns/CelebrationOverlay.jsx";
import { exportCommitmentsToExcel } from "../../../utils/excelExport.js";
import { usePrivacyAmount } from "../../../hooks/usePrivacyAmount.js";

const Commitments = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { formatAmount } = usePrivacyAmount();
  const copy = useCopy();
  const [searchParams] = useSearchParams();
  const {
    sortedCommitments,
    commitments,
    getEffectiveStatus,
    addCommitmentPayment,
    removeCommitmentPayment,
    deleteCommitment,
    updateCommitment,
    todayStr,
    settings,
  } = usePerovo();

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState(() =>
    searchParams.get("filter") === "Subscription" ? "Subscription" : "",
  );
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPreset, setFilterPreset] = useState("");
  const filterPriority = "";
  const sortBy = "priority_due";
  const [showHistory, setShowHistory] = useState(false);
  const [editing, setEditing] = useState(null);
  const [detailFor, setDetailFor] = useState(null);
  const [paymentFor, setPaymentFor] = useState(null);
  const [payDate, setPayDate] = useState(() => todayYmd());
  const [smsOpen, setSmsOpen] = useState(false);
  const [bankImportOpen, setBankImportOpen] = useState(false);
  const [celebration, setCelebration] = useState(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const billIdHandledRef = useRef(false);

  useEffect(() => {
    if (billIdHandledRef.current) return;
    const openBillId = location.state?.openBillId;
    if (!openBillId) return;
    billIdHandledRef.current = true;
    const bill = commitments.find((c) => c.id === openBillId);
    window.history.replaceState({}, "", window.location.href);
    if (bill) queueMicrotask(() => setDetailFor(bill));
  }, [location.state?.openBillId, commitments]);

  const { activeBills, historyBills, counts } = useCommitmentsBillData({
    sortedCommitments,
    getEffectiveStatus,
    todayStr,
    search,
    filterCategory,
    filterStatus,
    filterPriority,
    filterPreset,
    sortBy,
  });

  const openPayment = (item) => {
    setPaymentFor(item);
    setPayDate(todayYmd());
  };

  const payOneCycle = () => {
    if (!paymentFor) return;
    const amt = suggestedCyclePaymentAmount(paymentFor, todayStr, sortedCommitments);
    if (amt <= 0) return;
    addCommitmentPayment(paymentFor.id, { amount: amt, date: payDate });
    const completedEmi = paymentFor.category === "EMI" || paymentFor.category === "Loan";
    const isLastPayment =
      paymentFor.repeatType === "none" ||
      (paymentFor.repaymentSchedule || []).every((r) => r.paymentStatus === "paid");
    if (completedEmi && isLastPayment) {
      setCelebration({
        type: "confetti",
        message: t("celebration.loanPaidOff", { name: paymentFor.name }),
      });
      const loanName = paymentFor.name;
      setPaymentFor(null);
      navigate("/insights/score", { state: { showPayoffShare: true, loanName } });
      return;
    }
    setCelebration({ type: "checkmark", message: t("celebration.paymentRecorded") });
    setPaymentFor(null);
  };

  const installmentAmount = paymentFor
    ? suggestedCyclePaymentAmount(paymentFor, todayStr, sortedCommitments)
    : 0;
  const contractStillToPay = paymentFor
    ? (computeContractPaymentLedger(paymentFor, todayStr, sortedCommitments).remainingToPay ?? 0)
    : 0;
  const cycleAlreadyPaid =
    paymentFor && isCurrentCyclePaid(paymentFor, todayStr, sortedCommitments);

  const totalMonthly = sortedCommitments.reduce((s, c) => s + (Number(c.monthlyAmount || c.emiAmount || 0)), 0);

  return (
    <div className="ct-page ct-stack ct-money-bills-page">
      <div className="pos-hero liability" style={{ background: "linear-gradient(150deg, rgba(244,63,94,0.12), rgba(13,14,24,0.95) 50%)", borderColor: "var(--pos-liab-border)", marginBottom: 8 }}>
        <div className="pos-hero-glow liability" aria-hidden />
        <p className="ct-caption uppercase tracking-wide">{t("bills.heroLabel")}</p>
        <p className="pos-display-amount" style={{ color: "var(--pos-liab)" }}>
          {formatAmount(totalMonthly)}
        </p>
        <p className="ct-caption mt-1">{t("bills.heroSub", { count: sortedCommitments.length })}</p>
      </div>

      <div className="ct-money-import-row">
        <Button type="button" size="sm" variant="secondary" onClick={() => exportCommitmentsToExcel(commitments)}>
          <CtIcon name="clipboard-text" size={16} />
          {t("export.excel.commitments")}
        </Button>
        <Button type="button" size="sm" variant="secondary" onClick={() => setCalendarOpen(true)}>
          <CtIcon name="calendar" size={16} />
          {t("home.actionCalendar")}
        </Button>
        <Button type="button" size="sm" variant="secondary" onClick={() => setSmsOpen(true)}>
          <CtIcon name="device-mobile" size={16} />
          {t("bills.detectSms")}
        </Button>
        {tierHasFeature("bank_import", settings) ? (
          <Button type="button" size="sm" variant="secondary" onClick={() => setBankImportOpen(true)}>
            <CtIcon name="file-arrow-up" size={16} />
            {t("bills.importBankStatement")}
          </Button>
        ) : null}
        <Button type="button" size="sm" onClick={() => navigate("/add")}>
          {t("bills.actionAddBill")}
        </Button>
      </div>

      <SmsDetectModal open={smsOpen} onClose={() => setSmsOpen(false)} />
      {bankImportOpen ? <BankStatementImportModal onClose={() => setBankImportOpen(false)} /> : null}
      <PaymentDeadlineCalendarModal
        key={calendarOpen ? `cal-${todayStr}` : "closed"}
        open={calendarOpen}
        onClose={() => setCalendarOpen(false)}
      />

      <CommitmentsBillsTab
        copy={copy}
        sortedCommitments={sortedCommitments}
        commitments={commitments}
        todayStr={todayStr}
        activeBills={activeBills}
        historyBills={historyBills}
        counts={counts}
        search={search}
        onSearchChange={setSearch}
        filterCategory={filterCategory}
        onFilterCategoryChange={setFilterCategory}
        filterStatus={filterStatus}
        onFilterStatusChange={setFilterStatus}
        filterPreset={filterPreset}
        onFilterPresetChange={setFilterPreset}
        showHistory={showHistory}
        onToggleHistory={() => setShowHistory((v) => !v)}
        onOpenDetail={setDetailFor}
        onOpenPayment={openPayment}
        onEdit={setEditing}
        onDelete={deleteCommitment}
        onAddCommitment={() => navigate("/add")}
        getEffectiveStatus={getEffectiveStatus}
      />

      <CommitmentsPaymentModal
        paymentFor={paymentFor}
        installmentAmount={installmentAmount}
        contractStillToPay={contractStillToPay}
        cycleAlreadyPaid={cycleAlreadyPaid}
        payDate={payDate}
        onPayDateChange={setPayDate}
        onPay={payOneCycle}
        onClose={() => setPaymentFor(null)}
      />

      {detailFor && (
        <BillDetailModal
          bill={sortedCommitments.find((c) => c.id === detailFor.id) || detailFor}
          todayStr={todayStr}
          allCommitments={sortedCommitments}
          displayStatus={getEffectiveStatus(
            sortedCommitments.find((c) => c.id === detailFor.id) || detailFor,
          )}
          onClose={() => setDetailFor(null)}
          onEdit={(bill) => {
            setDetailFor(null);
            setEditing(bill);
          }}
          onAddPayment={(bill) => {
            openPayment(bill);
          }}
          onUndoPayment={(bill, paymentIndex) => {
            removeCommitmentPayment(bill.id, paymentIndex);
          }}
          onDelete={(id) => {
            setDetailFor(null);
            deleteCommitment(id);
          }}
          sheet
        />
      )}

      {editing && (
        <CommitmentEditModal
          key={editing.id}
          commitment={editing}
          onClose={() => setEditing(null)}
          onSave={(id, patch) => updateCommitment(id, patch)}
        />
      )}

      {celebration && (
        <CelebrationOverlay
          type={celebration.type}
          show
          message={celebration.message}
          onComplete={() => setCelebration(null)}
        />
      )}
    </div>
  );
};

export default Commitments;
