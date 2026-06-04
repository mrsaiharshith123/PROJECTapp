/** Guided onboarding — salaried single or household. */

export const ONBOARDING_EXPERIENCES = [
  {
    id: "salaried",
    emoji: "💼",
    label: "Salaried",
    tagline: "Personal salary & monthly commitments",
    explain:
      "We'll track paycheck pressure, EMIs, subscriptions, and how much flexibility you keep each month.",
    userMode: "salaried",
    householdScope: "single",
  },
  {
    id: "household",
    emoji: "👨‍👩‍👧",
    label: "Household / Family",
    tagline: "Shared home finances",
    explain:
      "We'll help you see household burden, school fees, renewals, and shared runway — so the whole home feels understandable.",
    userMode: "salaried",
    householdScope: "family",
  },
];

export function getOnboardingExperience(id) {
  return ONBOARDING_EXPERIENCES.find((e) => e.id === id) || ONBOARDING_EXPERIENCES[0];
}
