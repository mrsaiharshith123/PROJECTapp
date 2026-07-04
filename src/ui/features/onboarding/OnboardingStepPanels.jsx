import { Card, Button, Eyebrow, Caption, Body, ToneSurface } from "../../index.js";
import { ONBOARDING_EXPERIENCES } from "../../../guidance/index.js";
import { routerBasename } from "../../../utils/basePath.js";
import { getCategoryById } from "../../../constants/categories.js";
import { CtIcon } from "../../icons/CtIcon.jsx";
import { QUICK_COMMITMENT_TEMPLATES } from "../../../utils/onboardingTemplates.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { CitySelect } from "../../patterns/CitySelect.jsx";

export function OnboardingProgress({ step, total = 4 }) {
  const { t } = useTranslation();
  return (
    <div className="mb-4">
      <div className="ed-onboard-dots" aria-hidden>
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={`ed-onboard-dot ${i === step ? "active" : ""}`} />
        ))}
      </div>
      <Caption className="block text-center mt-2">{t("onboarding.stepOf", { current: step + 1, total })}</Caption>
    </div>
  );
}

export function OnboardingModeStep({
  replay,
  experienceId,
  onExperienceChange,
  onContinue,
  onCancel,
  userId,
  onRecordConsent,
}) {
  const { t } = useTranslation();
  const titlePrefix = replay ? t("onboarding.review") : t("onboarding.welcome");

  return (
    <div className="ed-page-shell">
      <div className="ed-inset">
        <p className="ed-field-label">{titlePrefix}</p>
        <h1 className="ed-page-shell-title !mt-1">{replay ? t("onboarding.modeReplayTitle") : t("onboarding.title")}</h1>
        <Caption className="block mt-2 relative">
          {replay ? t("onboarding.modeReplaySubtitle") : t("onboarding.subtitle")}
        </Caption>
      </div>
      <div className="ed-stack">
        {ONBOARDING_EXPERIENCES.filter((m) => !m.hidden).map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => onExperienceChange(m.id)}
            className={`ed-inset w-full !text-left ${experienceId === m.id ? "ed-inset-active" : ""}`}
          >
            <span className="flex items-start gap-3">
              <span className="ed-row-icon shrink-0" aria-hidden>
                <CtIcon name={m.icon} size={22} />
              </span>
              <span className="min-w-0">
                <span className="block font-semibold">{m.label}</span>
                <Caption className="block mt-1">{m.tagline}</Caption>
              </span>
            </span>
          </button>
        ))}
      </div>
      <ToneSurface tone="info">
        <Caption className="font-semibold block">{t("onboarding.beforeBegin")}</Caption>
        <Body className="!text-sm mt-1">{t("onboarding.privacyNote")}</Body>
        <button
          type="button"
          className="ed-link !text-xs mt-2"
          onClick={() => {
            const base = routerBasename() ? `${routerBasename()}/privacy` : "/privacy";
            window.open(base, "_blank", "noopener,noreferrer");
          }}
        >
          {t("onboarding.privacyPolicyLink")}
        </button>
      </ToneSurface>
      <div className="flex gap-2">
        {replay && (
          <Button type="button" variant="outline" size="lg" className="flex-1" onClick={onCancel}>
            {t("common.cancel")}
          </Button>
        )}
        <Button
          type="button"
          variant="primary"
          size="lg"
          className={replay ? "flex-1" : "w-full"}
          onClick={() => {
            onRecordConsent(userId || "anonymous");
            onContinue();
          }}
        >
          {t("common.continue")}
        </Button>
      </div>
    </div>
  );
}

