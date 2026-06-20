import { useState } from "react";
import { Button, Caption, Body, Heading, Stack } from "../../index.js";
import { CtIcon } from "../../icons/CtIcon.jsx";
import { ToolAnswerHero } from "../../patterns/ToolAnswerHero.jsx";
import { formatInr } from "../../../constants/symbols.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import {
  BBPS_CATEGORIES,
  fetchBillDetails,
  isBbpsConfigured,
  payBill,
} from "../../../services/bbps/setuBbps.js";

export default function PayBillsTool() {
  const { t } = useTranslation();
  const [category, setCategory] = useState(null);
  const [consumerNumber, setConsumerNumber] = useState("");
  const [billerId, setBillerId] = useState("");
  const [bill, setBill] = useState(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  if (!isBbpsConfigured()) {
    return (
      <Stack>
        <ToolAnswerHero
          tone="pressure"
          label={t("tools.payBills.heroLabel")}
          value={formatInr(0)}
          subtitle={t("tools.payBills.comingSoonHint")}
        />
        <Heading level={3}>{t("tools.payBills.title")}</Heading>
        <Body>{t("tools.payBills.comingSoon")}</Body>
      </Stack>
    );
  }

  const loadBill = async () => {
    if (!consumerNumber.trim() || !billerId.trim()) return;
    setBusy(true);
    setStatus("");
    const details = await fetchBillDetails({ billerId: billerId.trim(), consumerNumber: consumerNumber.trim() });
    setBusy(false);
    if (details.error) {
      setStatus(details.error);
      setBill(null);
      return;
    }
    setBill(details);
  };

  const startPay = async () => {
    if (!bill?.amount) return;
    setBusy(true);
    const result = await payBill({
      billerId: billerId.trim(),
      consumerNumber: consumerNumber.trim(),
      amount: Number(bill.amount),
    });
    setBusy(false);
    if (result.paymentUrl) {
      window.open(result.paymentUrl, "_blank", "noopener,noreferrer");
      setStatus(result.status || "initiated");
      return;
    }
    setStatus(result.error || "payment_failed");
  };

  const heroAmount = bill?.amount ? Number(bill.amount) : 0;
  const heroSubtitle = bill
    ? bill.billerName
    : t("tools.payBills.heroSubtitle", { count: BBPS_CATEGORIES.length });

  return (
    <Stack>
      <ToolAnswerHero
        tone="pressure"
        label={t("tools.payBills.heroLabel")}
        value={formatInr(heroAmount)}
        subtitle={heroSubtitle}
      />
      <Heading level={3}>{t("tools.payBills.title")}</Heading>
      {!category ? (
        <div className="ct-tool-grid">
          {BBPS_CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              className="ct-stat-tile ct-tool-tile !p-3 text-center"
              onClick={() => setCategory(c.id)}
            >
              <span className="ct-icon-tile indigo mx-auto mb-2 inline-flex" aria-hidden>
                <CtIcon name={c.icon} size={20} />
              </span>
              <span className="text-xs font-semibold">{t(c.labelKey)}</span>
            </button>
          ))}
        </div>
      ) : (
        <Stack gap="sm">
          <Caption>{t(BBPS_CATEGORIES.find((c) => c.id === category)?.labelKey || "tools.payBills.title")}</Caption>
          <label className="ct-field-label">{t("tools.payBills.consumerNumber")}</label>
          <input
            className="ct-input w-full"
            value={consumerNumber}
            onChange={(e) => setConsumerNumber(e.target.value)}
          />
          <label className="ct-field-label">{t("tools.payBills.billerId")}</label>
          <input className="ct-input w-full" value={billerId} onChange={(e) => setBillerId(e.target.value)} />
          <div className="ct-row gap-2">
            <Button type="button" variant="outline" onClick={() => setCategory(null)}>
              {t("common.back")}
            </Button>
            <Button type="button" variant="primary" disabled={busy} onClick={loadBill}>
              {t("tools.payBills.fetch")}
            </Button>
          </div>
          {bill ? (
            <div className="ct-inset ct-stack-sm">
              {bill.dueDate ? <Caption>{bill.dueDate}</Caption> : null}
              <Button type="button" variant="success" disabled={busy} onClick={startPay}>
                {t("tools.payBills.payNow")}
              </Button>
            </div>
          ) : null}
          {status ? <Caption className="block">{status}</Caption> : null}
        </Stack>
      )}
    </Stack>
  );
}
