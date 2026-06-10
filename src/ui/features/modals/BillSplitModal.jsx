import { useMemo, useState } from "react";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import { computeBillSplit, buildLendingRecordsFromSplit } from "../../../engines/billSplit.js";
import { billSplitSharePlainText, openBillSplitShareCard } from "../../../utils/billSplitShareCard.js";
import { shareOrCopyPlainText } from "../../../utils/shareText.js";
import { Modal, Stack, Button, Input, Caption } from "../../index.js";
import { canRunBillSplit, billSplitUsagePatch } from "../../../utils/tierAccess.js";
import { TierLimitBanner } from "../../patterns/TierLimitBanner.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.js";

export default function BillSplitModal({ onClose }) {
  const { t } = useTranslation();
  const { addLending, settings, updateSettings, todayStr } = useCommitTrack();
  const [total, setTotal] = useState("");
  const [source, setSource] = useState("Restaurant bill");
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
      payerName: settings.displayName || "You",
      sourceLabel: source,
      note: source,
      },
    );
    for (const r of records) addLending(r);
    updateSettings(billSplitUsagePatch(settings, todayStr));
    onClose();
  };

  const share = async () => {
    await shareOrCopyPlainText(billSplitSharePlainText(split, settings.displayName || "You"));
    openBillSplitShareCard(split, settings.displayName || "You");
  };

  return (
    <Modal title={t("tier.split.title")} onClose={onClose}>
      <Stack>
        <Caption>{t("tier.split.intro")}</Caption>
        {!splitGate.ok && (
          <TierLimitBanner
            compact
            title={t("tier.limit.splitTitle")}
            message={
              splitGate.reason === "split_people_limit"
                ? t("tier.limit.splitPeopleMessage", { limit: splitGate.limit })
                : t("tier.limit.splitMessage", { limit: splitGate.limit })
            }
          />
        )}
        <Input value={total} onChange={(e) => setTotal(e.target.value.replace(/[^\d.]/g, ""))} placeholder="Total amount" inputMode="numeric" />
        <Input value={source} onChange={(e) => setSource(e.target.value)} placeholder="What was it for?" />
        {names.map((n, i) => (
          <Input key={i} value={n} onChange={(e) => updateName(i, e.target.value)} placeholder={`Person ${i + 1}`} />
        ))}
        <Button type="button" variant="ghost" onClick={addPerson}>
          + Add person
        </Button>
        {split.participants.length > 0 && (
          <div className="ct-inset ct-stack-sm">
            {split.participants.map((p) => (
              <Caption key={p.name} className="block">
                {p.name}: ₹{p.amount.toLocaleString("en-IN")}
              </Caption>
            ))}
          </div>
        )}
        <div className="ct-row gap-2 flex-wrap">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" variant="outline" disabled={!split.participants.length} onClick={share}>
            Share card
          </Button>
          <Button type="button" disabled={!split.participants.length || !splitGate.ok} onClick={createLendings}>
            Create lending entries
          </Button>
        </div>
      </Stack>
    </Modal>
  );
}
