import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, Button, inputClassName, Eyebrow, Caption, Body } from "../../";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import { useAuth } from "../../../context/AuthContext.jsx";
import { ONBOARDING_EXPERIENCES, getOnboardingExperience } from "../../../guidance/index.js";
import { getExperienceMode } from "../../../constants/modeExperience.js";

function experienceIdFromSettings(settings) {
  const mode = getExperienceMode(settings);
  if (mode === "business") return "business";
  if (mode === "family") return "household";
  return "salaried";
}

export default function Onboarding() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const replay = searchParams.get("replay") === "1";
  const { settings, updateSettings } = useCommitTrack();
  const { saveProfile } = useAuth();
  const [step, setStep] = useState(0);
  const [experienceId, setExperienceId] = useState(() => experienceIdFromSettings(settings));
  const [displayName, setDisplayName] = useState(() => settings.displayName || "");
  const [monthlyIncome, setMonthlyIncome] = useState(() =>
    settings.monthlyIncome ? String(settings.monthlyIncome) : "",
  );
  const [businessType, setBusinessType] = useState(() => settings.businessType || "");
  const inputClass = inputClassName();

  const experience = getOnboardingExperience(experienceId);

  const finish = async () => {
    const payload = {
      userMode: experience.userMode,
      householdScope: experience.householdScope,
      displayName: displayName.trim(),
      monthlyIncome: monthlyIncome === "" ? 0 : Math.max(0, Number(monthlyIncome) || 0),
      businessType: businessType.trim(),
      onboardingComplete: true,
      ...(replay ? {} : { appGuideComplete: false }),
    };
    updateSettings(payload);
    try {
      await saveProfile({
        username: payload.displayName,
        display_name: payload.displayName,
        user_mode: payload.userMode,
        household_scope: payload.householdScope,
        monthly_income: payload.monthlyIncome,
        business_type: payload.businessType,
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

  const titlePrefix = replay ? "Review" : "Welcome";

  if (step === 0) {
    return (
      <div className="ct-onboard-page">
        <div>
          <Eyebrow>{titlePrefix}</Eyebrow>
          <h1 className="ct-onboard-title">{replay ? "Your CommitTrack mode" : "How do you manage money?"}</h1>
          <Caption className="block mt-2">
            {replay
              ? "Update how we explain your dashboard. Your bills and history stay on this device."
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
        <div className="ct-row">
          {replay && (
            <Button type="button" variant="outline" size="lg" className="flex-1" onClick={() => navigate(-1)}>
              Cancel
            </Button>
          )}
          <Button type="button" variant="primary" size="lg" className={replay ? "flex-1" : ""} onClick={() => setStep(1)}>
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

  return (
    <div className="ct-onboard-page">
      <div>
        <Eyebrow>Setup</Eyebrow>
        <h1 className="ct-onboard-title">{replay ? "Update basics" : "Just the essentials"}</h1>
        <Caption className="block mt-2">You can add bills and fine-tune later — no rush.</Caption>
      </div>
      <Card className="ct-stack">
        <div>
          <label className="ct-field-label">Your name</label>
          <input
            className={inputClass}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Optional"
          />
        </div>
        <div>
          <label className="ct-field-label">
            {experience.userMode === "business" ? "Typical monthly revenue (₹)" : "Monthly income (₹)"}
          </label>
          <input
            type="number"
            min="0"
            className={inputClass}
            value={monthlyIncome}
            onChange={(e) => setMonthlyIncome(e.target.value)}
            placeholder="Helps pressure and runway feel accurate"
          />
        </div>
        {experience.userMode === "business" && (
          <div>
            <label className="ct-field-label">Business type</label>
            <input
              className={inputClass}
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
              placeholder="e.g. Retail, services"
            />
          </div>
        )}
      </Card>
      <div className="ct-row">
        <Button type="button" variant="outline" size="lg" className="flex-1" onClick={() => setStep(1)}>
          Back
        </Button>
        <Button type="button" variant="primary" size="lg" className="flex-1" onClick={finish}>
          {replay ? "Save changes" : "Start using CommitTrack"}
        </Button>
      </div>
    </div>
  );
}
