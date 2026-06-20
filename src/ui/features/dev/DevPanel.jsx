import { useState, useEffect, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import {
  IS_DEV,
  getDevOverride,
  setDevOverride,
  clearDevOverride,
  isForceShowAll,
  setForceShowAll,
  DEV_PRESETS,
} from "../../../utils/devOverride.js";
import { isESignConfigured } from "../../../services/lending/leegalityESign.js";
import { isKycConfigured } from "../../../services/lending/kycVerification.js";
import { isGoldApiConfigured } from "../../../services/market/goldPrice.js";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { combinedMonthlyIncome } from "../../../utils/combinedIncome.js";

const BankStatementImportModal = lazy(() => import("../modals/BankStatementImportModal.jsx"));
const BillSplitModal = lazy(() => import("../modals/BillSplitModal.jsx"));
const CommitmentEditModal = lazy(() => import("../modals/CommitmentEditModal.jsx"));
const HouseholdSetupModal = lazy(() => import("../modals/HouseholdSetupModal.jsx"));
const InsuranceCalculatorModal = lazy(() => import("../modals/InsuranceCalculatorModal.jsx"));
const LegalDetailsModal = lazy(() => import("../modals/LegalDetailsModal.jsx"));
const LogSpendModal = lazy(() => import("../modals/LogSpendModal.jsx"));
const MathCalculatorModal = lazy(() => import("../modals/MathCalculatorModal.jsx"));
const SmsDetectModal = lazy(() => import("../modals/SmsDetectModal.jsx"));

const DEV_MOCK_COMMITMENT = {
  id: "dev-preview",
  name: "Sample EMI",
  amount: 8500,
  category: "EMI",
  dueDate: "2026-06-15",
  startDate: "2026-01-15",
  repeatType: "monthly",
  remainingAmount: 120000,
  priority: "high",
};

const panelStyle = {
  background: "var(--ct-bg)",
  minHeight: "100vh",
  padding: "1rem",
  fontFamily: "var(--ct-font)",
  color: "var(--ct-text)",
};

const chipBtn = (active) => ({
  marginRight: "4px",
  marginBottom: "12px",
  padding: "6px 14px",
  borderRadius: "999px",
  background: active ? "#6366f1" : "var(--ct-surface)",
  color: active ? "#fff" : "var(--ct-text-muted)",
  border: "1px solid var(--ct-border)",
  cursor: "pointer",
  fontSize: "12px",
  fontWeight: 600,
  textTransform: "capitalize",
});

export default function DevPanel() {
  const navigate = useNavigate();
  const { settings, updateSettings, commitments, todayStr } = usePerovo();
  const [override, setOverrideState] = useState(() => getDevOverride());
  const [forceAll, setForceAllState] = useState(() => isForceShowAll());
  const [openModal, setOpenModal] = useState(null);
  const [tab, setTab] = useState("status");

  useEffect(() => {
    if (!IS_DEV) {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    const handler = () => {
      setOverrideState(getDevOverride());
      setForceAllState(isForceShowAll());
    };
    window.addEventListener("perovo_dev_change", handler);
    return () => window.removeEventListener("perovo_dev_change", handler);
  }, []);

  if (!IS_DEV) return null;

  const applyPreset = (key) => {
    const p = DEV_PRESETS[key];
    if (!p) return;
    setDevOverride(p.state);
    if (p.state.subscriptionTier) {
      updateSettings({ subscriptionTier: p.state.subscriptionTier });
    }
  };

  const monthlyIncome = combinedMonthlyIncome(settings);

  const integrations = [
    {
      name: "Leegality eSign",
      ok: isESignConfigured(),
      env: "VITE_LEEGALITY_API_TOKEN",
      feature: "Lending → agreement → sign with Aadhaar OTP",
    },
    {
      name: "Surepass KYC",
      ok: isKycConfigured(),
      env: "VITE_SUREPASS_TOKEN",
      feature: "Lending → legal details → verify PAN",
    },
    {
      name: "Gold Price API",
      ok: isGoldApiConfigured(),
      env: "VITE_GOLD_API_KEY",
      feature: "Net worth → gold auto-update",
    },
    {
      name: "Firebase FCM",
      ok: Boolean(import.meta.env.VITE_FIREBASE_API_KEY),
      env: "VITE_FIREBASE_API_KEY",
      feature: "Notifications → reliable push delivery",
    },
    {
      name: "Sentry",
      ok: Boolean(import.meta.env.VITE_SENTRY_DSN),
      env: "VITE_SENTRY_DSN",
      feature: "Error boundary → automatic error capture",
    },
    {
      name: "PostHog Analytics",
      ok: Boolean(import.meta.env.VITE_POSTHOG_KEY),
      env: "VITE_POSTHOG_KEY",
      feature: "Admin → product analytics events",
    },
    {
      name: "Supabase",
      ok: Boolean(import.meta.env.VITE_SUPABASE_URL),
      env: "VITE_SUPABASE_URL",
      feature: "Auth + cloud sync + AI advisor edge function",
    },
    {
      name: "Razorpay",
      ok: Boolean(import.meta.env.VITE_RAZORPAY_KEY_ID),
      env: "VITE_RAZORPAY_KEY_ID",
      feature: "Profile → plans → upgrade payment",
    },
    {
      name: "Anthropic (AI)",
      ok: Boolean(import.meta.env.VITE_SUPABASE_URL),
      env: "ANTHROPIC_API_KEY (server)",
      feature: "Tools → AI advisor → ask questions via Supabase function",
    },
  ];

  const pages = [
    { path: "/", label: "Home" },
    { path: "/commitments", label: "Commitments" },
    { path: "/add", label: "Add commitment" },
    { path: "/lending", label: "Lending" },
    { path: "/analytics", label: "Analytics" },
    { path: "/paycheck", label: "Paycheck breakdown" },
    { path: "/family-room", label: "Family room" },
    { path: "/net-worth", label: "Net worth / Wealth" },
    { path: "/tools", label: "All tools" },
    { path: "/profile", label: "Profile / Settings" },
    { path: "/profile/scores", label: "Financial scores detail" },
    { path: "/profile/analytics", label: "Wealth analytics" },
    { path: "/admin", label: "Admin dashboard" },
    { path: "/privacy", label: "Privacy policy" },
    { path: "/onboarding", label: "Onboarding flow" },
    { path: "/dev", label: "Dev panel (this page)" },
  ];

  const modals = [
    { key: "logSpend", label: "Log daily spend", note: "Opens from home FAB / quick action" },
    { key: "billSplit", label: "Bill split", note: "Opens from lending page header" },
    { key: "bankImport", label: "Bank statement import", note: "Opens from dashboard tools" },
    { key: "legalDetails", label: "Legal details (lending)", note: "Opens when borrower fields empty in agreement" },
    { key: "editCommit", label: "Edit commitment", note: "Opens on commitment card long-press/edit" },
    { key: "householdSetup", label: "Household setup", note: "Opens from profile → household" },
    { key: "insurance", label: "Insurance calculator", note: "Opens from tools → insurance" },
    { key: "mathCalc", label: "Math calculator", note: "Opens from quick actions" },
    { key: "smsDetect", label: "SMS commitment detector", note: "Opens from add page" },
  ];

  const conditionalFeatures = [
    { label: "Overdue panel", trigger: "Any commitment is overdue", path: "/commitments" },
    { label: "Critical survival UI", trigger: "survivalMonths < 2", path: "/analytics" },
    { label: "Pressure spike alert", trigger: "pressureScore rose > 10 this month", path: "/" },
    { label: "Aadhaar eSign button", trigger: "VITE_LEEGALITY_API_TOKEN set + borrower details filled", path: "/lending" },
    { label: "PAN verify button", trigger: "VITE_SUREPASS_TOKEN set + idProofType=PAN", path: "/lending" },
    { label: "Gold auto-update", trigger: "VITE_GOLD_API_KEY set + goldRatePerGram in settings", path: "/net-worth" },
    { label: "Debt-free confetti", trigger: "lending.remainingAmount drops to 0", path: "/lending" },
    { label: "Goal trophy", trigger: "goal reaches 100% funded", path: "/tools" },
    { label: "Celebration overlay", trigger: "commitment fully paid off (last payment)", path: "/commitments" },
    { label: "eStamp guidance", trigger: "agreement downloaded → stamp section expanded", path: "/lending" },
    { label: "Family activity feed", trigger: "householdRoomId set in settings", path: "/family-room" },
    { label: "Festival planner card", trigger: "family mode + yearly commitments in 90-day window", path: "/" },
    { label: "School fee card", trigger: "family mode + School category commitments", path: "/" },
    { label: "Attention section", trigger: "overdue or due-in-3-days commitments", path: "/" },
    { label: "Safe to spend card", trigger: "income set in settings", path: "/" },
    { label: "Bill scanner (OCR)", trigger: "Tap + → Scan a bill", path: "/" },
    { label: "SIP live NAV value", trigger: "SIP commitment has schemeCode set", path: "/tools" },
    { label: "Pro features (gate)", trigger: "subscriptionTier = pro or power", path: "/profile" },
    { label: "Power features (AI)", trigger: "subscriptionTier = power", path: "/tools" },
    { label: "Admin dashboard", trigger: "isAdmin flag in user profile", path: "/admin" },
    { label: "Salary day auto-open", trigger: "today's date == salaryCreditDay setting", path: "/" },
    { label: "Snapshot insights", trigger: "3+ monthly snapshots exist", path: "/analytics" },
    { label: "CIBIL sim tool", trigger: "Always available in tools", path: "/tools" },
    { label: "EPF projection", trigger: "epfAge + epfBasicSalary set", path: "/tools" },
    { label: "Family report card", trigger: "householdRoomId set", path: "/family-room" },
    { label: "Shared goal card", trigger: "goal with forMember=shared in family mode", path: "/family-room" },
  ];

  return (
    <div style={panelStyle}>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() => navigate("/")}
          style={{
            background: "var(--ct-surface)",
            border: "1px solid var(--ct-border)",
            borderRadius: "8px",
            padding: "6px 12px",
            color: "var(--ct-text-muted)",
            cursor: "pointer",
            fontSize: "13px",
          }}
        >
          ← Back to app
        </button>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 700, fontFamily: "var(--ct-font-display)" }}>
          🔧 Perovo Dev Panel
        </h1>
        <div style={{ marginLeft: "auto", display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: "11px", color: "var(--ct-text-muted)" }}>Force show all:</span>
          <button
            type="button"
            onClick={() => setForceShowAll(!forceAll)}
            style={{
              padding: "4px 10px",
              borderRadius: "999px",
              fontSize: "12px",
              fontWeight: 600,
              background: forceAll ? "#6366f1" : "var(--ct-surface)",
              color: forceAll ? "#fff" : "var(--ct-text-muted)",
              border: "1px solid var(--ct-border)",
              cursor: "pointer",
            }}
          >
            {forceAll ? "ON — all conditions bypassed" : "OFF"}
          </button>
          {override ? (
            <button
              type="button"
              onClick={clearDevOverride}
              style={{
                padding: "4px 10px",
                borderRadius: "999px",
                fontSize: "12px",
                background: "#ef4444",
                color: "#fff",
                border: "none",
                cursor: "pointer",
              }}
            >
              Clear overrides
            </button>
          ) : null}
        </div>
      </div>

      {["status", "pages", "modals", "features", "state"].map((t) => (
        <button key={t} type="button" onClick={() => setTab(t)} style={chipBtn(tab === t)}>
          {t}
        </button>
      ))}

      {tab === "status" && (
        <div>
          <p style={{ fontSize: "12px", color: "var(--ct-text-muted)", marginBottom: "12px" }}>
            API keys and integration status. Add missing keys to .env and restart dev server.
          </p>
          {integrations.map((i) => (
            <div
              key={i.name}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
                padding: "10px",
                marginBottom: "6px",
                background: "var(--ct-surface)",
                borderRadius: "10px",
                border: `1px solid ${i.ok ? "rgba(13,148,136,0.3)" : "rgba(239,68,68,0.2)"}`,
              }}
            >
              <span style={{ fontSize: "16px", lineHeight: 1, flexShrink: 0 }}>{i.ok ? "✅" : "🔴"}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: "13px" }}>{i.name}</div>
                <div style={{ fontSize: "11px", color: "var(--ct-text-muted)", marginTop: "2px" }}>
                  {i.ok ? "Configured" : `Missing: ${i.env}`}
                </div>
                <div style={{ fontSize: "11px", color: "#6366f1", marginTop: "2px" }}>UI: {i.feature}</div>
              </div>
              {!i.ok ? (
                <div
                  style={{
                    fontSize: "10px",
                    color: "#f59e0b",
                    background: "rgba(245,158,11,0.1)",
                    padding: "3px 8px",
                    borderRadius: "999px",
                    flexShrink: 0,
                  }}
                >
                  Add to .env
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {tab === "pages" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "8px" }}>
          {pages.map((p) => (
            <button
              key={p.path}
              type="button"
              onClick={() => navigate(p.path)}
              style={{
                padding: "12px 14px",
                background: "var(--ct-surface)",
                border: "1px solid var(--ct-border)",
                borderRadius: "10px",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--ct-text)" }}>{p.label}</div>
              <div style={{ fontSize: "11px", color: "#6366f1", marginTop: "2px" }}>{p.path}</div>
            </button>
          ))}
        </div>
      )}

      {tab === "modals" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "8px" }}>
          {modals.map((m) => (
            <div
              key={m.key}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 14px",
                background: "var(--ct-surface)",
                border: "1px solid var(--ct-border)",
                borderRadius: "10px",
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: "13px" }}>{m.label}</div>
                <div style={{ fontSize: "11px", color: "var(--ct-text-muted)", marginTop: "2px" }}>
                  Normally: {m.note}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpenModal(m.key)}
                style={{
                  padding: "6px 14px",
                  background: "#6366f1",
                  color: "#fff",
                  border: "none",
                  borderRadius: "999px",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              >
                Open
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === "features" && (
        <div>
          <p style={{ fontSize: "12px", color: "var(--ct-text-muted)", marginBottom: "12px" }}>
            These features are hidden unless their condition is met. Use Force show all or a state preset to see them.
          </p>
          {conditionalFeatures.map((f) => (
            <div
              key={f.label}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
                padding: "10px",
                marginBottom: "6px",
                background: "var(--ct-surface)",
                borderRadius: "10px",
                border: "1px solid var(--ct-border)",
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: "13px" }}>{f.label}</div>
                <div style={{ fontSize: "11px", color: "#f59e0b", marginTop: "2px" }}>
                  Triggers when: {f.trigger}
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate(f.path)}
                style={{
                  padding: "5px 12px",
                  background: "var(--ct-surface-raised)",
                  color: "var(--ct-accent-muted)",
                  border: "1px solid var(--ct-border-accent-soft)",
                  borderRadius: "999px",
                  cursor: "pointer",
                  fontSize: "11px",
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              >
                Go →
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === "state" && (
        <div>
          <p style={{ fontSize: "12px", color: "var(--ct-text-muted)", marginBottom: "12px" }}>
            Apply a preset financial state to trigger conditional features without changing real data.
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: "8px",
              marginBottom: "16px",
            }}
          >
            {Object.entries(DEV_PRESETS).map(([key, preset]) => (
              <button
                key={key}
                type="button"
                onClick={() => applyPreset(key)}
                style={{
                  padding: "10px 12px",
                  background: "var(--ct-surface)",
                  border: `1px solid ${
                    key === "critical"
                      ? "rgba(239,68,68,0.4)"
                      : key === "high_pressure"
                        ? "rgba(245,158,11,0.4)"
                        : key === "power_user"
                          ? "rgba(99,102,241,0.4)"
                          : "var(--ct-border)"
                  }`,
                  borderRadius: "10px",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <div style={{ fontWeight: 600, fontSize: "12px", color: "var(--ct-text)" }}>{preset.label}</div>
                <div style={{ fontSize: "10px", color: "var(--ct-text-muted)", marginTop: "4px", lineHeight: 1.6 }}>
                  Pressure: {preset.state.pressureScore} · Survival: {preset.state.survivalMonths}m · Overdue:{" "}
                  {preset.state.overdueCount} · Tier: {preset.state.subscriptionTier}
                </div>
              </button>
            ))}
          </div>

          {override ? (
            <div
              style={{
                padding: "12px",
                background: "rgba(99,102,241,0.08)",
                border: "1px solid rgba(99,102,241,0.25)",
                borderRadius: "10px",
              }}
            >
              <div style={{ fontSize: "12px", fontWeight: 600, color: "#a5b4fc", marginBottom: "6px" }}>
                Active overrides:
              </div>
              <pre
                style={{
                  fontSize: "11px",
                  color: "var(--ct-text-secondary)",
                  fontFamily: "monospace",
                  margin: 0,
                  overflow: "auto",
                }}
              >
                {JSON.stringify(override, null, 2)}
              </pre>
            </div>
          ) : (
            <div style={{ fontSize: "12px", color: "var(--ct-text-muted)" }}>
              No active overrides. App is using real computed state.
            </div>
          )}
        </div>
      )}

      <Suspense fallback={null}>
        {openModal === "logSpend" ? <LogSpendModal onClose={() => setOpenModal(null)} /> : null}
        {openModal === "billSplit" ? <BillSplitModal onClose={() => setOpenModal(null)} /> : null}
        {openModal === "bankImport" ? <BankStatementImportModal onClose={() => setOpenModal(null)} /> : null}
        {openModal === "editCommit" ? (
          <CommitmentEditModal
            commitment={DEV_MOCK_COMMITMENT}
            onClose={() => setOpenModal(null)}
            onSave={() => setOpenModal(null)}
          />
        ) : null}
        {openModal === "householdSetup" ? (
          <HouseholdSetupModal open onClose={() => setOpenModal(null)} />
        ) : null}
        {openModal === "insurance" ? (
          <InsuranceCalculatorModal
            commitments={commitments}
            todayStr={todayStr}
            monthlyIncome={monthlyIncome}
            onClose={() => setOpenModal(null)}
          />
        ) : null}
        {openModal === "mathCalc" ? <MathCalculatorModal onClose={() => setOpenModal(null)} /> : null}
        {openModal === "smsDetect" ? <SmsDetectModal open onClose={() => setOpenModal(null)} /> : null}
        {openModal === "legalDetails" ? (
          <LegalDetailsModal lending={{}} open onClose={() => setOpenModal(null)} />
        ) : null}
      </Suspense>
    </div>
  );
}
