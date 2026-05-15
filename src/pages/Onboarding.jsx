import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../components/Card";
import { useCommitTrack } from "../context/CommitTrackContext.jsx";
import { USER_MODES } from "../constants/userModes.js";

export default function Onboarding() {
  const navigate = useNavigate();
  const { updateSettings } = useCommitTrack();
  const [step, setStep] = useState(0);
  const [userMode, setUserMode] = useState("salaried");
  const [displayName, setDisplayName] = useState("");
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [businessType, setBusinessType] = useState("");

  const finish = () => {
    updateSettings({
      userMode,
      displayName: displayName.trim(),
      monthlyIncome: monthlyIncome === "" ? 0 : Math.max(0, Number(monthlyIncome) || 0),
      businessType: businessType.trim(),
      onboardingComplete: true,
    });
    navigate("/", { replace: true });
  };

  if (step === 0) {
    return (
      <div className="space-y-6 max-w-lg mx-auto pb-8">
        <div>
          <p className="text-sm text-gray-400 font-medium uppercase tracking-widest">Welcome</p>
          <h1 className="text-3xl font-bold text-gray-900 mt-1" style={{ fontFamily: "'Sora', sans-serif" }}>
            What best describes you?
          </h1>
          <p className="text-sm text-gray-500 mt-2">We tailor menus and tips to your situation. Change anytime in Profile.</p>
        </div>
        <div className="grid gap-3">
          {USER_MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setUserMode(m.id)}
              className={`text-left p-4 rounded-2xl border-2 transition-all ${
                userMode === m.id
                  ? "border-indigo-500 bg-indigo-50"
                  : "border-gray-100 bg-white hover:border-indigo-200"
              }`}
            >
              <span className="text-2xl mr-2">{m.emoji}</span>
              <span className="font-semibold text-gray-900">{m.label}</span>
              <p className="text-xs text-gray-500 mt-1 ml-8">{m.description}</p>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setStep(1)}
          className="w-full py-3.5 bg-indigo-600 text-white font-semibold rounded-2xl"
        >
          Continue
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-lg mx-auto pb-8">
      <div>
        <p className="text-sm text-gray-400 font-medium uppercase tracking-widest">Setup</p>
        <h1 className="text-3xl font-bold text-gray-900 mt-1" style={{ fontFamily: "'Sora', sans-serif" }}>
          A few basics
        </h1>
      </div>
      <Card className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Your name</label>
          <input
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Optional"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Monthly income (₹)</label>
          <input
            type="number"
            min="0"
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm"
            value={monthlyIncome}
            onChange={(e) => setMonthlyIncome(e.target.value)}
            placeholder="Helps pressure & affordability scores"
          />
        </div>
        {userMode === "business" && (
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Business type</label>
            <input
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm"
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
              placeholder="e.g. Retail, services"
            />
          </div>
        )}
      </Card>
      <div className="flex gap-2">
        <button type="button" onClick={() => setStep(0)} className="flex-1 py-3 border border-gray-200 rounded-2xl text-sm font-semibold">
          Back
        </button>
        <button type="button" onClick={finish} className="flex-1 py-3 bg-indigo-600 text-white rounded-2xl text-sm font-semibold">
          Start using CommitTrack
        </button>
      </div>
    </div>
  );
}
