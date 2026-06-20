import { useMemo } from "react";
import { addDays, isAfter, isBefore, parseISO } from "date-fns";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { translateCategory } from "../../../i18n/domainLabels.js";
import { formatInr } from "../../../constants/symbols.js";
import { Body, Caption } from "../../index.js";
import { CtIcon } from "../../icons/CtIcon.jsx";

export default function FestivalPlannerCard() {
  const { t } = useTranslation();
  const { commitments, getEffectiveStatus, todayStr } = usePerovo();

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
    <section className="ct-hero-card festival ct-stack">
      <div className="ct-hero-glow amber" aria-hidden />
      <div className="ct-row-between gap-2 relative">
        <div className="ct-row gap-3 min-w-0">
          <span className="ct-icon-tile amber" aria-hidden>
            <CtIcon name="palette" size={22} />
          </span>
          <div className="min-w-0">
            <p className="ct-hero-label">{t("family.festival.heading")}</p>
            <p className="ct-hero-number ct-numeral">{formatInr(total)}</p>
          </div>
        </div>
        <Caption className="shrink-0 ct-text-muted">{t("family.festival.count", { count: upcomingLumpy.length })}</Caption>
      </div>

      <div className="ct-stack-sm relative">
        {upcomingLumpy.slice(0, 6).map((c) => (
          <div key={c.id} className="ct-row-between gap-2">
            <div className="min-w-0">
              <Body className="font-semibold truncate">{c.name}</Body>
              <Caption>
                {c.dueDate} · {translateCategory(t, c.category)}
              </Caption>
            </div>
            <Body className="font-semibold ct-numeral shrink-0">{formatInr(Number(c.amount) || 0)}</Body>
          </div>
        ))}
      </div>

      {earliest ? (
        <Caption className="block relative ct-text-muted">
          {t("family.festival.planAside", { amount: formatInr(total), date: earliest })}
        </Caption>
      ) : null}
    </section>
  );
}
