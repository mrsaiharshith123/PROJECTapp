import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Button, inputClassName, Eyebrow, Caption } from "../../";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import { useAuth } from "../../../context/AuthContext.jsx";
import { SELECTABLE_USER_MODES } from "../../../constants/userModes.js";

export default function Onboarding() {
  const navigate = useNavigate();
  const { updateSettings } = useCommitTrack();
  const { saveProfile } = useAuth();
  const [step, setStep] = useState(0);
  const [userMode, setUserMode] = useState("salaried");
  const [householdScope, setHouseholdScope] = useState("single");
  const [displayName, setDisplayName] = useState("");
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [businessType, setBusinessType] = useState("");
  const inputClass = inputClassName();

  const finish = async () => {
    const payload = {
      userMode,
      householdScope: userMode === "salaried" ? householdScope : "single",
      displayName: displayName.trim(),
      monthlyIncome: monthlyIncome === "" ? 0 : Math.max(0, Number(monthlyIncome) || 0),
      businessType: businessType.trim(),
      onboardingComplete: true,
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
    navigate("/", { replace: true });
  };

  if (step === 0) {
    return (
      <div className="ct-onboard-page">
        <div>
          <Eyebrow>Welcome</Eyebrow>
          <h1 className="ct-onboard-title">What best describes you?</h1>
          <Caption className="block mt-2">We tailor menus and tips to your situation. Change anytime in Profile.</Caption>
        </div>
        <div className="ct-stack">
          {SELECTABLE_USER_MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setUserMode(m.id)}
              className={`ct-option-card ${userMode === m.id ? "ct-option-card-active" : ""}`}
            >
              <span className="text-2xl mr-2">{m.emoji}</span>
              <span className="font-semibold">{m.label}</span>
              <Caption className="block mt-1 ml-8">{m.description}</Caption>
            </button>
          ))}
        </div>
        <Button type="button" variant="primary" size="lg" onClick={() => setStep(userMode === "salaried" ? 1 : 2)}>
          Continue
        </Button>
      </div>
    );
  }

  if (step === 1 && userMode === "salaried") {
    return (
      <div className="ct-onboard-page">
        <div>
          <Eyebrow>Household</Eyebrow>
          <h1 className="ct-onboard-title">Who are you planning for?</h1>
          <Caption className="block mt-2">Family mode unlocks household tools, payer tags, and family profiles.</Caption>
        </div>
        <div className="ct-stack">
          {[
            { id: "single", label: "Just me", desc: "Personal salary, EMIs, and subscriptions." },
            { id: "family", label: "Family household", desc: "Shared bills, school fees, second income, family members." },
          ].map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setHouseholdScope(opt.id)}
              className={`ct-option-card ${householdScope === opt.id ? "ct-option-card-active" : ""}`}
            >
              <span className="font-semibold">{opt.label}</span>
              <Caption className="block mt-1">{opt.desc}</Caption>
            </button>
          ))}
        </div>
        <div className="ct-row">
          <Button type="button" variant="outline" size="lg" className="flex-1" onClick={() => setStep(0)}>
            Back
          </Button>
          <Button type="button" variant="primary" size="lg" className="flex-1" onClick={() => setStep(2)}>
            Continue
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="ct-onboard-page">
      <div>
        <Eyebrow>Setup</Eyebrow>
        <h1 className="ct-onboard-title">A few basics</h1>
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
          <label className="ct-field-label">Monthly income (₹)</label>
          <input
            type="number"
            min="0"
            className={inputClass}
            value={monthlyIncome}
            onChange={(e) => setMonthlyIncome(e.target.value)}
            placeholder="Helps pressure and affordability scores"
          />
        </div>
        {userMode === "business" && (
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
        <Button type="button" variant="outline" size="lg" className="flex-1" onClick={() => setStep(userMode === "salaried" ? 1 : 0)}>
          Back
        </Button>
        <Button type="button" variant="primary" size="lg" className="flex-1" onClick={finish}>
          Start using CommitTrack
        </Button>
      </div>
    </div>
  );
}