export function OnboardingFocusStep({ experience, onBack, onContinue }) {
  const { t } = useTranslation();
  return (
    <div className="ed-page-shell">
      <div className="ed-inset">
        <Eyebrow>{experience.label}</Eyebrow>
        <h1 className="ed-page-shell-title">{t("onboarding.focusTitle")}</h1>
        <Card variant="flat" className="ed-inset mt-3">
          <Body className="!text-sm">{experience.explain}</Body>
        </Card>
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="lg" className="flex-1" onClick={onBack}>
          {t("common.back")}
        </Button>
        <Button type="button" variant="primary" size="lg" className="flex-1" onClick={onContinue}>
          {t("common.continue")}
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
  userCity,
  onUserCityChange,
  fieldError,
  fieldClass,
  onBack,
  onContinue,
}) {
  const { t } = useTranslation();

  return (
    <div className="ed-page-shell">
      <div className="ed-inset">
        <Eyebrow>{t("onboarding.setupEyebrow")}</Eyebrow>
        <h1 className="ed-page-shell-title">
          {replay ? t("onboarding.basicsTitleReplay") : t("onboarding.basicsTitle")}
        </h1>
        <Caption className="block mt-2">{t("onboarding.basicsRequired")}</Caption>
      </div>
      <Card className="ed-stack ed-inset">
        <div>
          <label className="ed-field-label">{t("onboarding.nameLabel")}</label>
          <input className={fieldClass} value={displayName} onChange={(e) => onDisplayNameChange(e.target.value)} required />
        </div>
        <div>
          <label className="ed-field-label">{t("onboarding.mobileLabel")}</label>
          <input
            type="tel"
            className={fieldClass}
            value={phoneNumber}
            onChange={(e) => onPhoneNumberChange(e.target.value)}
            placeholder={t("onboarding.mobilePlaceholder")}
            inputMode="numeric"
            required
          />
        </div>
        <div>
          <label className="ed-field-label">{t("onboarding.salaryLabel")}</label>
          <input
            type="number"
            min="1"
            className={fieldClass}
            value={monthlyIncome}
            onChange={(e) => onMonthlyIncomeChange(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="ed-field-label">{t("profile.userCity")} *</label>
          <CitySelect value={userCity} onChange={onUserCityChange} required />
          <Caption className="block mt-1">{t("profile.userCityHint")}</Caption>
        </div>
      </Card>
      {fieldError && <Caption className="block text-[var(--ed-red)]">{fieldError}</Caption>}
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="lg" className="flex-1" onClick={onBack}>
          {t("common.back")}
        </Button>
        <Button type="button" variant="primary" size="lg" className="flex-1" onClick={onContinue}>
          {t("common.continue")}
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
    <div className="ed-page-shell">
      <div className="ed-inset">
        <Eyebrow>{t("onboarding.initialSetupEyebrow")}</Eyebrow>
        <h1 className="ed-page-shell-title">{t("onboarding.billsTitle")}</h1>
        <Caption className="block mt-2">{t("onboarding.billsSubtitle")}</Caption>
      </div>
      <div className="ed-grid-2">
        {QUICK_COMMITMENT_TEMPLATES.map((tpl) => {
          const active = selectedLabels.has(tpl.label);
          return (
            <button
              key={tpl.label}
              type="button"
              onClick={() => onToggleTemplate(tpl.label)}
              className={`ed-inset !text-left ${active ? "ed-inset-active" : ""}`}
            >
              <span className="flex items-center gap-2">
                <CtIcon name={getCategoryById(tpl.category).icon} size={20} />
                <span className="font-semibold text-sm">{tpl.label}</span>
              </span>
            </button>
          );
        })}
      </div>
      {selectedLabels.size > 0 && (
        <Card className="ed-stack-sm ed-inset">
          {QUICK_COMMITMENT_TEMPLATES.filter((tpl) => selectedLabels.has(tpl.label)).map((tpl) => (
            <div key={tpl.label}>
              <label className="ed-field-label">{t("onboarding.billsAmountLabel", { label: tpl.label })}</label>
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
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="lg" className="flex-1" onClick={onBack}>
          {t("common.back")}
        </Button>
        <Button type="button" variant="outline" size="lg" className="flex-1" onClick={onSkip}>
          {t("common.skip")}
        </Button>
        <Button type="button" variant="primary" size="lg" className="flex-1" onClick={onFinishSelected}>
          {t("onboarding.addSelectedStart")}
        </Button>
      </div>
    </div>
  );
}
