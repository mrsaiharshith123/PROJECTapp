import { useState, useRef, useEffect, useMemo } from "react";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { useCommitIntel } from "../../../hooks/useCommitIntel.js";
import { useStabilityIntel } from "../../../hooks/useStabilityIntel.js";
import { combinedMonthlyIncome } from "../../../utils/combinedIncome.js";
import { askFinancialAdvisor, buildContextData } from "../../../services/financialAdvisor.js";
import { isFeatureUnlocked } from "../../../constants/subscriptionTiers.js";
import { getTier } from "../../../utils/tierAccess.js";
import { getCityLabel, matchCityFromText, normalizeCityId } from "../../../constants/cityLivingCosts.js";
import { CitySelect } from "../../patterns/CitySelect.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import {
  ProGate,
  Card,
  Caption,
  Body,
  Stack,
  Heading,
  CtIcon,
  inputClassName,
} from "../../index.js";
import { ToolAnswerHero } from "../../patterns/ToolAnswerHero.jsx";

const fieldClass = `${inputClassName()} `;

const SUGGESTED_CHIP_KEYS = [
  "tools.advisor.chip.emi",
  "tools.advisor.chip.score",
  "tools.advisor.chip.runway",
  "tools.advisor.chip.saving",
];

export default function FinancialAdvisorTool() {
  const { t } = useTranslation();
  const { commitments, settings, updateSettings, effectiveSubscriptionTier } = usePerovo();
  const intel = useCommitIntel();
  const stable = useStabilityIntel();
  const income = combinedMonthlyIncome(settings);
  const contextData = useMemo(
    () => buildContextData({ commitments, settings, intel, stable, income }),
    [commitments, settings, intel, stable, income],
  );

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [awaitingCity, setAwaitingCity] = useState(false);
  const [pendingQuestion, setPendingQuestion] = useState("");
  const bottomRef = useRef(null);

  const needsCity = !normalizeCityId(settings.userCity);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, awaitingCity]);

  if (!isFeatureUnlocked("ai_advisor", getTier(settings, effectiveSubscriptionTier))) {
    return <ProGate featureId="ai_advisor">{null}</ProGate>;
  }

  const runAdvisor = async (q) => {
    setLoading(true);
    const { answer, source } = await askFinancialAdvisor({ question: q, contextData });
    setMessages((prev) => [...prev, { role: "advisor", text: answer, source }]);
    setLoading(false);
  };

  const handleSend = async (questionOverride) => {
    const q = (typeof questionOverride === "string" ? questionOverride : input).trim();
    if (!q || loading) return;

    if (awaitingCity) {
      const cityId = matchCityFromText(q) || normalizeCityId(q);
      if (!cityId) {
        setMessages((prev) => [
          ...prev,
          { role: "user", text: q },
          {
            role: "advisor",
            text: t("tools.advisor.cityUnrecognized"),
            source: "local",
          },
        ]);
        return;
      }
      updateSettings({ userCity: cityId });
      setAwaitingCity(false);
      setInput("");
      setMessages((prev) => [
        ...prev,
        { role: "user", text: q },
        {
          role: "advisor",
          text: t("tools.advisor.thanksCity", { city: getCityLabel(cityId) }),
          source: "local",
        },
      ]);
      if (pendingQuestion) {
        const next = pendingQuestion;
        setPendingQuestion("");
        await runAdvisor(next);
      }
      return;
    }

    if (needsCity) {
      setInput("");
      setPendingQuestion(q);
      setAwaitingCity(true);
      setMessages((prev) => [
        ...prev,
        { role: "user", text: q },
        {
          role: "advisor",
          text: t("tools.advisor.askCity"),
          source: "local",
        },
      ]);
      return;
    }

    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: q }]);
    await runAdvisor(q);
  };

  const saveCityFromPicker = async (cityId) => {
    if (!cityId) return;
    updateSettings({ userCity: cityId });
    setAwaitingCity(false);
    setMessages((prev) => [
      ...prev,
      {
        role: "advisor",
        text: t("tools.advisor.citySetContinue", { city: getCityLabel(cityId) }),
        source: "local",
      },
    ]);
    if (pendingQuestion) {
      const next = pendingQuestion;
      setPendingQuestion("");
      await runAdvisor(next);
    }
  };

  return (
    <Card className="ed-stack ed-stack">
      <ToolAnswerHero
        tone="wealth"
        label={t("tools.advisor.heroLabel")}
        value={t("tools.advisor.heroScore", { score: Math.round(intel.health?.score ?? 0) })}
        subtitle={intel.health?.label}
      />
      <div className="ed-settings-row ed-settings-row ed-settings-row-static">
        <span className="ed-row-icon ed-row-icon violet shrink-0" aria-hidden>
          <CtIcon name="chat-dots" size={18} weight="duotone" />
        </span>
        <Heading level={3} className="!text-base min-w-0">
          {t("tools.advisor.title")}
        </Heading>
      </div>

      <div className="ed-stack-sm">
        {(needsCity || awaitingCity) && (
          <div className="ed-inset ed-stack-sm">
            <Caption className="block font-semibold">{t("tools.advisor.yourCity")}</Caption>
            <CitySelect value={settings.userCity || ""} onChange={saveCityFromPicker} />
          </div>
        )}

        {messages.length === 0 && !awaitingCity && !needsCity && (
          <div className="ed-row-wrap">
            {SUGGESTED_CHIP_KEYS.map((key) => (
              <button
                key={key}
                type="button"
                className="ed-chip"
                onClick={() => handleSend(t(key))}
                disabled={loading}
              >
                {t(key)}
              </button>
            ))}
          </div>
        )}

        <Stack className="ed-stack-sm">
          {messages.map((msg, i) => (
            <div
              key={`${msg.role}-${i}`}
              className={
                msg.role === "user" ? "ed-inset ed-inset" : "ed-inset ed-inset-green"
              }
            >
              <Body className="!text-sm">{msg.text}</Body>
              {msg.role === "advisor" && msg.source === "local" && (
                <Caption className="block ed-caption">{t("tools.advisor.offlineTag")}</Caption>
              )}
            </div>
          ))}
          {loading && (
            <div className="ed-inset ed-inset-green">
              <span className="ed-caption" aria-hidden>
                <span />
                <span />
                <span />
              </span>
            </div>
          )}
          <div ref={bottomRef} />
        </Stack>
      </div>

      <div className="ed-stack-sm ed-stack-sm">
        <input
          className={`${fieldClass} ed-textarea`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !loading) handleSend();
          }}
          placeholder={
            awaitingCity ? t("tools.advisor.placeholderCity") : t("tools.advisor.placeholderQuestion")
          }
          disabled={loading}
        />
        <button
          type="button"
          className="ed-btn ed-btn-primary w-full"
          onClick={() => handleSend()}
          disabled={loading || !input.trim()}
        >
          {t("common.send")}
        </button>
      </div>
      <Caption className="block">{t("tools.advisor.disclaimer")}</Caption>
    </Card>
  );
}
