import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, Button, inputClassName, Eyebrow, Caption, Body, ToneSurface } from "../../";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import { useAuth } from "../../../context/AuthContext.jsx";
import { recordConsent } from "../../../utils/dpdpConsent.js";
import { ONBOARDING_EXPERIENCES, getOnboardingExperience } from "../../../guidance/index.js";
import { getExperienceMode } from "../../../constants/modeExperience.js";
import { templateToCommitment } from "../../../utils/onboardingTemplates.js";
import { normalizeIndianPhone } from "../../../utils/phone.js";
import { validateOnboardingFields } from "../../../utils/profileSetup.js";
import { routerBasename } from "../../../utils/basePath.js";

const QUICK_COMMITMENT_TEMPLATES = [
  { emoji: "🏠", label: "Home / rent", category: "Rent", defaultAmount: 15000 },
  { emoji: "🏦", label: "Home loan EMI", category: "EMI", defaultAmount: 25000 },
  { emoji: "🚗", label: "Car loan EMI", category: "EMI", defaultAmount: 8000 },
  { emoji: "📺", label: "OTT / streaming", category: "Subscription", defaultAmount: 649 },
  { emoji: "🛡️", label: "Insurance", category: "Insurance", defaultAmount: 2000 },
  { emoji: "📈", label: "SIP / MF", category: "SIP", defaultAmount: 5000 },
  { emoji: "🪙", label: "Chit fund", category: "Chit Fund", defaultAmount: 3000 },
  { emoji: "📚", label: "School fees", category: "School", defaultAmount: 10000 },
  { emoji: "💳", label: "Credit card", category: "Credit Card", defaultAmount: 5000 },
  { emoji: "⚡", label: "Electricity", category: "Utility", defaultAmount: 1200 },
];

function experienceIdFromSettings(settings) {
  const mode = getExperienceMode(settings);
  if (mode === "family") return "household";
  return "salaried";
}

