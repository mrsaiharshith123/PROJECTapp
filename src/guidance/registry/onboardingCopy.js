/** Guided onboarding — salaried single or household. */

export const ONBOARDING_EXPERIENCES = [
  {
    id: "salaried",
    emoji: "💼",
    label: "Salaried",
    tagline: "Personal salary and monthly commitments",
    explain:
      "CommitTrack tracks paycheck pressure, EMIs, subscriptions, and monthly financial flexibility.",
    userMode: "salaried",
    householdScope: "single",
  },
  {
    id: "household",
    emoji: "👨‍👩‍👧",
    label: "Household / Family",
    tagline: "Shared home finances",
    explain:
      "CommitTrack shows household burden, school fees, renewals, and shared runway for clearer household review.",
    userMode: "salaried",
    householdScope: "family",
  },
];

export function getOnboardingExperience(id) {
  return ONBOARDING_EXPERIENCES.find((e) => e.id === id) || ONBOARDING_EXPERIENCES[0];
}
