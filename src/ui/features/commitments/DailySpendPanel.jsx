import { useMemo, useState } from "react";
import { format, subDays, parseISO } from "date-fns";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { sumDailySpendsInRange } from "../../../utils/dailySpends.js";
import { getTransactionLifeCategoryMeta, TRANSACTION_LIFE_CATEGORIES } from "../../../constants/transactionCategories.js";
import { formatInr } from "../../../constants/symbols.js";
import {
  Card,
  Stack,
  Button,
  Caption,
  Body,
  EmptyState,
  FilterChips,
  FilterChipsWithSearch,
  StatCard,
  Badge,
} from "../../index.js";
import { CtIcon } from "../../icons/CtIcon.jsx";
import { detectRecurringFromDailySpends } from "../../../engines/recurringSpendDetect.js";

const LIFE_ICONS = {
  survival: "shield",
  lifestyle: "fork-knife",
  growth: "chart-line-up",
  pressure: "hourglass",
  risk: "warning",
};

function formatSpendDate(dateStr) {
  if (!dateStr) return "—";
  try {
    return format(parseISO(`${dateStr}T12:00:00`), "d MMM yyyy");
  } catch {
    return dateStr;
  }
}

/** Variable spend logs — totals, period filter, history. Charts live on Analytics. */
export default function DailySpendPanel() {
  const { dailySpends, deleteDailySpend, todayStr, addCommitment } = useCommitTrack();
  const { t } = useTranslation();
  const [period, setPeriod] = useState("30d");
  const [lifeFilter, setLifeFilter] = useState("");
  const [search, setSearch] = useState("");

  const range = useMemo(() => {
    const end = todayStr;
    if (period === "7d") {
      return { start: format(subDays(parseISO(`${todayStr}T12:00:00`), 6), "yyyy-MM-dd"), end };
    }
    if (period === "30d") {
      return { start: format(subDays(parseISO(`${todayStr}T12:00:00`), 29), "yyyy-MM-dd"), end };
    }
    const dates = (dailySpends || []).map((s) => s.date).filter(Boolean);
    if (!dates.length) return { start: todayStr, end };
    dates.sort();
    return { start: dates[0], end: dates[dates.length - 1] };
  }, [period, todayStr, dailySpends]);

  const periodSpends = useMemo(
    () =>
      (dailySpends || []).filter((s) => s.date && s.date >= range.start && s.date <= range.end),
    [dailySpends, range],
  );

  const total = useMemo(
    () => sumDailySpendsInRange(dailySpends, range.start, range.end),
    [dailySpends, range],
  );

  const listSpends = useMemo(() => {
    let rows = [...periodSpends];
    if (lifeFilter) rows = rows.filter((s) => s.lifeCategory === lifeFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter((s) => {
        const label = String(s.label || "").toLowerCase();
        const merchant = String(s.merchantId || "").toLowerCase();
        return label.includes(q) || merchant.includes(q);
      });
    }
    return rows.sort((a, b) => {
      const d = (b.date || "").localeCompare(a.date || "");
      if (d !== 0) return d;
      return (b.createdAt || 0) - (a.createdAt || 0);
    });
  }, [periodSpends, lifeFilter, search]);

  const periodOptions = [
    { id: "7d", label: t("bills.dailySpend.period7d") },
    { id: "30d", label: t("bills.dailySpend.period30d") },
    { id: "all", label: t("bills.dailySpend.periodAll") },
  ];

  const lifeFilterOptions = [
    { id: "", label: t("bills.dailySpend.allCategories") },
    ...TRANSACTION_LIFE_CATEGORIES.map((c) => ({ id: c.id, label: c.label })),
  ];

  const monthKey = todayStr?.slice(0, 7) || "";

  const recurringSuggestions = useMemo(
    () => detectRecurringFromDailySpends(dailySpends, { monthKey, minOccurrences: 3 }),
    [dailySpends, monthKey],
  );

  return (
    <div className="ct-stack">
      {recurringSuggestions.length > 0 && (
        <Card className="ct-stack-sm">
          <Body className="font-semibold">{t("recurring.suggestTitle")}</Body>
          <Caption className="block">{t("recurring.suggestSubtitle")}</Caption>
          <ul className="ct-stack-sm">
            {recurringSuggestions.slice(0, 4).map((s) => (
              <li key={s.name} className="ct-row-between gap-2 flex-wrap">
                <Caption>
                  {t("insight.recurring-spend-suggest", {
                    name: s.params.name,
                    count: s.params.count,
                    amount: formatInr(s.params.amount),
                  })}
                </Caption>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    addCommitment({
                      name: s.name,
                      amount: s.suggestedAmount,
                      category: s.category,
                      repeatType: "monthly",
                      dueDate: s.lastDate,
                    })
                  }
                >
                  {t("recurring.convertToBill")}
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      )}
      <div>
        <Body className="ct-body-strong">{t("bills.variableSpend.title")}</Body>
        <Caption className="block mt-0.5">{t("bills.variableSpend.subtitle")}</Caption>
        <Caption className="block mt-1 opacity-80">{t("bills.variableSpend.analyticsHint")}</Caption>
      </div>

      <div className="ct-grid-2">
        <StatCard value={formatInr(total)} label={t("bills.dailySpend.total")} />
        <StatCard
          value={String(periodSpends.length)}
          label={t("bills.dailySpend.entries")}
          valueClassName="text-[var(--ct-accent-muted)]"
        />
      </div>

      <FilterChips options={periodOptions} value={period} onChange={setPeriod} />

      <div>
        <Body className="ct-body-strong mb-2">{t("bills.dailySpend.history")}</Body>
        <FilterChipsWithSearch
          options={lifeFilterOptions}
          value={lifeFilter}
          onChange={setLifeFilter}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder={t("bills.dailySpend.searchPlaceholder")}
        />
      </div>

      {listSpends.length === 0 ? (
        <EmptyState
          icon="receipt"
          title={t("bills.dailySpend.empty")}
          hint={t("bills.dailySpend.emptyHint")}
        />
      ) : (
        <Stack gap="sm" className="ct-list-animate">
          {listSpends.map((spend) => {
            const life = getTransactionLifeCategoryMeta(spend.lifeCategory);
            const icon = LIFE_ICONS[spend.lifeCategory] || "receipt";
            return (
              <Card key={spend.id} variant="flat" className="ct-daily-spend-row">
                <div className="ct-row-between gap-3">
                  <div className="ct-row min-w-0 flex-1">
                    <span className="ct-icon-box shrink-0">
                      <CtIcon name={icon} size={20} context="category" />
                    </span>
                    <div className="min-w-0">
                      <Body className="font-semibold truncate block">{spend.label}</Body>
                      <Caption className="block">
                        {formatSpendDate(spend.date)}
                        {spend.source === "sms" ? ` · ${t("bills.dailySpend.fromSms")}` : ""}
                      </Caption>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <Body className="ct-numeral font-bold block">{formatInr(spend.amount)}</Body>
                    <Badge tone="neutral" className="mt-1">
                      {life.label}
                    </Badge>
                  </div>
                </div>
                <div className="ct-row-between mt-2 pt-2 border-t border-white/5">
                  <Caption className="truncate">
                    {spend.merchantId && spend.merchantId !== spend.label.toLowerCase()
                      ? spend.merchantId.replace(/_/g, " ")
                      : t("bills.dailySpend.manualEntry")}
                  </Caption>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="!w-auto !py-1 !px-2 text-[var(--ct-danger)]"
                    onClick={() => deleteDailySpend(spend.id)}
                  >
                    {t("bills.dailySpend.delete")}
                  </Button>
                </div>
              </Card>
            );
          })}
        </Stack>
      )}
    </div>
  );
}
