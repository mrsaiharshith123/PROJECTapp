import { useState } from "react";
import { Card, PageHeader, Caption, Button, StatCard, fieldInputClass } from "../../";
import { formatInr } from "../../../constants/symbols.js";
import { buildLendingRecord } from "../../../utils/lendingRecord.js";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import { todayYmd } from "../../../utils/dates.js";
import { trustSummaryLine } from "../../../engines/lendingTrust.js";
import LendingEntryCard from "../lending/LendingEntryCard.jsx";
import LendingPageDialogs from "../lending/LendingPageDialogs.jsx";
import { useLendingLists } from "../lending/useLendingLists.js";
import { canEditLending } from "../../../engines/lendingAgreement.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import BillSplitModal from "../modals/BillSplitModal.jsx";
import { canAddLendingRecord } from "../../../utils/tierAccess.js";
import { TierLimitBanner } from "../../patterns/TierLimitBanner.jsx";
import LendingProfileCard from "../lending/LendingProfileCard.jsx";

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
    useCommitTrack();
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

  const { borrowedList, lentList, trustRows, totals, trustScore } = useLendingLists(lendings);

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

  return (
    <div className="ct-page">
      <PageHeader
        eyebrow={t("lending.eyebrow")}
        title={t("lending.title")}
        subtitle={
          <Caption className="mt-1 max-w-xs block">
            {t("lending.subtitle")}
          </Caption>
        }
        actions={
          <div className="flex flex-col gap-2">
            <Button type="button" size="sm" onClick={() => setShowRequest(true)}>
              {t("lending.requestMoney")}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setBillSplitOpen(true)}>
              Split bill
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                resetForm();
                setShowAdd(true);
              }}
            >
              {t("lending.addShort")}
            </Button>
          </div>
        }
      />

      {!canAddLendingRecord(settings, lendings).ok && (
        <TierLimitBanner
          title={t("tier.limit.lendingTitle")}
          message={t("tier.limit.lendingMessage", { limit: 5 })}
        />
      )}

      <LendingProfileCard totals={totals} trustScore={trustScore} dealCount={lendings.length} />

      <div className="grid grid-cols-2 gap-3">
        <StatCard value={formatInr(totals.recovered)} label={t("lending.stat.recovered")} valueClassName="text-emerald-300" />
        <StatCard value={formatInr(totals.repaid)} label={t("lending.stat.repaid")} />
      </div>

      {borrowedList.length === 0 && lentList.length === 0 && (
        <Card className="text-center py-10 text-sm text-gray-500">
          {t("lending.empty")}
        </Card>
      )}

      {borrowedList.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-violet-800 uppercase tracking-wide">{t("lending.sectionOwe")}</h2>
          {borrowedList.map((item) => (
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

      {lentList.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-indigo-800 uppercase tracking-wide">{t("lending.sectionLent")}</h2>
          {lentList.map((item) => (
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

      {trustRows.length > 0 && (
        <Card className="space-y-2">
          <h2 className="text-base font-semibold text-gray-800">{t("lending.trustTitle")}</h2>
          <p className="text-xs text-gray-500">{t("lending.trustHint")}</p>
          {trustRows.slice(0, 8).map((row) => (
            <p key={row.personKey} className="text-xs text-gray-700 border-b border-gray-50 last:border-0 pb-2 last:pb-0">
              {trustSummaryLine(row)}
            </p>
          ))}
        </Card>
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
