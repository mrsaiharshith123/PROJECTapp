/** Guided onboarding — salaried single or household. */

export const ONBOARDING_EXPERIENCES = [
  {
    id: "salaried",
    icon: "briefcase",
    label: "Salaried",
    tagline: "Personal salary and monthly commitments",
    explain:
      "Perovo tracks paycheck pressure, EMIs, subscriptions, and monthly financial flexibility.",
    userMode: "salaried",
    householdScope: "single",
  },
  {
    id: "household",
    icon: "users-three",
    label: "Household / Family",
    tagline: "Shared home finances",
    explain:
      "Perovo shows household burden, school fees, renewals, and shared runway for clearer household review.",
    userMode: "salaried",
    householdScope: "family",
    hidden: true,
  },
];

export function getOnboardingExperience(id) {
  return ONBOARDING_EXPERIENCES.find((e) => e.id === id) || ONBOARDING_EXPERIENCES[0];
}
