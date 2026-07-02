#!/usr/bin/env node
/** Split WealthEntryDetailPage.jsx asset sections into detail/ folder. */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const srcPath = path.join(ROOT, "src/ui/features/ledger/WealthEntryDetailPage.jsx");
const outDir = path.join(ROOT, "src/ui/features/ledger/detail");
const lines = fs.readFileSync(srcPath, "utf8").split(/\r?\n/);

fs.mkdirSync(outDir, { recursive: true });

const verdictFile = `import { useTranslation } from "../../../i18n/I18nProvider.js";

function verdictPillClass(verdict) {
  if (verdict === "hold" || verdict === "hold_moderate" || verdict === "hold_mature") return "hold";
  if (verdict === "wait") return "wait";
  if (verdict === "review") return "review";
  return "neutral";
}

function verdictLabelKey(verdict) {
  if (verdict === "hold_mature") return "wealthDetail.verdict.holdMature";
  if (verdict === "hold" || verdict === "hold_moderate") return "wealthDetail.verdict.hold";
  if (verdict === "wait") return "wealthDetail.verdict.wait";
  if (verdict === "review") return "wealthDetail.verdict.review";
  return "wealthDetail.verdict.neutral";
}

export default function Verdict({ t, verdict, reasonKey, reasonParams = undefined }) {
  const reason = reasonKey ? t(reasonKey, reasonParams) : "";
  return (
    <div className="ed-asset-verdict">
      <span className={\`ed-asset-verdict-pill \${verdictPillClass(verdict)}\`}>{t(verdictLabelKey(verdict))}</span>
      {reason ? <span className="ed-asset-verdict-reason">{reason}</span> : null}
    </div>
  );
}
`;

fs.writeFileSync(path.join(outDir, "Verdict.jsx"), verdictFile);

const sections = [
  {
    file: "PropertyDetailSections.jsx",
    start: 443,
    end: 659,
    header: `import { useState } from "react";
import { LocationMapPicker } from "../../../patterns/LocationMapPicker.jsx";
import { CtIcon } from "../../../icons/CtIcon.jsx";
import Verdict from "./Verdict.jsx";

export default function PropertyDetailSections({ entry, intel, formatAmount, t, tierLabel, onEditPin }) {
  const prop = intel.propertyIntel;
  const [showMap, setShowMap] = useState(false);
  if (!prop) return null;
  return (
`,
    footer: `  );
}
`,
    condition: "intel.isProperty",
    extraProps: "tierLabel={tierLabel} onEditPin={() => setEditOpen(true)}",
  },
  {
    file: "GoldDetailSections.jsx",
    start: 661,
    end: 785,
    header: `import Verdict from "./Verdict.jsx";

export default function GoldDetailSections({ entry, intel, formatAmount, t }) {
  const gold = intel.goldIntel;
  if (!gold) return null;
  return (
`,
    footer: `  );
}
`,
    condition: "intel.goldIntel",
  },
  {
    file: "FdDetailSections.jsx",
    start: 787,
    end: 876,
    header: `import Verdict from "./Verdict.jsx";

export default function FdDetailSections({ entry, intel, formatAmount, t }) {
  const fd = intel.fdIntel;
  if (!fd) return null;
  return (
`,
    footer: `  );
}
`,
    condition: "intel.fdIntel",
  },
  {
    file: "VehicleDetailSections.jsx",
    start: 878,
    end: 907,
    header: `import Verdict from "./Verdict.jsx";

export default function VehicleDetailSections({ entry, intel, formatAmount, t }) {
  if (!intel.isVehicle || intel.vehicleEstimate == null) return null;
  return (
`,
    footer: `  );
}
`,
    condition: "intel.isVehicle",
  },
  {
    file: "LiabilityDetailSections.jsx",
    start: 909,
    end: 952,
    header: `import Verdict from "./Verdict.jsx";

export default function LiabilityDetailSections({ entry, intel, formatAmount, t }) {
  if (entry.kind !== "liability" || !(intel.emi > 0 || intel.interestRate > 0)) return null;
  return (
`,
    footer: `  );
}
`,
    condition: 'entry.kind === "liability"',
  },
];

