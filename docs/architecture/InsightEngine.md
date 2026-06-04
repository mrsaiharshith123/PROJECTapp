# Insight engine

Registry: `src/governance/registries/insights.js`

## Producers

| Module | Domain |
|--------|--------|
| `intelligence.js` | Core dashboard insights |
| `insightsExtended.js` | Extended interpretations |
| `pressureIntelligence.js` | Pressure / burden narrative |
| `pressureAdvanced.js` | Advanced pressure scenarios |
| `stabilityNarrative.js` | Forecast + plan copy |
| `subscriptionLeak.js` | Subscription waste |
| `financialHealth.js` | Health score messaging |
| `notifications.js` | Reminder feed + severity |

## Severity tones

Canonical tones: `critical`, `warning`, `caution`, `neutral`, `positive`.

Notifications map urgency: `critical`, `high`, `normal`, `low`.

Keep severity semantics aligned between notifications and intelligence — `npm run audit:insights`.

## UI surfacing

- **Financial pulse** — pressure + tips on Home
- **Notification panel** — contextual reminders
- **Analytics** — charts + paycheck breakdown

## Rules

- No duplicate insight builders for the same metric — extend existing engine.
- Calculations stay in engines; JSX only displays `insight.text` / `tone`.
