import { useState, useRef, useEffect, useMemo } from "react";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import { useCommitIntel } from "../../../hooks/useCommitIntel.js";
import { useStabilityIntel } from "../../../hooks/useStabilityIntel.js";
import { combinedMonthlyIncome } from "../../../utils/combinedIncome.js";
import { askFinancialAdvisor, buildContextData } from "../../../services/financialAdvisor.js";
import { isFeatureUnlocked } from "../../../constants/subscriptionTiers.js";
import { getCityLabel, matchCityFromText, normalizeCityId } from "../../../constants/cityLivingCosts.js";
import { CitySelect } from "../../patterns/CitySelect.jsx";
import {
  ProGate,
  Card,
  Button,
  Caption,
  Body,
  Stack,
  Heading,
  CtIcon,
} from "../../index.js";

const SUGGESTED_CHIPS = [
  "Can I afford a ₹10,000 EMI?",
  "What's hurting my score most?",
  "How long can I survive without income?",
  "Am I saving enough?",
];

export default function FinancialAdvisorTool() {
  const { commitments, settings, updateSettings } = useCommitTrack();
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

  if (!isFeatureUnlocked("ai_advisor", settings.subscriptionTier)) {
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
            text: "I did not recognise that city. Pick from the list below or type a major city name (e.g. Hyderabad, Mumbai). Educational only.",
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
          text: `Thanks — I'll use ${getCityLabel(cityId)} for living-cost estimates.`,
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
          text: "Which city do you live in? I need this for survival runway and daily spend benchmarks. Educational only.",
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
        text: `City set to ${getCityLabel(cityId)}. Ask your question again or continue below. Educational only.`,
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
      <div className="ct-row" style={{ gap: "0.5rem", alignItems: "center" }}>
        <CtIcon name="chat-dots" context="tile" size={22} />
        <Heading level={3} className="!text-base">
          Ask your finances
        </Heading>
      </div>

      <div className="ct-advisor-messages">
        {(needsCity || awaitingCity) && (
          <div className="ct-inset ct-stack-sm">
            <Caption className="block font-semibold">Your city</Caption>
            <CitySelect value={settings.userCity || ""} onChange={saveCityFromPicker} />
          </div>
        )}

        {messages.length === 0 && !awaitingCity && !needsCity && (
          <div className="ct-advisor-chips">
            {SUGGESTED_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                className="ct-chip"
                onClick={() => handleSend(chip)}
                disabled={loading}
              >
                {chip}
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
                <Caption className="block ct-advisor-offline">(offline analysis)</Caption>
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

      <div className="ct-advisor-input-row">
        <input
          className="ct-input ct-advisor-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !loading) handleSend();
          }}
          placeholder={
            awaitingCity ? "Type your city…" : "Ask about affordability, pressure, or runway…"
          }
          disabled={loading}
        />
        <Button type="button" variant="primary" onClick={() => handleSend()} disabled={loading || !input.trim()}>
          Ask
        </Button>
      </div>
      <Caption className="block">Educational only. Not financial advice.</Caption>
    </Card>
  );
}
