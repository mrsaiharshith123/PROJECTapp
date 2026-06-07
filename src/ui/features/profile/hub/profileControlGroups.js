export const PROFILE_CONTROL_GROUPS = [
  {
    id: "account",
    icon: "user",
    titleKey: "profileHub.group.account",
    hintKey: "profileHub.group.accountHint",
    panels: ["personal-identity", "personal-account"],
  },
  {
    id: "financial",
    icon: "currency-inr",
    titleKey: "profileHub.group.financial",
    hintKey: "profileHub.group.financialHint",
    panels: ["personal-money", "history"],
  },
  {
    id: "notifications",
    icon: "bell",
    titleKey: "profileHub.group.notifications",
    hintKey: "profileHub.group.notificationsHint",
    panels: ["notifications"],
  },
  {
    id: "privacy",
    icon: "lock",
    titleKey: "profileHub.group.privacy",
    hintKey: "profileHub.group.privacyHint",
    panels: ["backup"],
    privacyLink: true,
  },
  {
    id: "appearance",
    icon: "palette",
    titleKey: "profileHub.group.appearance",
    hintKey: "profileHub.group.appearanceHint",
    panels: ["personal-appearance"],
  },
  {
    id: "help",
    icon: "chat-circle",
    titleKey: "profileHub.group.help",
    hintKey: "profileHub.group.helpHint",
    panels: ["guide", "support"],
  },
];

/** @param {string | null} openId */
export function profileGroupForPanel(openId) {
  if (!openId) return null;
  return PROFILE_CONTROL_GROUPS.find((g) => g.panels.includes(openId)) || null;
}
