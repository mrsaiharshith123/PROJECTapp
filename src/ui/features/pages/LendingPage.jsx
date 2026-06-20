import { useMemo, useState } from "react";
import { Card, Caption, Button, fieldInputClass, EmptyState, inputClassName } from "../../";
import { exportLendingToExcel } from "../../../utils/excelExport.js";
import { buildLendingRecord } from "../../../utils/lendingRecord.js";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { todayYmd } from "../../../utils/dates.js";
import LendingEntryCard from "../lending/LendingEntryCard.jsx";
import LendingPageDialogs from "../lending/LendingPageDialogs.jsx";
import { useLendingLists } from "../lending/useLendingLists.js";
import { canEditLending } from "../../../engines/lendingAgreement.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import BillSplitModal from "../modals/BillSplitModal.jsx";
import { canAddLendingRecord } from "../../../utils/tierAccess.js";
import { TierLimitBanner } from "../../patterns/TierLimitBanner.jsx";
import LendingOverduePanel from "../lending/LendingOverduePanel.jsx";
import LendingHeroSummary from "../money/LendingHeroSummary.jsx";
import MoneyOverflowMenu from "../money/MoneyOverflowMenu.jsx";
import { Fab } from "../../index.js";
import { SegmentedControl } from "../../patterns/SegmentedControl.jsx";

const emptyLendingForm = () => ({
  personName: "",
  type: "lent",
  totalAmount: "",
  dueDate: "",
  startDate: "",
  endDate: "",
  interestRate: "0",
  interestType: "simple",
  repaymentFrequency: "monthly",
  repaymentType: "monthly",
  relationshipTag: "Other",
  notes: "",
});

