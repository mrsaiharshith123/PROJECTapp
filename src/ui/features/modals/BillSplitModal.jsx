import { useMemo, useState } from "react";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { computeBillSplit, buildLendingRecordsFromSplit } from "../../../engines/billSplit.js";
import { billSplitSharePlainText, openBillSplitShareCard } from "../../../utils/billSplitShareCard.js";
import { shareOrCopyPlainText } from "../../../utils/shareText.js";
import { Modal, Stack, Button, Input, Caption } from "../../index.js";
import { canRunBillSplit, billSplitUsagePatch } from "../../../utils/tierAccess.js";
import { TierLimitBanner } from "../../patterns/TierLimitBanner.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { formatInr } from "../../../constants/symbols.js";
import { CtIcon } from "../../icons/CtIcon.jsx";
import { inputClassName } from "../../primitives/Input.jsx";

const fieldClass = `${inputClassName()} ct-input-tint`;

export default function BillSplitModal({ onClose }) {
  const { t } = useTranslation();
  const { addLending, settings, updateSettings, todayStr } = usePerovo();
  const [total, setTotal] = useState("");
  const [source, setSource] = useState("");
  const [names, setNames] = useState(["", "", ""]);

  const participants = useMemo(
    () =>
      names
        .map((n) => ({ name: n.trim(), weight: 1 }))
        .filter((p) => p.name),
    [names],
  );

  const split = useMemo(() => computeBillSplit(Number(total) || 0, participants), [total, participants]);

  const splitGate = canRunBillSplit(settings, todayStr, participants.length);

  const addPerson = () => setNames((prev) => [...prev, ""]);
  const updateName = (i, v) => setNames((prev) => prev.map((x, j) => (j === i ? v : x)));

  const createLendings = () => {
    if (!splitGate.ok) return;
    const records = buildLendingRecordsFromSplit(
      { totalAmount: split.total, participants: split.participants },
      {
        payerName: settings.displayName || t("household.room.you"),
        sourceLabel: source,
        note: source,
      },
    );
    for (const r of records) addLending(r);
    updateSettings(billSplitUsagePatch(settings, todayStr));
    onClose();
  };

  const share = async () => {
    await shareOrCopyPlainText(billSplitSharePlainText(split, settings.displayName || t("household.room.you")));
    openBillSplitShareCard(split, settings.displayName || t("household.room.you"));
  };

  return (
    <Modal title={t("tier.split.title")} onClose={onClose}>
      <Stack>
        <div className="ct-row gap-3 items-start">
          <span className="ct-icon-tile primary" aria-hidden>
            <CtIcon name="receipt" size={22} />
          </span>
          <Caption>{t("tier.split.intro")}</Caption>
        </div>

        {!splitGate.ok ? (
          <TierLimitBanner
            compact
            title={t("tier.limit.splitTitle")}
            message={
              splitGate.reason === "split_people_limit"
                ? t("tier.limit.splitPeopleMessage", { limit: splitGate.limit })
                : t("tier.limit.splitMessage", { limit: splitGate.limit })
            }
          />
        ) : null}

        {Number(total) > 0 ? (
          <div className="ct-hero-card lending">
            <div className="ct-hero-glow" aria-hidden />
            <p className="ct-hero-label relative">{t("tier.split.title")}</p>
            <p className="ct-hero-number ct-numeral relative">{formatInr(Number(total) || 0)}</p>
          </div>
        ) : null}

        <Input
          className={`${fieldClass} ct-numeral`}
          value={total}
          onChange={(e) => setTotal(e.target.value.replace(/[^\d.]/g, ""))}
          placeholder={t("tier.split.totalPlaceholder")}
          inputMode="numeric"
        />
        <Input
          className={fieldClass}
          value={source}
          onChange={(e) => setSource(e.target.value)}
          placeholder={t("tier.split.sourcePlaceholder")}
        />
        {names.map((n, i) => (
          <Input
            key={i}
            className={fieldClass}
            value={n}
            onChange={(e) => updateName(i, e.target.value)}
            placeholder={t("tier.split.personPlaceholder", { n: i + 1 })}
          />
        ))}
        <Button type="button" variant="ghost" onClick={addPerson}>
          {t("tier.split.addPerson")}
        </Button>

        {split.participants.length > 0 ? (
          <div className="ct-inset ct-stack-sm">
            {split.participants.map((p) => (
              <Caption key={p.name} className="block">
                {t("tier.split.line", { name: p.name, amount: formatInr(p.amount) })}
              </Caption>
            ))}
          </div>
        ) : null}

        <div className="ct-row gap-2 flex-wrap">
          <Button type="button" variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button type="button" variant="outline" disabled={!split.participants.length} onClick={share}>
            {t("tier.split.shareCard")}
          </Button>
          <Button type="button" disabled={!split.participants.length || !splitGate.ok} onClick={createLendings}>
            {t("tier.split.createLendings")}
          </Button>
        </div>
      </Stack>
    </Modal>
  );
}
