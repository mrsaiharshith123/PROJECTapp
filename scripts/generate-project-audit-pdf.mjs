import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import PDFDocument from "pdfkit";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "docs");
const outFile = path.join(outDir, "CommitTrack-Project-Audit.pdf");

const sections = [
  {
    title: "Current health",
    bullets: [
      "Build, lint, and 12 unit tests pass.",
      "Stack: React 19, Vite 8, Tailwind, localStorage, PWA.",
      "No TypeScript; README still default Vite template.",
    ],
  },
  {
    title: "Bugs and risk areas",
    bullets: [
      "Monthly snapshots are global (one per calendar month), not per profile label.",
      "Historical snapshot freeMoney may be wrong until a new month is recorded.",
      "Data only in localStorage — no cloud sync; clearing browser data loses everything.",
      "Proof images capped at 400KB each; many proofs can hit storage quota.",
      "PWA notifications need permission + opening the app; no background push when closed.",
      "Schema version key only; no step-by-step migrations for old shapes.",
    ],
  },
  {
    title: "Partial / basic implementations",
    bullets: [
      "Notifications: in-app bell + daily digest (max 3); no SMS, push server, or due-time scheduling.",
      "Profiles: default/family/business labels only; no create/rename; export includes all profiles.",
      "Role modes: nav + dashboard copy; not deeply different per mode.",
      "Lending: schedules, compound interest, trust — Simulate UPI records payment locally only.",
      "Goals: create/delete + per-goal savings; no goal edit UI.",
      "Analytics: rich charts; lending not in 12-month cashflow forecast series.",
      "Export JSON/CSV yes; import/restore no.",
      "Onboarding: no re-run from Profile.",
      "Theme: light / dark / system (Profile).",
    ],
  },
  {
    title: "Not implemented",
    bullets: [
      "Backend, auth, Supabase, real UPI.",
      "Cloud backup, SMS, shared family accounts (Plus placeholder in Profile).",
      "JSON import, factory reset, dark-only polish on every gradient card.",
      "Bank/SMS parsing, ERP module, E2E tests, CI in repo.",
    ],
  },
  {
    title: "Working well",
    bullets: [
      "Commitments CRUD, recurring new-row-on-paid, filters, payments.",
      "Lending CRUD, detail dashboard, agreement HTML, proofs.",
      "Home dashboard, Analytics, Tools (prepayment, payoff, goals).",
      "Onboarding, PWA install shell, mode-based nav (student hides Lending).",
      "Engines: burden, pressure, affordability, intelligence, snapshots.",
    ],
  },
  {
    title: "Dead / unused code",
    bullets: [
      "categoryOpenTrend, monthlyPressureScore, pressureSeverity in engines.",
      "REMINDER_TYPES constant, wasPermissionAsked.",
      "savedTowardGoals legacy field (migrated to goals on load).",
    ],
  },
  {
    title: "Suggested next priorities",
    bullets: [
      "JSON import paired with export.",
      "Background due reminders (Periodic Background Sync or push).",
      "Per-profile monthly snapshots.",
      "Include lending in cashflow forecast.",
      "Real profile management or remove filter until ready.",
    ],
  },
];

function drawSection(doc, { title, bullets }, yStart) {
  let y = yStart;
  if (y > doc.page.height - 120) {
    doc.addPage();
    y = 50;
  }
  doc.font("Helvetica-Bold").fontSize(13).fillColor("#312e81").text(title, 50, y);
  y += 22;
  doc.font("Helvetica").fontSize(10).fillColor("#1f2937");
  for (const line of bullets) {
    const h = doc.heightOfString(`• ${line}`, { width: 495 });
    if (y + h > doc.page.height - 50) {
      doc.addPage();
      y = 50;
      doc.font("Helvetica").fontSize(10).fillColor("#1f2937");
    }
    doc.text(`• ${line}`, 55, y, { width: 490, lineGap: 2 });
    y += h + 8;
  }
  return y + 10;
}

fs.mkdirSync(outDir, { recursive: true });

const doc = new PDFDocument({ margin: 50, size: "A4" });
const stream = fs.createWriteStream(outFile);
doc.pipe(stream);

doc.font("Helvetica-Bold").fontSize(20).fillColor("#4f46e5").text("CommitTrack — Project Audit", 50, 45);
doc
  .font("Helvetica")
  .fontSize(10)
  .fillColor("#6b7280")
  .text(`Generated ${new Date().toLocaleString("en-IN")} · local-first financial commitments app`, 50, 72);

let y = 100;
for (const section of sections) {
  y = drawSection(doc, section, y);
}

doc.end();

stream.on("finish", () => {
  console.log("Wrote", outFile);
});
