import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { useNetWorth } from "../../../context/NetWorthContext.jsx";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { formatInr } from "../../../constants/symbols.js";
import {
  isCoreAssetEntry,
  isInstrumentWealthEntry,
  isInstrumentCommitment,
  sumEntryValues,
} from "../../../utils/ledger/ledgerBuckets.js";

/** 2×2 category tiles linking to Ledger / Agreements. */
export default function HomeCategoryTiles() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { entries, core } = useNetWorth();
  const { lendings, sortedCommitments } = usePerovo();

  const { assetCount, instrumentsTotal, instrumentCount, netLent } = useMemo(() => {
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
    return {
      assetCount: assets.length,
      instrumentsTotal: wealthInstrumentTotal + commitmentInstrumentTotal,
      instrumentCount: instruments.length + instrumentCommitments.length,
      netLent: Math.max(0, owed - borrowed),
    };
  }, [entries, lendings, sortedCommitments]);

  const debtRatio =
    core.totalAssets > 0
      ? `${((core.totalLiabilities / core.totalAssets) * 100).toFixed(1)}%`
      : "—";

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
      sub: t("home.position.debtRatio", { ratio: debtRatio }),
      to: "/ledger?tab=liabilities",
    },
    {
      cat: "instrument",
      label: t("home.position.instruments"),
      value: instrumentsTotal,
      sub: t("home.position.instrumentCount", { count: instrumentCount }),
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

  return (
    <div className="pos-category-grid">
      {tiles.map((item) => (
        <button
          key={item.cat}
          type="button"
          className={`pos-tile ${item.cat}`}
          onClick={() => navigate(item.to)}
          style={{ textAlign: "left", cursor: "pointer", width: "100%", border: "none" }}
        >
          <p
            className="ct-caption uppercase tracking-wide mb-1.5"
            style={{
              color:
                item.cat === "agreement"
                  ? "var(--pos-agr)"
                  : `var(--pos-${item.cat === "asset" ? "asset" : item.cat === "liability" ? "liab" : "inst"})`,
            }}
          >
            {item.label}
          </p>
          <p className="text-base font-semibold ct-numeral">{formatInr(item.value)}</p>
          <p className="ct-caption mt-0.5">{item.sub}</p>
        </button>
      ))}
    </div>
  );
}
