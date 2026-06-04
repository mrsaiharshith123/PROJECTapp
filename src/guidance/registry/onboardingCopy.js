/** Guided onboarding — three experiences (not raw userMode ids). */

export const ONBOARDING_EXPERIENCES = [
  {
    id: "salaried",
    emoji: "💼",
    label: "Salaried",
    tagline: "Personal salary & monthly commitments",
    explain:
      "We'll track paycheck pressure, EMIs, subscriptions, and how much flexibility you keep each month. You can add family scope later in Profile.",
    userMode: "salaried",
    householdScope: "single",
  },
  {
    id: "household",
    emoji: "👨‍👩‍👧",
    label: "Household / Family",
    tagline: "Shared home finances",
    explain:
      "We'll help you see household burden, school fees, renewals, and shared runway — so the whole home feels understandable, not just one paycheck.",
    userMode: "salaried",
    householdScope: "family",
  },
  {
    id: "business",
    emoji: "🏪",
    label: "Business",
    tagline: "Operating cashflow & dues",
    explain:
      "We'll focus on receivables, payables, collection risk, and working capital — not personal salary framing.",
    userMode: "business",
    householdScope: "single",
  },
];

export function getOnboardingExperience(id) {
  return ONBOARDING_EXPERIENCES.find((e) => e.id === id) || ONBOARDING_EXPERIENCES[0];
}
