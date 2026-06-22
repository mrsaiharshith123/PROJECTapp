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

const fieldClass = `${inputClassName()} ct-input-tint`;

const SUGGESTED_CHIP_KEYS = [
  "tools.advisor.chip.emi",
  "tools.advisor.chip.score",
  "tools.advisor.chip.runway",
  "tools.advisor.chip.saving",
];

export default function FinancialAdvisorTool() {
  const { t } = useTranslation();
  const { commitments, settings, updateSettings } = usePerovo();
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

  if (!isFeatureUnlocked("ai_advisor", getTier(settings))) {
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
    <Card className="ct-stack ct-advisor-tool">
      <ToolAnswerHero
        tone="wealth"
        label={t("tools.advisor.heroLabel")}
        value={t("tools.advisor.heroScore", { score: Math.round(intel.health?.score ?? 0) })}
        subtitle={intel.health?.label}
      />
      <div className="ct-settings-row ct-settings-row-static">
        <span className="ct-icon-tile ct-icon-tile-sm violet shrink-0" aria-hidden>
          <CtIcon name="chat-dots" size={18} weight="duotone" />
        </span>
        <Heading level={3} className="!text-base min-w-0">
          {t("tools.advisor.title")}
        </Heading>
      </div>

      <div className="ct-advisor-messages">
        {(needsCity || awaitingCity) && (
          <div className="ct-stat-tile indigo ct-stack-sm">
            <Caption className="block font-semibold">{t("tools.advisor.yourCity")}</Caption>
            <CitySelect value={settings.userCity || ""} onChange={saveCityFromPicker} />
          </div>
        )}

        {messages.length === 0 && !awaitingCity && !needsCity && (
          <div className="ct-advisor-chips">
            {SUGGESTED_CHIP_KEYS.map((key) => (
              <button
                key={key}
                type="button"
                className="ct-chip"
                onClick={() => handleSend(t(key))}
                disabled={loading}
              >
                {t(key)}
              </button>
            ))}
          </div>
        )}

        <Stack className="ct-advisor-thread">
          {messages.map((msg, i) => (
            <div
              key={`${msg.role}-${i}`}
              className={
                msg.role === "user" ? "ct-advisor-msg ct-advisor-msg-user" : "ct-advisor-msg ct-advisor-msg-advisor"
              }
            >
              <Body className="!text-sm">{msg.text}</Body>
              {msg.role === "advisor" && msg.source === "local" && (
                <Caption className="block ct-advisor-offline">{t("tools.advisor.offlineTag")}</Caption>
              )}
            </div>
          ))}
          {loading && (
            <div className="ct-advisor-msg ct-advisor-msg-advisor">
              <span className="ct-advisor-dots" aria-hidden>
                <span />
                <span />
                <span />
              </span>
            </div>
          )}
          <div ref={bottomRef} />
        </Stack>
      </div>

      <div className="ct-advisor-input-row ct-stack-sm">
        <input
          className={`${fieldClass} ct-advisor-input`}
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
          className="ct-btn ct-btn-primary w-full"
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
