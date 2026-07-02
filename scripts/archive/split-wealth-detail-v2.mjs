#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const file = path.join(__dirname, "../src/ui/features/ledger/WealthEntryDetailPage.jsx");
const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);

const headerEnd = lines.findIndex((l) => l.startsWith("function verdictPillClass"));
const historyStart = lines.findIndex((l) => l.startsWith("const HISTORY_TTL_MS"));

const newHeader = [
  ...lines.slice(0, headerEnd),
  `import PropertyDetailSections from "./detail/PropertyDetailSections.jsx";`,
  `import GoldDetailSections from "./detail/GoldDetailSections.jsx";`,
  `import FdDetailSections from "./detail/FdDetailSections.jsx";`,
  `import VehicleDetailSections from "./detail/VehicleDetailSections.jsx";`,
  `import LiabilityDetailSections from "./detail/LiabilityDetailSections.jsx";`,
  "",
  ...lines.slice(historyStart),
];

let out = newHeader.join("\n").split(/\r?\n/);

out = out.filter((l) => l !== "  const [showMap, setShowMap] = useState(false);");
out = out.filter(
  (l) =>
    l !== "  const prop = intel.propertyIntel;" &&
    l !== "  const gold = intel.goldIntel;" &&
    l !== "  const fd = intel.fdIntel;",
);

const idx = (needle) => out.findIndex((l) => l.includes(needle));
const propStart = idx("{prop ? (");
const goldStart = idx("{gold ? (");
const fdStart = idx("{fd ? (");
const vehicleStart = idx("{intel.isVehicle && intel.vehicleEstimate");
const liabilityStart = idx('{entry.kind === "liability" && (intel.emi');

function blockEnd(start) {
  let depth = 0;
  for (let i = start; i < out.length; i++) {
    for (const ch of out[i]) {
      if (ch === "{") depth++;
      if (ch === "}") depth--;
    }
    if (out[i].trim() === ") : null}" && depth <= 0) return i;
  }
  throw new Error(`no end for line ${start + 1}: ${out[start]}`);
}

const replacements = [
  { start: propStart, jsx: `      {intel.isProperty ? (
        <PropertyDetailSections
          entry={entry}
          intel={intel}
          formatAmount={formatAmount}
          t={t}
          tierLabel={tierLabel}
          onEditPin={() => setEditOpen(true)}
        />
      ) : null}` },
  { start: goldStart, jsx: `      {intel.goldIntel ? (
        <GoldDetailSections entry={entry} intel={intel} formatAmount={formatAmount} t={t} />
      ) : null}` },
  { start: fdStart, jsx: `      {intel.fdIntel ? (
        <FdDetailSections entry={entry} intel={intel} formatAmount={formatAmount} t={t} />
      ) : null}` },
  { start: vehicleStart, jsx: `      {intel.isVehicle ? (
        <VehicleDetailSections entry={entry} intel={intel} formatAmount={formatAmount} t={t} />
      ) : null}` },
  { start: liabilityStart, jsx: `      {entry.kind === "liability" ? (
        <LiabilityDetailSections entry={entry} intel={intel} formatAmount={formatAmount} t={t} />
      ) : null}` },
].sort((a, b) => b.start - a.start);

for (const rep of replacements) {
  const end = blockEnd(rep.start);
  out = [...out.slice(0, rep.start), rep.jsx, ...out.slice(end + 1)];
}

fs.writeFileSync(file, out.join("\n"));
console.log("WealthEntryDetailPage.jsx updated, lines:", out.length);