export default function Onboarding() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const replay = searchParams.get("replay") === "1";
  const { settings, updateSettings, addCommitment } = useCommitTrack();
  const { saveProfile, profile, user } = useAuth();
  const [step, setStep] = useState(0);
  const [experienceId, setExperienceId] = useState(() => experienceIdFromSettings(settings));
  const [displayName, setDisplayName] = useState(
    () => settings.displayName || profile?.display_name || "",
  );
  const [phoneNumber, setPhoneNumber] = useState(
    () => settings.phoneNumber || profile?.phone || "",
  );
  const [monthlyIncome, setMonthlyIncome] = useState(() =>
    settings.monthlyIncome ? String(settings.monthlyIncome) : profile?.monthly_income ? String(profile.monthly_income) : "",
  );
  const [selectedLabels, setSelectedLabels] = useState(() => new Set());
  const [amounts, setAmounts] = useState(() => ({}));
  const [fieldError, setFieldError] = useState("");
  const inputClass = inputClassName();

  const experience = getOnboardingExperience(experienceId);

  const validateBasics = () => {
    const draft = {
      displayName: displayName.trim(),
      phoneNumber: normalizeIndianPhone(phoneNumber),
      monthlyIncome: monthlyIncome === "" ? 0 : Math.max(0, Number(monthlyIncome) || 0),
    };
    const msg = validateOnboardingFields(
      { ...settings, ...draft },
      { ...profile, display_name: draft.displayName, phone: draft.phoneNumber, monthly_income: draft.monthlyIncome },
      user?.id,
    );
    if (msg) return msg;
    return null;
  };

  const finish = async () => {
    const err = validateBasics();
    if (err) {
      setFieldError(err);
      return;
    }
    setFieldError("");
    const incomeNum = Math.max(0, Number(monthlyIncome) || 0);
    const payload = {
      userMode: experience.userMode,
      householdScope: experience.householdScope,
      displayName: displayName.trim(),
      phoneNumber: normalizeIndianPhone(phoneNumber),
      monthlyIncome: incomeNum,
      onboardingComplete: true,
      ...(replay ? {} : { appGuideComplete: false }),
    };
    updateSettings(payload);
    try {
      await saveProfile({
        username: payload.displayName,
        display_name: payload.displayName,
        phone: payload.phoneNumber,
        user_mode: payload.userMode,
        household_scope: payload.householdScope,
        monthly_income: payload.monthlyIncome,
        onboarding_complete: true,
      });
    } catch {
      // Ignore profile sync errors to avoid blocking onboarding.
    }
    if (replay) {
      navigate("/profile", { replace: true, state: { openSection: "guide" } });
    } else {
      navigate("/", { replace: true, state: { startGuide: true } });
    }
  };

  const goToBillsStep = () => {
    const err = validateBasics();
    if (err) {
      setFieldError(err);
      return;
    }
    setFieldError("");
    const incomeNum = Math.max(0, Number(monthlyIncome) || 0);
    updateSettings({
      displayName: displayName.trim(),
      phoneNumber: normalizeIndianPhone(phoneNumber),
      monthlyIncome: incomeNum,
    });
    setStep(3);
  };

  const toggleTemplate = (label) => {
    setSelectedLabels((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  const addSelectedAndFinish = () => {
    for (const t of QUICK_COMMITMENT_TEMPLATES) {
      if (!selectedLabels.has(t.label)) continue;
      const amt = amounts[t.label] ?? t.defaultAmount;
      addCommitment(templateToCommitment(t, amt));
    }
    finish();
  };

  const titlePrefix = replay ? "Review" : "Welcome";

  if (step === 0) {
    return (
      <div className="ct-onboard-page">
        <div>
          <Eyebrow>{titlePrefix}</Eyebrow>
          <h1 className="ct-onboard-title">{replay ? "Your CommitTrack mode" : "How do you manage money?"}</h1>
          <Caption className="block mt-2">
            {replay
              ? "Update how we explain your dashboard. Your bills stay on this account."
              : "Pick the closest fit. We keep explanations calm and changeable in Profile."}
          </Caption>
        </div>
        <div className="ct-stack">
          {ONBOARDING_EXPERIENCES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setExperienceId(m.id)}
              className={`ct-option-card ${experienceId === m.id ? "ct-option-card-active" : ""}`}
            >
              <span className="text-2xl mr-2">{m.emoji}</span>
              <span className="font-semibold">{m.label}</span>
              <Caption className="block mt-1 ml-8">{m.tagline}</Caption>
            </button>
          ))}
        </div>
        <ToneSurface tone="info">
          <Caption className="font-semibold block">Before we begin</Caption>
          <Body className="!text-sm mt-1">
            CommitTrack stores your financial data locally on your device. If you enable cloud sync, an
            encrypted copy is saved securely in Supabase. We never sell your data or use it for
            advertising. Your PAN and phone number are used only for financial tracking.
          </Body>
          <button
            type="button"
            className="ct-link !text-xs mt-2"
            onClick={() => {
              const base = routerBasename() ? `${routerBasename()}/privacy` : "/privacy";
              window.open(base, "_blank", "noopener,noreferrer");
            }}
          >
            Read our privacy policy →
          </button>
        </ToneSurface>
        <div className="ct-row">
          {replay && (
            <Button type="button" variant="outline" size="lg" className="flex-1" onClick={() => navigate(-1)}>
              Cancel
            </Button>
          )}
          <Button
            type="button"
            variant="primary"
            size="lg"
            className={replay ? "flex-1" : ""}
            onClick={() => {
              recordConsent(user?.id || "anonymous");
              setStep(1);
            }}
          >
            Continue
          </Button>
        </div>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="ct-onboard-page">
        <div>
          <Eyebrow>{experience.label}</Eyebrow>
          <h1 className="ct-onboard-title">What we will focus on</h1>
          <Card variant="flat" className="ct-guidance-onboard-explain">
            <Body className="!text-sm">{experience.explain}</Body>
          </Card>
        </div>
        <div className="ct-row">
          <Button type="button" variant="outline" size="lg" className="flex-1" onClick={() => setStep(0)}>
            Back
          </Button>
          <Button type="button" variant="primary" size="lg" className="flex-1" onClick={() => setStep(2)}>
            Sounds good
          </Button>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="ct-onboard-page">
        <div>
          <Eyebrow>Setup</Eyebrow>
          <h1 className="ct-onboard-title">{replay ? "Update basics" : "Confirm your details"}</h1>
          <Caption className="block mt-2">Name, mobile, and salary are required to use CommitTrack.</Caption>
        </div>
        <Card className="ct-stack">
          <div>
            <label className="ct-field-label">Your name *</label>
            <input
              className={inputClass}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="ct-field-label">Mobile number *</label>
            <input
              type="tel"
              className={inputClass}
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="10-digit Indian mobile"
              inputMode="numeric"
              required
            />
          </div>
          <div>
            <label className="ct-field-label">Monthly salary (₹) *</label>
            <input
              type="number"
              min="1"
              className={inputClass}
              value={monthlyIncome}
              onChange={(e) => setMonthlyIncome(e.target.value)}
              required
            />
          </div>
        </Card>
        {fieldError && <Caption className="block text-[var(--ct-danger)]">{fieldError}</Caption>}
        <div className="ct-row">
          <Button type="button" variant="outline" size="lg" className="flex-1" onClick={() => setStep(1)}>
            Back
          </Button>
          <Button type="button" variant="primary" size="lg" className="flex-1" onClick={goToBillsStep}>
            Continue
          </Button>
        </div>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="ct-onboard-page">
        <div>
          <Eyebrow>Quick start</Eyebrow>
          <h1 className="ct-onboard-title">What do you pay regularly?</h1>
          <Caption className="block mt-2">
            Optional — tap bills or EMIs you want to add now. You can skip and add them later.
          </Caption>
        </div>
        <div className="ct-grid-2">
          {QUICK_COMMITMENT_TEMPLATES.map((t) => {
            const active = selectedLabels.has(t.label);
            return (
              <button
                key={t.label}
                type="button"
                onClick={() => toggleTemplate(t.label)}
                className={`ct-option-card ${active ? "ct-option-card-active" : ""}`}
              >
                <span className="text-xl mr-2">{t.emoji}</span>
                <span className="font-semibold text-sm">{t.label}</span>
              </button>
            );
          })}
        </div>
        {selectedLabels.size > 0 && (
          <Card className="ct-stack-sm">
            {QUICK_COMMITMENT_TEMPLATES.filter((t) => selectedLabels.has(t.label)).map((t) => (
              <div key={t.label}>
                <label className="ct-field-label">{t.label} (₹/mo)</label>
                <input
                  type="number"
                  min="0"
                  className={inputClass}
                  value={amounts[t.label] ?? t.defaultAmount}
                  onChange={(e) =>
                    setAmounts((prev) => ({
                      ...prev,
                      [t.label]: Math.max(0, Number(e.target.value) || 0),
                    }))
                  }
                />
              </div>
            ))}
          </Card>
        )}
        <div className="ct-row">
          <Button type="button" variant="outline" size="lg" className="flex-1" onClick={() => setStep(2)}>
            Back
          </Button>
          <Button type="button" variant="outline" size="lg" className="flex-1" onClick={finish}>
            Skip for now
          </Button>
          <Button type="button" variant="primary" size="lg" className="flex-1" onClick={addSelectedAndFinish}>
            Add selected & start
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
