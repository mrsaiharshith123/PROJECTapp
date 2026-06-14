import { useMemo } from "react";
import { addDays, isAfter, isBefore, parseISO } from "date-fns";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { formatInr } from "../../../constants/symbols.js";
import { Card, Heading, Body, Caption } from "../../index.js";

export default function FestivalPlannerCard() {
  const { t } = useTranslation();
  const { commitments, getEffectiveStatus, todayStr } = useCommitTrack();

  const upcomingLumpy = useMemo(() => {
    const today = parseISO(`${todayStr}T12:00:00`);
    const in90Days = addDays(today, 90);

    return (commitments || [])
      .filter((c) => {
        if (getEffectiveStatus(c) === "paid") return false;
        if (!c.dueDate) return false;
        const due = parseISO(`${c.dueDate}T12:00:00`);
        const isInWindow = isAfter(due, today) && isBefore(due, in90Days);
        const isLumpy = c.repeatType === "yearly" || c.repeatType === "none";
        const isLarge = Number(c.amount) >= 5000;
        const isFamilyBill =
          ["School", "Insurance", "Groceries"].includes(c.category) ||
          /wedding|festival|diwali|eid|christmas|puja|annual/i.test(c.name || "");
        return isInWindow && (isLumpy || isFamilyBill) && isLarge;
      })
      .sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || ""));
  }, [commitments, getEffectiveStatus, todayStr]);

  if (!upcomingLumpy.length) return null;

  const total = upcomingLumpy.reduce((s, c) => s + Math.max(0, Number(c.amount) || 0), 0);
  const earliest = upcomingLumpy[0]?.dueDate;

  return (
    <Card variant="flat" className="ct-stack">
      <Heading level={3}>{t("family.festival.heading")}</Heading>
      <div className="ct-stack-sm">
        {upcomingLumpy.slice(0, 6).map((c) => (
          <div key={c.id} className="ct-row-between gap-2">
            <div className="min-w-0">
              <Body className="font-semibold truncate">{c.name}</Body>
              <Caption>
                {c.dueDate} · {c.category}
              </Caption>
            </div>
            <Body className="font-semibold ct-numeral shrink-0">{formatInr(Number(c.amount) || 0)}</Body>
          </div>
        ))}
      </div>
      <Caption className="block font-semibold">
        {t("family.festival.total", { amount: formatInr(total) })}
      </Caption>
      {earliest && (
        <Caption className="block ct-text-muted">
          {t("family.festival.planAside", { amount: formatInr(total), date: earliest })}
        </Caption>
      )}
    </Card>
  );
}
