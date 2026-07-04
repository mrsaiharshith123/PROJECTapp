import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { inputClassName } from "../../";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { useAuth } from "../../../context/AuthContext.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { recordConsent } from "../../../utils/dpdpConsent.js";
import { getOnboardingExperience } from "../../../guidance/index.js";
import { ONBOARDING_EXPERIENCES } from "../../../guidance/registry/onboardingCopy.js";
import { templateToCommitment, QUICK_COMMITMENT_TEMPLATES } from "../../../utils/onboardingTemplates.js";
import { normalizeIndianPhone } from "../../../utils/phone.js";
import { validateOnboardingFields } from "../../../utils/profileSetup.js";
import { trackEvent } from "../../../services/analytics/trackEvent.js";
import { ANALYTICS_EVENTS } from "../../../services/analytics/eventNames.js";
import { Caption } from "../../index.js";
import {
  OnboardingModeStep,
  OnboardingFocusStep,
  OnboardingBasicsStep,
  OnboardingBillsStep,
} from "../onboarding/OnboardingStepPanels.jsx";

function experienceIdFromSettings() {
  return "salaried";
}

export default function Onboarding() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const replay = searchParams.get("replay") === "1";
  const { settings, updateSettings, addCommitment } = usePerovo();
  const { saveProfile, profile, user } = useAuth();
  const [step, setStep] = useState(0);
  const [experienceId, setExperienceId] = useState(() => experienceIdFromSettings());
  const [displayName, setDisplayName] = useState(
    () => settings.displayName || profile?.display_name || "",
  );
  const [phoneNumber, setPhoneNumber] = useState(
    () => settings.phoneNumber || profile?.phone || "",
  );
  const [monthlyIncome, setMonthlyIncome] = useState(() =>
    settings.monthlyIncome ? String(settings.monthlyIncome) : profile?.monthly_income ? String(profile.monthly_income) : "",
  );
  const [userCity, setUserCity] = useState(() => settings.userCity || "");
  const [selectedLabels, setSelectedLabels] = useState(() => new Set());
  const [amounts, setAmounts] = useState(() => ({}));
  const [fieldError, setFieldError] = useState("");
  const fieldClass = `${inputClassName()} `;

  const experience = getOnboardingExperience(experienceId);
  void ONBOARDING_EXPERIENCES;

  useEffect(() => {
    trackEvent(ANALYTICS_EVENTS.ONBOARDING_STEP, {
      module: "onboarding",
      step: String(step),
      properties: { experience: experienceId },
    });
  }, [step, experienceId]);

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
    if (!userCity) return "Select the city you live in — we use it for survival runway estimates.";
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
      displayName: displayName.trim(),
      phoneNumber: normalizeIndianPhone(phoneNumber),
      monthlyIncome: incomeNum,
      userCity,
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
        monthly_income: payload.monthlyIncome,
        onboarding_complete: true,
      });
    } catch {
      // Ignore profile sync errors to avoid blocking onboarding.
    }
    trackEvent(ANALYTICS_EVENTS.ONBOARDING_COMPLETE, {
      module: "onboarding",
      properties: { experience: experienceId, bills_added: selectedLabels.size },
    });
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
      userCity,
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
    for (const tpl of QUICK_COMMITMENT_TEMPLATES) {
      if (!selectedLabels.has(tpl.label)) continue;
      const amt = amounts[tpl.label] ?? tpl.defaultAmount;
      addCommitment(templateToCommitment(tpl, amt));
    }
    finish();
  };

  const wrapStep = (panel) => (
    <div className="ed-page ed-page-shell pb-8">
      <div className="ed-inset mb-4 py-3 px-3 text-center">
        <div className="ed-onboard-dots" aria-hidden>
          {Array.from({ length: 4 }, (_, i) => (
            <span key={i} className={`ed-onboard-dot ${i === step ? "active" : ""}`} />
          ))}
        </div>
        <Caption className="block mt-2">{t("onboarding.stepOf", { current: step + 1, total: 4 })}</Caption>
      </div>
      {panel}
    </div>
  );

  if (step === 0) {
    return wrapStep(
      <OnboardingModeStep
        replay={replay}
        experienceId={experienceId}
        onExperienceChange={setExperienceId}
        onContinue={() => setStep(1)}
        onCancel={() => navigate(-1)}
        userId={user?.id}
        onRecordConsent={recordConsent}
      />,
    );
  }

  if (step === 1) {
    return wrapStep(
      <OnboardingFocusStep
        experience={experience}
        onBack={() => setStep(0)}
        onContinue={() => setStep(2)}
      />,
    );
  }

  if (step === 2) {
    return wrapStep(
      <OnboardingBasicsStep
        replay={replay}
        displayName={displayName}
        onDisplayNameChange={setDisplayName}
        phoneNumber={phoneNumber}
        onPhoneNumberChange={setPhoneNumber}
        monthlyIncome={monthlyIncome}
        onMonthlyIncomeChange={setMonthlyIncome}
        userCity={userCity}
        onUserCityChange={setUserCity}
        fieldError={fieldError}
        fieldClass={fieldClass}
        onBack={() => setStep(1)}
        onContinue={goToBillsStep}
      />,
    );
  }

  if (step === 3) {
    return wrapStep(
      <OnboardingBillsStep
        selectedLabels={selectedLabels}
        amounts={amounts}
        fieldClass={fieldClass}
        onToggleTemplate={toggleTemplate}
        onAmountChange={(label, value) => setAmounts((prev) => ({ ...prev, [label]: value }))}
        onBack={() => setStep(2)}
        onSkip={finish}
        onFinishSelected={addSelectedAndFinish}
      />,
    );
  }

  return null;
}