for (const sec of sections) {
  let body = lines.slice(sec.start, sec.end + 1).join("\n");
  // Property: replace PropertyMap and setEditOpen
  if (sec.file === "PropertyDetailSections.jsx") {
    body = body
      .replace(/\{prop \? \(\s*<>/, "")
      .replace(/<>\s*$/, "")
      .replace(/\s*<\/>\s*\) : null\}\s*$/, "")
      .replace(
        /<PropertyMap t=\{t\} latitude=\{prop\.latitude\} longitude=\{prop\.longitude\} name=\{entry\.name\} \/>/,
        `<LocationMapPicker
                  latitude={prop.latitude}
                  longitude={prop.longitude}
                  readOnly
                  onChange={() => {}}
                  style={{ height: 200, borderRadius: 10, marginTop: 10 }}
                />`,
      )
      .replace(/setEditOpen\(true\)/g, "onEditPin()");
  }
  // Gold/Fd: strip outer wrappers
  if (sec.file === "GoldDetailSections.jsx" || sec.file === "FdDetailSections.jsx") {
    body = body
      .replace(/\{gold \? \(\s*<>/, "")
      .replace(/\{fd \? \(\s*<>/, "")
      .replace(/^\s*<>\s*$/m, "")
      .replace(/\s*<\/>\s*\) : null\}\s*$/, "");
  }
  // Vehicle: strip conditional wrapper
  if (sec.file === "VehicleDetailSections.jsx") {
    body = body.replace(
      /\{intel\.isVehicle && intel\.vehicleEstimate != null \? \(/,
      "",
    ).replace(/\) : null\}\s*$/, "");
  }
  if (sec.file === "LiabilityDetailSections.jsx") {
    body = body.replace(
      /\{entry\.kind === "liability" && \(intel\.emi > 0 \|\| intel\.interestRate > 0\) \? \(/,
      "",
    ).replace(/\) : null\}\s*$/, "");
  }

  const content = `${sec.header}${body}\n${sec.footer}`;
  fs.writeFileSync(path.join(outDir, sec.file), content);
  console.log("wrote", sec.file);
}

// Rebuild main file: remove Verdict, PropertyMap, and section blocks
let main = lines.join("\n");
const removeStart = main.indexOf("function verdictPillClass");
const removeEnd = main.indexOf("const HISTORY_TTL_MS");
if (removeStart >= 0 && removeEnd > removeStart) {
  main =
    main.slice(0, removeStart) +
    `import Verdict from "./detail/Verdict.jsx";
import PropertyDetailSections from "./detail/PropertyDetailSections.jsx";
import GoldDetailSections from "./detail/GoldDetailSections.jsx";
import FdDetailSections from "./detail/FdDetailSections.jsx";
import VehicleDetailSections from "./detail/VehicleDetailSections.jsx";
import LiabilityDetailSections from "./detail/LiabilityDetailSections.jsx";
import { LocationMapPicker } from "../../patterns/LocationMapPicker.jsx";

` +
    main.slice(removeEnd);
}

// Remove prop/gold/fd const lines if present
main = main.replace(
  /  const prop = intel\.propertyIntel;\n  const gold = intel\.goldIntel;\n  const fd = intel\.fdIntel;\n/,
  "",
);

const replacements = [
  { start: 443, end: 659, jsx: `      {intel.isProperty ? (
        <PropertyDetailSections
          entry={entry}
          intel={intel}
          formatAmount={formatAmount}
          t={t}
          tierLabel={tierLabel}
          onEditPin={() => setEditOpen(true)}
        />
      ) : null}` },
  { start: 661, end: 785, jsx: `      {intel.goldIntel ? (
        <GoldDetailSections entry={entry} intel={intel} formatAmount={formatAmount} t={t} />
      ) : null}` },
  { start: 787, end: 876, jsx: `      {intel.fdIntel ? (
        <FdDetailSections entry={entry} intel={intel} formatAmount={formatAmount} t={t} />
      ) : null}` },
  { start: 878, end: 907, jsx: `      {intel.isVehicle ? (
        <VehicleDetailSections entry={entry} intel={intel} formatAmount={formatAmount} t={t} />
      ) : null}` },
  { start: 909, end: 952, jsx: `      {entry.kind === "liability" ? (
        <LiabilityDetailSections entry={entry} intel={intel} formatAmount={formatAmount} t={t} />
      ) : null}` },
];

const mainLines = main.split(/\r?\n/);
let offset = 0;
for (const rep of replacements) {
  const s = rep.start - offset;
  const e = rep.end - offset;
  const before = mainLines.slice(0, s);
  const after = mainLines.slice(e + 1);
  mainLines.splice(0, mainLines.length, ...before, rep.jsx, ...after);
  offset += e - s;
}

fs.writeFileSync(srcPath, mainLines.join("\n"));
console.log("updated WealthEntryDetailPage.jsx");
