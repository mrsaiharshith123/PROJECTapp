import { useMemo, useState } from "react";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import { computeBillSplit, buildLendingRecordsFromSplit } from "../../../engines/billSplit.js";
import { billSplitSharePlainText, openBillSplitShareCard } from "../../../utils/billSplitShareCard.js";
import { shareOrCopyPlainText } from "../../../utils/shareText.js";
import { Modal, Stack, Button, Input, Caption } from "../../index.js";

export default function BillSplitModal({ onClose }) {
  const { addLending, settings } = useCommitTrack();
  const [total, setTotal] = useState("");
  const [source, setSource] = useState("Restaurant bill");
  const [names, setNames] = useState(["", "", ""]);

  const split = useMemo(() => {
    const participants = names
      .map((n) => ({ name: n.trim(), weight: 1 }))
      .filter((p) => p.name);
    return computeBillSplit(Number(total) || 0, participants);
  }, [total, names]);

  const addPerson = () => setNames((prev) => [...prev, ""]);
  const updateName = (i, v) => setNames((prev) => prev.map((x, j) => (j === i ? v : x)));

  const createLendings = () => {
    const records = buildLendingRecordsFromSplit(
      { totalAmount: split.total, participants: split.participants },
      {
      payerName: settings.displayName || "You",
      sourceLabel: source,
      note: source,
      },
    );
    for (const r of records) addLending(r);
    onClose();
  };

  const share = async () => {
    await shareOrCopyPlainText(billSplitSharePlainText(split, settings.displayName || "You"));
    openBillSplitShareCard(split, settings.displayName || "You");
  };

  return (
    <Modal title="Split a bill" onClose={onClose}>
      <Stack>
        <Caption>Total bill → equal shares → lending records + WhatsApp-ready card per person.</Caption>
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
          <Button type="button" disabled={!split.participants.length} onClick={createLendings}>
            Create lending entries
          </Button>
        </div>
      </Stack>
    </Modal>
  );
}