const Lending = () => {
  const { t } = useTranslation();
  const { lendings, settings, todayStr, addLending, updateLending, deleteLending, addLendingPayment } =
    usePerovo();
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const [paymentFor, setPaymentFor] = useState(null);
  const [form, setForm] = useState(emptyLendingForm);
  const [payAmount, setPayAmount] = useState("");
  const [payDate, setPayDate] = useState(() => todayYmd());
  const [formErrors, setFormErrors] = useState({});
  const [detailFor, setDetailFor] = useState(null);
  const [showRequest, setShowRequest] = useState(false);
  const [billSplitOpen, setBillSplitOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [listTab, setListTab] = useState("lent");

  const { borrowedList, lentList, totals, trustScore } = useLendingLists(lendings, searchQuery);

  const resetForm = () => {
    setForm(emptyLendingForm());
    setFormErrors({});
  };

  const validateForm = () => {
    const errs = {};
    if (!form.personName.trim()) errs.personName = "Name is required";
    if (!form.totalAmount || Number(form.totalAmount) <= 0) errs.totalAmount = "Enter a valid amount";
    if (!form.dueDate) errs.dueDate = "Due date is required";
    if (form.interestRate === "" || Number.isNaN(Number(form.interestRate))) {
      errs.interestRate = "Interest rate is required";
    } else if (Number(form.interestRate) < 0 || Number(form.interestRate) > 60) {
      errs.interestRate = "Rate must be 0–60%";
    }
    return errs;
  };

  const lendingPayload = () =>
    buildLendingRecord({
      type: form.type,
      personName: form.personName.trim(),
      totalAmount: form.totalAmount,
      dueDate: form.dueDate,
      interestRate: Number(form.interestRate) || 0,
      notes: form.notes.trim(),
      relationshipTag: form.relationshipTag,
      extra: {
        startDate: form.startDate || form.dueDate,
        endDate: form.endDate,
        interestType: form.interestType,
        repaymentFrequency: form.repaymentFrequency,
        repaymentType: form.repaymentType,
      },
    });

  const submitAdd = () => {
    const errs = validateForm();
    if (Object.keys(errs).length) {
      setFormErrors(errs);
      return;
    }
    const gate = canAddLendingRecord(settings, lendings);
    if (!gate.ok) return;
    addLending(lendingPayload());
    resetForm();
    setShowAdd(false);
  };

  const submitEdit = () => {
    if (!editing) return;
    const errs = validateForm();
    if (Object.keys(errs).length) {
      setFormErrors(errs);
      return;
    }
    updateLending(editing.id, lendingPayload());
    resetForm();
    setEditing(null);
  };

  const openEdit = (l) => {
    if (!canEditLending(l)) return;
    setEditing(l);
    setForm({
      personName: l.personName,
      type: l.type,
      totalAmount: String(l.principalAmount ?? l.totalAmount),
      dueDate: l.dueDate || "",
      startDate: l.startDate || l.dueDate || "",
      endDate: l.endDate || "",
      interestRate: String(l.interestRate ?? 0),
      interestType: l.interestType || "simple",
      repaymentFrequency: l.repaymentFrequency || l.repaymentType || "monthly",
      repaymentType: l.repaymentType || "monthly",
      relationshipTag: l.relationshipTag || "Other",
      notes: l.notes || "",
    });
    setFormErrors({});
  };

  const openPayment = (l) => {
    setPaymentFor(l);
    setPayAmount("");
    setPayDate(todayYmd());
  };

  const submitPayment = () => {
    if (!paymentFor) return;
    const amt = Math.max(0, Number(payAmount) || 0);
    if (amt <= 0) return;
    addLendingPayment(paymentFor.id, { amount: amt, date: payDate });
    setPaymentFor(null);
  };

  const payRemaining = () => {
    if (!paymentFor) return;
    const rem = Number(paymentFor.remainingAmount) || 0;
    if (rem <= 0) return;
    addLendingPayment(paymentFor.id, { amount: rem, date: payDate });
    setPaymentFor(null);
  };

  const fieldClass = (field) => fieldInputClass(Boolean(formErrors[field]));

  const closeAdd = () => {
    setShowAdd(false);
    resetForm();
  };

  const closeEdit = () => {
    setEditing(null);
    resetForm();
  };

  const overflowItems = [
    {
      id: "export",
      label: t("export.excel.lending"),
      onClick: () => exportLendingToExcel(lendings),
    },
    {
      id: "request",
      label: t("lending.requestMoney"),
      onClick: () => setShowRequest(true),
    },
    {
      id: "split",
      label: t("lending.splitBill"),
      onClick: () => setBillSplitOpen(true),
    },
  ];

  const visibleList = listTab === "lent" ? lentList : borrowedList;

  return (
    <div className="ct-stack ct-money-lending-page">
      <div className="ct-row-between gap-2 mb-1">
        <span className="ct-caption">{t("lending.subtitle")}</span>
        <div className="ct-header-actions">
          <MoneyOverflowMenu items={overflowItems} />
          <Fab
            type="button"
            aria-label={t("lending.addShort")}
            onClick={() => {
              resetForm();
              setShowAdd(true);
            }}
          >
            +
          </Fab>
        </div>
      </div>

      {!canAddLendingRecord(settings, lendings).ok && (
        <TierLimitBanner
          className="ct-tier-banner-warm"
          title={t("tier.limit.lendingTitle")}
          message={t("tier.limit.lendingMessage", { limit: 5 })}
        />
      )}

      <LendingHeroSummary totals={totals} trustScore={trustScore} dealCount={lendings.length} />

      <input
        className={inputClassName()}
        placeholder={t("bills.searchPlaceholder")}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      <LendingOverduePanel />

      <SegmentedControl
        options={[
          { id: "lent", label: t("lending.sectionLent") },
          { id: "owe", label: t("lending.sectionOwe") },
        ]}
        value={listTab}
        onChange={setListTab}
      />

      {borrowedList.length === 0 && lentList.length === 0 && (
        <EmptyState
          icon="handshake"
          title={t("lending.emptyTitle")}
          message={t("lending.empty")}
          action={
            <Button
              type="button"
              onClick={() => {
                resetForm();
                setShowAdd(true);
              }}
            >
              {t("lending.addShort")}
            </Button>
          }
        />
      )}

      {visibleList.length > 0 && (
        <section className="ct-stack-sm ct-list-animate">
          {visibleList.map((item) => (
            <LendingEntryCard
              key={item.id}
              item={item}
              todayStr={todayStr}
              onPayment={openPayment}
              onDetail={setDetailFor}
              onEdit={openEdit}
              onDelete={deleteLending}
            />
          ))}
        </section>
      )}

      {visibleList.length === 0 && (borrowedList.length > 0 || lentList.length > 0) && (
        <EmptyState icon="handshake" title={t("bills.noMatchFilters")} hint={t("lending.empty")} />
      )}

      {billSplitOpen && <BillSplitModal onClose={() => setBillSplitOpen(false)} />}

      <LendingPageDialogs
        showAdd={showAdd}
        onCloseAdd={closeAdd}
        editing={editing}
        onCloseEdit={closeEdit}
        showRequest={showRequest}
        onCloseRequest={() => setShowRequest(false)}
        detailFor={detailFor}
        onCloseDetail={() => setDetailFor(null)}
        paymentFor={paymentFor}
        onClosePayment={() => setPaymentFor(null)}
        form={form}
        setForm={setForm}
        formErrors={formErrors}
        fieldClass={fieldClass}
        todayStr={todayStr}
        payAmount={payAmount}
        onPayAmountChange={setPayAmount}
        payDate={payDate}
        onPayDateChange={setPayDate}
        onSubmitAdd={submitAdd}
        onSubmitEdit={submitEdit}
        onSubmitPayment={submitPayment}
        onPayRemaining={payRemaining}
      />
    </div>
  );
};

export default Lending;
