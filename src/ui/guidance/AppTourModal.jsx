import { useState } from "react";
import { getAppTourSteps } from "../../guidance/registry/appTour.js";
import { Modal } from "../primitives/Modal.jsx";
import { Button } from "../primitives/Button.jsx";
import { Body, Caption, Eyebrow } from "../primitives/Text.jsx";
import { useTranslation } from "../../i18n/I18nProvider.js";

function AppTourSteps({ settings, onComplete, onDismiss }) {
  const { t } = useTranslation();
  const steps = getAppTourSteps(settings);
  const [index, setIndex] = useState(0);
  const step = steps[index];
  const last = index >= steps.length - 1;

  const close = () => onDismiss();
  const finish = () => onComplete();
  const next = () => {
    if (last) finish();
    else setIndex((i) => i + 1);
  };

  return (
    <Modal
      title={t("tour.title")}
      onClose={close}
      footer={
        <div className="ct-row-between ct-gap-sm">
          <Caption>
            {t("tour.stepOf", { current: index + 1, total: steps.length })}
          </Caption>
          <div className="ct-row ct-gap-sm">
            {!last && (
              <Button type="button" variant="ghost" size="sm" onClick={finish}>
                {t("tour.skip")}
              </Button>
            )}
            <Button type="button" variant="primary" size="sm" onClick={next}>
              {last ? t("tour.close") : t("tour.next")}
            </Button>
          </div>
        </div>
      }
    >
      <div className="ct-stack">
        <Eyebrow>{step.id.replace(/-/g, " ")}</Eyebrow>
        <Body className="font-semibold !text-base">{step.title}</Body>
        <Body className="!text-sm opacity-90">{step.body}</Body>
        {step.tip && <Caption className="block ct-guidance-tour-tip">{step.tip}</Caption>}
      </div>
    </Modal>
  );
}

/**
 * Calm step-by-step app guide (not a blocking corporate tour).
 * @param {{ settings: object, open: boolean, onComplete: () => void, onDismiss: () => void }} props
 */
export function AppTourModal({ settings, open, onComplete, onDismiss }) {
  if (!open) return null;
  const steps = getAppTourSteps(settings);
  if (steps.length === 0) return null;

  const tourKey = `${settings.userMode}-${settings.householdScope}-${settings.appGuideComplete}`;
  return <AppTourSteps key={tourKey} settings={settings} onComplete={onComplete} onDismiss={onDismiss} />;
}
