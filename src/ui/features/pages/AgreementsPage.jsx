import { useCallback, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { EmptyState, fieldInputClass } from "../../index.js";
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
import LendingAcceptCodeModal from "../lending/LendingAcceptCodeModal.jsx";
import { getTier } from "../../../utils/tierAccess.js";
import HomeEditorialAvatar from "../home/HomeEditorialAvatar.jsx";
import { CtIcon } from "../../icons/CtIcon.jsx";

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
  const { lendings, settings, todayStr, updateLending, addLendingPayment, effectiveSubscriptionTier } =
    usePerovo();

  const [listTab, setListTab] = useState(/** @type {"lent" | "borrowed" | "documents"} */ ("lent"));
  const [editing, setEditing] = useState(null);
  const [paymentFor, setPaymentFor] = useState(null);
  const [form, setForm] = useState(emptyLendingForm);
  const [payAmount, setPayAmount] = useState("");
  const [payDate, setPayDate] = useState(() => todayYmd());
  const [formErrors, setFormErrors] = useState({});
  const [detailFor, setDetailFor] = useState(null);
  const [showRequest, setShowRequest] = useState(
    () => Boolean(location.state?.openRequest || location.state?.openAdd),
  );
  const [showAcceptCode, setShowAcceptCode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { borrowedList, lentList, totals, trustScore, trustByEntryId } = useLendingLists(lendings, searchQuery);

  const owed = Math.max(0, Number(totals?.lentOutstanding) || 0);
  const owe = Math.max(0, Number(totals?.borrowedOutstanding) || 0);
  const isEmpty = lendings.length === 0 && owed === 0 && owe === 0;

  const resetForm = () => {
    setForm(emptyLendingForm());
    setFormErrors({});
  };

  const openRequest = useCallback(() => setShowRequest(true), []);
  const openEnterCode = useCallback(() => setShowAcceptCode(true), []);

  const detailLending = useMemo(
    () => (detailFor ? lendings.find((l) => l.id === detailFor.id) || detailFor : null),
    [detailFor, lendings],
  );

  const anyDialogOpen = Boolean(editing || showRequest || showAcceptCode || detailLending || paymentFor);

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

  const closeEdit = () => {
    setEditing(null);
    resetForm();
  };

  const overflowItems = useMemo(
    () => (listTab === "lent" ? lentList : borrowedList),
    [listTab, lentList, borrowedList],
  );

  const tier = getTier(settings, effectiveSubscriptionTier);

  return (
    <div className="ed-paper">
      <header className="ed-masthead">
        <div className="ed-masthead-top">
          <div className="ed-masthead-brand">
            <h1 className="ed-title">{t("nav.agreements")}</h1>
            <div className="ed-tagline">{t("agreements.ed.tagline")}</div>
          </div>
          <div className="ed-masthead-right">
            <HomeEditorialAvatar tier={tier} />
          </div>
        </div>
      </header>

      {!canAddLendingRecord(settings, lendings, effectiveSubscriptionTier).ok && (
        <TierLimitBanner
          className="ct-tier-banner-warm"
          title={t("tier.limit.lendingTitle")}
          message={t("tier.limit.lendingMessage", { limit: 5 })}
        />
      )}

      <AgreementsHeaderActions
        lendings={lendings}
        onRequestMoney={openRequest}
        onEnterCode={openEnterCode}
      />

      {isEmpty ? (
        <div className="ed-ins-story" style={{ textAlign: "center", padding: "24px 18px" }}>
          <div className="ed-agreements-empty-icon">
            <CtIcon name="handshake" size={24} />
          </div>
          <div className="ed-agreements-empty-title">{t("lending.emptyWarmTitle")}</div>
          <div className="ed-agreements-empty-body">{t("lending.emptyWarmBody")}</div>
          <button type="button" className="ed-ins-link" style={{ padding: "0 0 4px" }} onClick={openRequest}>
            {t("lending.requestMoney")} →
          </button>
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
          <div className="ed-insight-pills" style={{ padding: "12px 18px 4px" }}>
            {[
              { id: "lent", label: t("agreements.tab.lent") },
              { id: "borrowed", label: t("agreements.tab.borrowed") },
              { id: "documents", label: t("agreements.tab.documents") },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`ed-insight-pill ${listTab === tab.id ? "active" : "inactive"}`}
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
                className="ed-agreements-search"
                placeholder={t("bills.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />

              <LendingOverduePanel />

              {overflowItems.length > 0 && (
                <section className="ct-stack-sm ct-list-animate" style={{ padding: "0 18px" }}>
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
          showAdd={false}
          onCloseAdd={() => {}}
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
          onSubmitAdd={() => {}}
          onSubmitEdit={submitEdit}
          onSubmitPayment={submitPayment}
          onPayRemaining={payRemaining}
        />
      ) : null}
      {showAcceptCode ? <LendingAcceptCodeModal onClose={() => setShowAcceptCode(false)} /> : null}
    </div>
  );
}
