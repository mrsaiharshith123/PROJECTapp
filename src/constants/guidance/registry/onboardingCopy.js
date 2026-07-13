/** Guided onboarding — salaried individual finances. */

export const ONBOARDING_EXPERIENCES = [
  {
    id: "salaried",
    icon: "briefcase",
    label: "Salaried",
    tagline: "Personal salary and monthly commitments",
    explain:
      "Perovo tracks paycheck pressure, EMIs, subscriptions, and monthly financial flexibility.",
    userMode: "salaried",
  },
];

export function getOnboardingExperience(id) {
  return ONBOARDING_EXPERIENCES.find((e) => e.id === id) || ONBOARDING_EXPERIENCES[0];
}
