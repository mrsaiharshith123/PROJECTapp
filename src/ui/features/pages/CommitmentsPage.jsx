import { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { CtIcon } from "../../icons/CtIcon.jsx";
import CommitmentEditModal from "../../features/modals/CommitmentEditModal.jsx";
import BillDetailModal from "../../features/modals/BillDetailModal.jsx";
import SmsDetectModal from "../../features/modals/SmsDetectModal.jsx";
import CommitmentsBillsTab from "../../features/commitments/CommitmentsBillsTab.jsx";
import CommitmentsPaymentModal from "../../features/commitments/CommitmentsPaymentModal.jsx";
import PaymentDeadlineCalendarModal from "../../features/dashboard/PaymentDeadlineCalendarModal.jsx";
import MoneyOverflowMenu from "../../features/money/MoneyOverflowMenu.jsx";
import { useCommitmentsBillData } from "../../features/commitments/useCommitmentsBillData.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { useCopy } from "../../../i18n/useCopy.js";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { todayYmd } from "../../../utils/dates.js";
import {
  isCurrentCyclePaid,
  suggestedCyclePaymentAmount,
} from "../../../utils/commitmentPayments.js";
import { computeContractPaymentLedger } from "../../../utils/billPaymentProgress.js";
import { CelebrationOverlay } from "../../patterns/CelebrationOverlay.jsx";
import { exportCommitmentsToExcel } from "../../../utils/excelExport.js";

const Commitments = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
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
    dailySpends,
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
  const [celebration, setCelebration] = useState(null);
  const [calendarOpen, setCalendarOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get("tab") === "spend") {
      navigate("/money/spends", { replace: true });
    }
  }, [searchParams, navigate]);

  useEffect(() => {
    const openBillId = location.state?.openBillId;
    if (!openBillId) return;
    const bill = commitments.find((c) => c.id === openBillId);
    navigate(location.pathname + location.search, { replace: true, state: {} });
    if (!bill) return;
    queueMicrotask(() => setDetailFor(bill));
  }, [location.state?.openBillId, commitments, location.pathname, location.search, navigate]);

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
      navigate("/profile/scores", { state: { showPayoffShare: true, loanName } });
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

  const overflowItems = [
    {
      id: "export",
      label: t("export.excel.commitments"),
      onClick: () => exportCommitmentsToExcel(commitments),
    },
    {
      id: "calendar",
      label: t("home.actionCalendar"),
      onClick: () => setCalendarOpen(true),
    },
    {
      id: "sms",
      label: t("bills.detectSms"),
      onClick: () => setSmsOpen(true),
    },
  ];

  return (
    <div className="ct-page ct-stack ct-money-bills-page">
      <div className="ct-row-between gap-2 mb-1">
        <p className="ct-analytics-section-title">{t("money.tab.bills")}</p>
        <div className="ct-header-actions">
          <MoneyOverflowMenu items={overflowItems} />
          <button
            type="button"
            className="ct-back-btn ct-bills-add-btn"
            onClick={() => navigate("/add")}
            aria-label={t("bills.actionAddBill")}
          >
            +
          </button>
        </div>
      </div>

      <SmsDetectModal open={smsOpen} onClose={() => setSmsOpen(false)} />
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
        dailySpends={dailySpends}
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
