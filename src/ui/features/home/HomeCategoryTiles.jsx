import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { useNetWorth } from "../../../context/NetWorthContext.jsx";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { usePrivacyAmount } from "../../../hooks/usePrivacyAmount.js";
import { isActiveBill } from "../../../utils/billLifecycle.js";
import {
  isCoreAssetEntry,
  isInstrumentWealthEntry,
  isInstrumentCommitment,
  sumEntryValues,
} from "../../../utils/ledger/ledgerBuckets.js";

/** 2×2 editorial category columns linking to Ledger / Agreements. */
export default function HomeCategoryTiles() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { entries, core } = useNetWorth();
  const { formatAmount } = usePrivacyAmount();
  const { lendings, sortedCommitments, getEffectiveStatus, todayStr } = usePerovo();

  const { assetCount, instrumentsTotal, instrumentCount, netLent, overdueBillCount } = useMemo(() => {
    const assets = entries.filter(isCoreAssetEntry);
    const instruments = entries.filter(isInstrumentWealthEntry);
    const instrumentCommitments = sortedCommitments.filter(isInstrumentCommitment);
    const wealthInstrumentTotal = sumEntryValues(instruments);
    const commitmentInstrumentTotal = instrumentCommitments.reduce(
      (sum, c) => sum + Number(c.amount ?? 0),
      0,
    );
    const lent = lendings.filter((l) => l.type === "lent");
    const owed = lent.reduce((s, l) => s + (Number(l.remainingAmount ?? l.principalAmount) || 0), 0);
    const borrowed = lendings
      .filter((l) => l.type === "borrowed")
      .reduce((s, l) => s + (Number(l.remainingAmount ?? l.principalAmount) || 0), 0);

    let overdue = 0;
    for (const c of sortedCommitments) {
      if (!isActiveBill(c, getEffectiveStatus, todayStr)) continue;
      if (getEffectiveStatus(c) === "overdue") overdue += 1;
    }

    return {
      assetCount: assets.length,
      instrumentsTotal: wealthInstrumentTotal + commitmentInstrumentTotal,
      instrumentCount: instruments.length + instrumentCommitments.length,
      netLent: Math.max(0, owed - borrowed),
      overdueBillCount: overdue,
    };
  }, [entries, lendings, sortedCommitments, getEffectiveStatus, todayStr]);

  const debtRatio =
    core.totalAssets > 0
      ? `${((core.totalLiabilities / core.totalAssets) * 100).toFixed(1)}%`
      : "—";

  const liabilitySub =
    overdueBillCount > 0
      ? t(overdueBillCount === 1 ? "home.position.overdueBillOne" : "home.position.overdueBillMany", {
          count: overdueBillCount,
        })
      : t("home.position.debtRatio", { ratio: debtRatio });

  const instrumentSub = t(
    instrumentCount === 1 ? "home.position.instrumentCountOne" : "home.position.instrumentCountMany",
    { count: instrumentCount },
  );

  const tiles = [
    {
      cat: "asset",
      label: t("home.position.assets"),
      value: core.totalAssets,
      sub: t("home.position.assetCount", { count: assetCount }),
      to: "/ledger?tab=assets",
    },
    {
      cat: "liability",
      label: t("home.position.liabilities"),
      value: core.totalLiabilities,
      sub: liabilitySub,
      to: "/ledger?tab=liabilities",
    },
    {
      cat: "instrument",
      label: t("home.position.instruments"),
      value: instrumentsTotal,
      sub: instrumentSub,
      to: "/ledger?tab=instruments",
    },
    {
      cat: "agreement",
      label: t("home.position.agreements"),
      value: netLent,
      sub: t("home.position.agreementCount", { count: lendings.length }),
      to: "/agreements",
    },
  ];

  const tickColors = {
    asset: "var(--ed-green)",
    liability: "var(--ed-red)",
    instrument: "var(--ed-violet)",
    agreement: "var(--ed-indigo)",
  };
  const valClasses = {
    asset: "ed-val-asset",
    liability: "ed-val-liab",
    instrument: "ed-val-inst",
    agreement: "ed-val-agr",
  };
  return (
    <div className="ed-columns ed-columns--quiet">
      {tiles.map((item) => {
        const isZero = item.value === 0;
        return (
          <button
            key={item.cat}
            type="button"
            className="ed-col"
            onClick={() => navigate(item.to)}
          >
            <div className="ed-col-label">
              <span className="ed-col-tick" style={{ background: tickColors[item.cat] }} />
              {item.label}
            </div>
            <div className={`ed-col-val ${isZero ? "ed-val-zero" : valClasses[item.cat]}`}>
              {formatAmount(item.value)}
            </div>
            <div className="ed-col-meta">{item.sub}</div>
          </button>
        );
      })}
    </div>
  );
}
