import { Card, Button, Eyebrow, Caption, Body, ToneSurface } from "../../index.js";
import { ONBOARDING_EXPERIENCES } from "../../../guidance/index.js";
import { routerBasename } from "../../../utils/basePath.js";
import { getCategoryById } from "../../../constants/categories.js";
import { CtIcon } from "../../icons/CtIcon.jsx";
import { QUICK_COMMITMENT_TEMPLATES } from "../../../utils/onboardingTemplates.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";

export function OnboardingModeStep({
  replay,
  experienceId,
  onExperienceChange,
  onContinue,
  onCancel,
  userId,
  onRecordConsent,
}) {
  const titlePrefix = replay ? "Review" : "Welcome";

  return (
    <div className="ct-onboard-page">
      <div>
        <Eyebrow>{titlePrefix}</Eyebrow>
        <h1 className="ct-onboard-title">{replay ? "Your CommitTrack mode" : "How do you manage money?"}</h1>
        <Caption className="block mt-2">
          {replay
            ? "Update how we explain your dashboard. Your bills stay on this account."
            : "Select the option that best matches your situation. Explanations can be updated in Profile."}
        </Caption>
      </div>
      <div className="ct-stack">
        {ONBOARDING_EXPERIENCES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => onExperienceChange(m.id)}
            className={`ct-option-card ${experienceId === m.id ? "ct-option-card-active" : ""}`}
          >
            <span className="inline-flex mr-2 shrink-0">
              <CtIcon name={m.icon} size={24} />
            </span>
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
          <Button type="button" variant="outline" size="lg" className="flex-1" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button
          type="button"
          variant="primary"
          size="lg"
          className={replay ? "flex-1" : ""}
          onClick={() => {
            onRecordConsent(userId || "anonymous");
            onContinue();
          }}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}

export function OnboardingFocusStep({ experience, onBack, onContinue }) {
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
        <Button type="button" variant="outline" size="lg" className="flex-1" onClick={onBack}>
          Back
        </Button>
        <Button type="button" variant="primary" size="lg" className="flex-1" onClick={onContinue}>
          Continue
        </Button>
      </div>
    </div>
  );
}

export function OnboardingBasicsStep({
  replay,
  displayName,
  onDisplayNameChange,
  phoneNumber,
  onPhoneNumberChange,
  monthlyIncome,
  onMonthlyIncomeChange,
  fieldError,
  fieldClass,
  onBack,
  onContinue,
}) {
  const { t } = useTranslation();

  return (
    <div className="ct-onboard-page">
      <div>
        <Eyebrow>{t("onboarding.setupEyebrow")}</Eyebrow>
        <h1 className="ct-onboard-title">{replay ? "Update basics" : "Confirm your details"}</h1>
        <Caption className="block mt-2">Name, mobile, and salary are required to use CommitTrack.</Caption>
      </div>
      <Card className="ct-stack">
        <div>
          <label className="ct-field-label">Your name *</label>
          <input className={fieldClass} value={displayName} onChange={(e) => onDisplayNameChange(e.target.value)} required />
        </div>
        <div>
          <label className="ct-field-label">Mobile number *</label>
          <input
            type="tel"
            className={fieldClass}
            value={phoneNumber}
            onChange={(e) => onPhoneNumberChange(e.target.value)}
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
            className={fieldClass}
            value={monthlyIncome}
            onChange={(e) => onMonthlyIncomeChange(e.target.value)}
            required
          />
        </div>
      </Card>
      {fieldError && <Caption className="block text-[var(--ct-danger)]">{fieldError}</Caption>}
      <div className="ct-row">
        <Button type="button" variant="outline" size="lg" className="flex-1" onClick={onBack}>
          Back
        </Button>
        <Button type="button" variant="primary" size="lg" className="flex-1" onClick={onContinue}>
          Continue
        </Button>
      </div>
    </div>
  );
}

export function OnboardingBillsStep({
  selectedLabels,
  amounts,
  fieldClass,
  onToggleTemplate,
  onAmountChange,
  onBack,
  onSkip,
  onFinishSelected,
}) {
  const { t } = useTranslation();

  return (
    <div className="ct-onboard-page">
      <div>
        <Eyebrow>{t("onboarding.initialSetupEyebrow")}</Eyebrow>
        <h1 className="ct-onboard-title">What do you pay regularly?</h1>
        <Caption className="block mt-2">
          Optional — tap bills or EMIs you want to add now. You can skip and add them later.
        </Caption>
      </div>
      <div className="ct-grid-2">
        {QUICK_COMMITMENT_TEMPLATES.map((tpl) => {
          const active = selectedLabels.has(tpl.label);
          return (
            <button
              key={tpl.label}
              type="button"
              onClick={() => onToggleTemplate(tpl.label)}
              className={`ct-option-card ${active ? "ct-option-card-active" : ""}`}
            >
              <span className="inline-flex mr-2 shrink-0">
                <CtIcon name={getCategoryById(tpl.category).icon} size={20} />
              </span>
              <span className="font-semibold text-sm">{tpl.label}</span>
            </button>
          );
        })}
      </div>
      {selectedLabels.size > 0 && (
        <Card className="ct-stack-sm">
          {QUICK_COMMITMENT_TEMPLATES.filter((tpl) => selectedLabels.has(tpl.label)).map((tpl) => (
            <div key={tpl.label}>
              <label className="ct-field-label">{tpl.label} (₹/mo)</label>
              <input
                type="number"
                min="0"
                className={fieldClass}
                value={amounts[tpl.label] ?? tpl.defaultAmount}
                onChange={(e) => onAmountChange(tpl.label, Math.max(0, Number(e.target.value) || 0))}
              />
            </div>
          ))}
        </Card>
      )}
      <div className="ct-row">
        <Button type="button" variant="outline" size="lg" className="flex-1" onClick={onBack}>
          Back
        </Button>
        <Button type="button" variant="outline" size="lg" className="flex-1" onClick={onSkip}>
          Skip
        </Button>
        <Button type="button" variant="primary" size="lg" className="flex-1" onClick={onFinishSelected}>
          Add selected & start
        </Button>
      </div>
    </div>
  );
}
