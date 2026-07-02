#!/usr/bin/env node
/** One-time split of InsightsBreakdownPages.jsx into breakdown/ folder. */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const src = path.join(ROOT, "src/ui/features/insights/InsightsBreakdownPages.jsx");
const outDir = path.join(ROOT, "src/ui/features/insights/breakdown");
const lines = fs.readFileSync(src, "utf8").split(/\r?\n/);

const pages = [
  { file: "SpendingBreakdown.jsx", exportName: "InsightsSpendingBreakdownPage", start: 60, end: 185 },
  { file: "YearlyBreakdown.jsx", exportName: "InsightsYearlyBreakdownPage", start: 186, end: 272 },
  { file: "NetWorthBreakdown.jsx", exportName: "InsightsNetWorthBreakdownPage", start: 273, end: 324 },
  { file: "CashflowBreakdown.jsx", exportName: "InsightsCashflowBreakdownPage", start: 325, end: 375 },
  { file: "PulseBreakdown.jsx", exportName: "InsightsPulseBreakdownPage", start: 376, end: 391 },
  { file: "AssetsBreakdown.jsx", exportName: "InsightsAssetsBreakdownPage", start: 392, end: 495 },
  { file: "LiabilitiesBreakdown.jsx", exportName: "InsightsLiabilitiesBreakdownPage", start: 496, end: 645 },
  { file: "InstrumentsBreakdown.jsx", exportName: "InsightsInstrumentsBreakdownPage", start: 646, end: lines.length },
];

const sharedHeader = `import { useMemo } from "react";
import { useNavigate, useSearchParams, Navigate } from "react-router-dom";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { useNetWorth } from "../../../context/NetWorthContext.jsx";
import FinancialPulseCard from "../../dashboard/FinancialPulseCard.jsx";
import AnalyticsChartPanel from "../../analytics/AnalyticsChartPanel.jsx";
import WealthAnalyticsSection from "../../analytics/WealthAnalyticsSection.jsx";
import ProfileNetWorthSection from "../../profile/ProfileNetWorthSection.jsx";
import { yearlyBurdenFromCommitments } from "../../../engines/analyticsSeries.js";
import { usePrivacyAmount } from "../../../hooks/usePrivacyAmount.js";
import { useInsightsData } from "../useInsightsData.js";
import { getBillDisplayName } from "../../../utils/billDisplayName.js";
import {
  isCoreAssetEntry,
  isInstrumentWealthEntry,
  isInstrumentCommitment,
} from "../../../utils/ledger/ledgerBuckets.js";
import { computeAssetCagr } from "../../../utils/netWorth/physicalAssetHelpers.js";
import {
  InsightsBreakdownShell,
  billStatusLabel,
  openBillDetail,
  openWealthDetail,
  wealthCategoryLabel,
  ROW_CLICK,
} from "./_shared.jsx";
`;

fs.mkdirSync(outDir, { recursive: true });

const sharedBody = lines.slice(21, 58).join("\n");
fs.writeFileSync(
  path.join(outDir, "_shared.jsx"),
  `import { useNavigate } from "react-router-dom";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { wealthCategoryLabel as wealthCategoryLabelUtil } from "../../../utils/netWorth/wealthCategoryLabel.js";

export function InsightsBreakdownShell({ title, subtitle, children }) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="ct-page ed-paper ed-ins-page">
      <div className="ed-ins-sub-mast">
        <button type="button" className="ed-ins-back" onClick={() => navigate("/insights")}>
          {t("insights.subpages.back")}
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 className="ed-ins-sub-title">{title}</h1>
          {subtitle ? <p className="ed-ins-sub-sub">{subtitle}</p> : null}
        </div>
      </div>
      {children}
    </div>
  );
}

export function billStatusLabel(t, status) {
  const key = \`bill.status.\${status}\`;
  const translated = t(key);
  return translated !== key ? translated : status;
}

export function openBillDetail({ navigate, billId }) {
  navigate("/ledger/bills", { state: { openBillId: billId } });
}

export function openWealthDetail({ navigate, entryId }) {
  navigate(\`/insights/entry/\${entryId}\`);
}

export const wealthCategoryLabel = wealthCategoryLabelUtil;

export const ROW_CLICK = { cursor: "pointer" };
`,
);

for (const page of pages) {
  const body = lines.slice(page.start, page.end + 1).join("\n");
  const content = `${sharedHeader}\n${body.replace(/^export function/, "export default function")}\n`;
  fs.writeFileSync(path.join(outDir, page.file), content);
  console.log("wrote", page.file);
}

const barrel = pages
  .map(
    (p) =>
      `export { default as ${p.exportName} } from "./breakdown/${p.file}";`,
  )
  .join("\n");

fs.writeFileSync(src, `// InsightsBreakdownPages.jsx — re-export barrel\n${barrel}\n`);
console.log("wrote barrel");
