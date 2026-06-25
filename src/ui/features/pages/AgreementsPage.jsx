import { useCallback, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { Button, EmptyState, fieldInputClass, inputClassName, PageShell } from "../../index.js";
import { buildLendingRecord } from "../../../utils/lendingRecord.js";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { todayYmd } from "../../../utils/dates.js";
import LendingPageDialogs from "../lending/LendingPageDialogs.jsx";
import { useLendingLists } from "../lending/useLendingLists.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { canAddLendingRecord } from "../../../utils/tierAccess.js";
import { TierLimitBanner } from "../../patterns/TierLimitBanner.jsx";
import LendingOverduePanel from "../lending/LendingOverduePanel.jsx";
import AgreementCard from "../agreements/AgreementCard.jsx";
import AgreementDocumentsList from "../agreements/AgreementDocumentsList.jsx";
import AgreementsHeroSummary from "../agreements/AgreementsHeroSummary.jsx";
import AgreementsHeaderActions from "../agreements/AgreementsHeaderActions.jsx";

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

/** Top-level Agreements tab — informal lending + legal documents. @route /agreements */
export default function AgreementsPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const { lendings, settings, todayStr, addLending, updateLending, addLendingPayment } =
    usePerovo();

  const [listTab, setListTab] = useState(/** @type {"lent" | "borrowed" | "documents"} */ ("lent"));
  const [showAdd, setShowAdd] = useState(() => Boolean(location.state?.openAdd));
  const [editing, setEditing] = useState(null);
  const [paymentFor, setPaymentFor] = useState(null);
  const [form, setForm] = useState(emptyLendingForm);
  const [payAmount, setPayAmount] = useState("");
  const [payDate, setPayDate] = useState(() => todayYmd());
  const [formErrors, setFormErrors] = useState({});
  const [detailFor, setDetailFor] = useState(null);
  const [showRequest, setShowRequest] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { borrowedList, lentList, totals, trustScore, trustByEntryId } = useLendingLists(lendings, searchQuery);

  const owed = Math.max(0, Number(totals?.lentOutstanding) || 0);
  const owe = Math.max(0, Number(totals?.borrowedOutstanding) || 0);
  const isEmpty = lendings.length === 0 && owed === 0 && owe === 0;

  const resetForm = () => {
    setForm(emptyLendingForm());
    setFormErrors({});
  };

  const openAdd = useCallback(() => {
    setForm(emptyLendingForm());
    setFormErrors({});
    setShowAdd(true);
  }, []);

  const openRequest = useCallback(() => setShowRequest(true), []);

  const detailLending = useMemo(
    () => (detailFor ? lendings.find((l) => l.id === detailFor.id) || detailFor : null),
    [detailFor, lendings],
  );

  const anyDialogOpen = Boolean(showAdd || editing || showRequest || detailLending || paymentFor);

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

  const fieldClass = (field) => `${fieldInputClass(Boolean(formErrors[field]))} ct-input-tint`;

  const closeAdd = () => {
    setShowAdd(false);
    resetForm();
  };

  const closeEdit = () => {
    setEditing(null);
    resetForm();
  };

  const overflowItems = useMemo(
    () => (listTab === "lent" ? lentList : borrowedList),
    [listTab, lentList, borrowedList],
  );

  return (
    <PageShell
      title={t("nav.agreements")}
      action={<AgreementsHeaderActions lendings={lendings} onAdd={openAdd} onRequestMoney={openRequest} />}
      className="ct-agreements-page"
    >
      {!canAddLendingRecord(settings, lendings).ok && (
        <TierLimitBanner
          className="ct-tier-banner-warm"
          title={t("tier.limit.lendingTitle")}
          message={t("tier.limit.lendingMessage", { limit: 5 })}
        />
      )}

      {isEmpty ? (
        <div className="ct-lending-empty-warm">
          <div className="ct-lending-empty-icon" aria-hidden>
            🤝
          </div>
          <p className="ct-lending-empty-title">{t("lending.emptyWarmTitle")}</p>
          <p className="ct-lending-empty-body">{t("lending.emptyWarmBody")}</p>
          <Button type="button" className="mt-3" onClick={openAdd}>
            {t("agreements.recordCta")}
          </Button>
        </div>
      ) : (
        <AgreementsHeroSummary
          totals={totals}
          trustScore={trustScore}
          dealCount={lendings.length}
          onViewDocuments={() => setListTab("documents")}
        />
      )}

      {!isEmpty && (
        <>
          <div className="pos-ledger-pill-switcher mb-2">
            {[
              { id: "lent", label: t("agreements.tab.lent") },
              { id: "borrowed", label: t("agreements.tab.borrowed") },
              { id: "documents", label: t("agreements.tab.documents") },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`pos-ledger-pill ${listTab === tab.id ? "active agreement" : ""}`}
                onClick={() => setListTab(/** @type {typeof listTab} */ (tab.id))}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {listTab === "documents" ? (
            <AgreementDocumentsList />
          ) : (
            <>
              <input
                className={inputClassName()}
                placeholder={t("bills.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />

              <LendingOverduePanel />

              {overflowItems.length > 0 && (
                <section className="ct-stack-sm ct-list-animate">
                  {overflowItems.map((item) => (
                    <AgreementCard
                      key={item.id}
                      item={item}
                      todayStr={todayStr}
                      trustScore={trustByEntryId.get(item.id) ?? 50}
                      onMakeLegal={setDetailFor}
                      onRepayment={openPayment}
                    />
                  ))}
                </section>
              )}

              {overflowItems.length === 0 && (borrowedList.length > 0 || lentList.length > 0) && (
                <EmptyState icon="handshake" title={t("bills.noMatchFilters")} hint={t("lending.empty")} />
              )}
            </>
          )}
        </>
      )}

      {anyDialogOpen ? (
        <LendingPageDialogs
          showAdd={showAdd}
          onCloseAdd={closeAdd}
          editing={editing}
          onCloseEdit={closeEdit}
          showRequest={showRequest}
          onCloseRequest={() => setShowRequest(false)}
          detailFor={detailLending}
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
      ) : null}
    </PageShell>
  );
}
