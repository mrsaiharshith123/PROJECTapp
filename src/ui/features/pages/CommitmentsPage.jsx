import { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { PageHeader, Fab, SegmentedControl } from "../../";
import { CtIcon } from "../../icons/CtIcon.jsx";
import CommitmentEditModal from "../../features/modals/CommitmentEditModal.jsx";
import BillDetailModal from "../../features/modals/BillDetailModal.jsx";
import SmsDetectModal from "../../features/modals/SmsDetectModal.jsx";
import SpendSmsDetectModal from "../../features/modals/SpendSmsDetectModal.jsx";
import LogSpendModal from "../../features/modals/LogSpendModal.jsx";
import BankStatementImportModal from "../../features/modals/BankStatementImportModal.jsx";
import DailySpendPanel from "../../features/commitments/DailySpendPanel.jsx";
import CommitmentsBillsTab from "../../features/commitments/CommitmentsBillsTab.jsx";
import CommitmentsPaymentModal from "../../features/commitments/CommitmentsPaymentModal.jsx";
import { useCommitmentsBillData } from "../../features/commitments/useCommitmentsBillData.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { useCopy } from "../../../i18n/useCopy.js";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import { todayYmd } from "../../../utils/dates.js";
import {
  isCurrentCyclePaid,
  suggestedCyclePaymentAmount,
} from "../../../utils/commitmentPayments.js";
import { computeContractPaymentLedger } from "../../../utils/billPaymentProgress.js";
import { tierHasFeature } from "../../../utils/tierAccess.js";

const Commitments = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const copy = useCopy();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    sortedCommitments,
    commitments,
    getEffectiveStatus,
    addCommitmentPayment,
    deleteCommitment,
    updateCommitment,
    dailySpends,
    todayStr,
    settings,
  } = useCommitTrack();

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState(() =>
    searchParams.get("filter") === "Subscription" ? "Subscription" : "",
  );
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPreset, setFilterPreset] = useState("");
  const filterPriority = "";
  const sortBy = "priority_due";
  const [showHistory, setShowHistory] = useState(true);
  const [editing, setEditing] = useState(null);
  const [detailFor, setDetailFor] = useState(null);
  const [paymentFor, setPaymentFor] = useState(null);
  const [payDate, setPayDate] = useState(() => todayYmd());
  const [smsOpen, setSmsOpen] = useState(false);
  const [spendSmsOpen, setSpendSmsOpen] = useState(false);
  const [logSpendOpen, setLogSpendOpen] = useState(false);
  const [bankImportOpen, setBankImportOpen] = useState(false);
  const [pageTab, setPageTab] = useState(() =>
    searchParams.get("tab") === "spend" ? "spend" : "bills",
  );

  const openBankImport = () => {
    if (!tierHasFeature("bank_import", settings)) {
      navigate("/profile#upgrade");
      return;
    }
    setBankImportOpen(true);
  };

  const switchTab = (tab) => {
    setPageTab(tab);
    if (tab === "spend") {
      setSearchParams({ tab: "spend" }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  };

  useEffect(() => {
    const openBillId = location.state?.openBillId;
    if (!openBillId) return;
    const bill = commitments.find((c) => c.id === openBillId);
    navigate(location.pathname + location.search, { replace: true, state: {} });
    if (!bill) return;
    queueMicrotask(() => {
      setPageTab("bills");
      setDetailFor(bill);
    });
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

  return (
    <div className="ct-page">
      <PageHeader
        title={copy.billsPageTitle}
        eyebrow={t("bills.eyebrowMonthly")}
        actions={
          <div className="ct-header-actions">
            {pageTab === "spend" ? (
              <>
                <button
                  type="button"
                  className="ct-btn ct-btn-ghost ct-btn-sm ct-header-icon-btn"
                  aria-label="Import bank statement"
                  onClick={openBankImport}
                >
                  <CtIcon name="file-text" size={22} />
                </button>
                <button
                  type="button"
                  className="ct-btn ct-btn-ghost ct-btn-sm ct-header-icon-btn"
                  aria-label={t("bills.detectSmsSpend")}
                  onClick={() => setSpendSmsOpen(true)}
                >
                  <CtIcon name="device-mobile" size={22} />
                </button>
                <Fab type="button" onClick={() => setLogSpendOpen(true)} aria-label={t("bills.actionLogSpend")}>
                  +
                </Fab>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="ct-btn ct-btn-ghost ct-btn-sm ct-header-icon-btn"
                  aria-label={t("bills.detectSms")}
                  onClick={() => setSmsOpen(true)}
                >
                  <CtIcon name="device-mobile" size={22} />
                </button>
                <Fab type="button" onClick={() => navigate("/add")} aria-label={t("bills.actionAddBill")}>
                  +
                </Fab>
              </>
            )}
          </div>
        }
      />
      <SmsDetectModal open={smsOpen} onClose={() => setSmsOpen(false)} />
      <SpendSmsDetectModal open={spendSmsOpen} onClose={() => setSpendSmsOpen(false)} />
      {logSpendOpen && <LogSpendModal onClose={() => setLogSpendOpen(false)} />}
      {bankImportOpen && <BankStatementImportModal onClose={() => setBankImportOpen(false)} />}

      <SegmentedControl
        options={[
          { id: "bills", label: t("bills.tabRecurring") },
          { id: "spend", label: t("bills.tabVariable") },
        ]}
        value={pageTab}
        onChange={switchTab}
      />

      {pageTab === "spend" ? (
        <DailySpendPanel />
      ) : (
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
        />
      )}

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
          bill={detailFor}
          todayStr={todayStr}
          allCommitments={sortedCommitments}
          displayStatus={getEffectiveStatus(detailFor)}
          onClose={() => setDetailFor(null)}
          onEdit={(bill) => {
            setDetailFor(null);
            setEditing(bill);
          }}
          onAddPayment={(bill) => {
            setDetailFor(null);
            openPayment(bill);
          }}
          onDelete={(id) => {
            setDetailFor(null);
            deleteCommitment(id);
          }}
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
    </div>
  );
};

export default Commitments;
