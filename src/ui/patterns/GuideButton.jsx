import { useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, ArrowRight, Lightbulb } from "@phosphor-icons/react";
import { useTranslation } from "../../i18n/I18nProvider.js";
import { cn } from "../utils/cn.js";

/**
 * @param {{
 *   label?: string,
 *   labelKey?: string,
 *   steps?: Array<{
 *     selector: string,
 *     title?: string,
 *     titleKey?: string,
 *     text?: string,
 *     textKey?: string,
 *   }>,
 * }} props
 */
export function GuideButton({ label, labelKey = "help.guideLabel", steps = [] }) {
  const { t } = useTranslation();
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [highlight, setHighlight] = useState(null);

  const applyHighlight = useCallback(
    (stepIndex) => {
      const { selector } = steps[stepIndex] || {};
      if (!selector) return;
      const el = document.querySelector(selector);
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      const rect = el.getBoundingClientRect();
      setHighlight({
        top: rect.top + window.scrollY - 8,
        left: rect.left - 8,
        width: rect.width + 16,
        height: rect.height + 16,
      });
    },
    [steps],
  );

  const goToStep = useCallback(
    (index) => {
      setStep(index);
      requestAnimationFrame(() => applyHighlight(index));
    },
    [applyHighlight],
  );

  if (!steps.length) return null;

  const handleStart = () => {
    setActive(true);
    goToStep(0);
  };
  const handleNext = () => {
    if (step < steps.length - 1) goToStep(step + 1);
    else {
      setActive(false);
      setHighlight(null);
    }
  };
  const handleClose = () => {
    setActive(false);
    setHighlight(null);
  };

  const currentStep = steps[step] ?? { selector: "" };
  const title = currentStep.titleKey ? t(currentStep.titleKey) : currentStep.title;
  const text = currentStep.textKey ? t(currentStep.textKey) : currentStep.text;
  const btnLabel = labelKey ? t(labelKey) : label || t("help.guideLabel");

  const overlay =
    active && typeof document !== "undefined" ? (
      <div className="ct-guide-overlay">
        {highlight ? (
          <div
            className="ct-guide-highlight"
            style={{
              top: highlight.top,
              left: highlight.left,
              width: highlight.width,
              height: highlight.height,
            }}
          />
        ) : null}
        <div className="ct-guide-panel">
          <div className="ct-guide-panel-head">
            <span className="ct-guide-step-label">
              {t("help.guideStepOf", { current: step + 1, total: steps.length })}
            </span>
            <button type="button" className="ct-guide-close" onClick={handleClose} aria-label={t("common.close")}>
              <X size={16} />
            </button>
          </div>
          <div className="ct-guide-panel-title">{title}</div>
          <div className="ct-guide-panel-text">{text}</div>
          <div className="ct-guide-panel-foot">
            <div className="ct-guide-dots">
              {steps.map((_, i) => (
                <div key={i} className={cn("ct-guide-dot", i === step && "ct-guide-dot-active")} />
              ))}
            </div>
            <button type="button" className="ct-btn ct-btn-primary ct-btn-sm" onClick={handleNext}>
              {step < steps.length - 1 ? (
                <>
                  <ArrowRight size={14} />
                  {t("help.guideNext")}
                </>
              ) : (
                t("help.guideDone")
              )}
            </button>
          </div>
        </div>
      </div>
    ) : null;

  return (
    <>
      <button type="button" className="ct-guide-btn" onClick={handleStart}>
        <Lightbulb size={14} weight="fill" />
        {btnLabel}
      </button>
      {overlay ? createPortal(overlay, document.body) : null}
    </>
  );
}

export default GuideButton;
