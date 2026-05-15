/** Shared user mode config (Blueprint role-based OS). */
export const USER_MODE_IDS = ["salaried", "business", "freelancer", "family", "student", "power"];

export const USER_MODES = [
  {
    id: "salaried",
    label: "Salaried",
    emoji: "💼",
    description: "EMIs, subscriptions, and salary pressure.",
    navPaths: ["/", "/commitments", "/add", "/lending", "/analytics", "/tools", "/profile"],
    showLending: true,
    showAffordabilityOnAdd: true,
  },
  {
    id: "business",
    label: "Business owner",
    emoji: "🏪",
    description: "Cashflow, receivables, and vendor payments.",
    navPaths: ["/", "/commitments", "/add", "/lending", "/analytics", "/tools", "/profile"],
    showLending: true,
    showAffordabilityOnAdd: false,
  },
  {
    id: "freelancer",
    label: "Freelancer / gig",
    emoji: "🎯",
    description: "Irregular income and flexible budgeting.",
    navPaths: ["/", "/commitments", "/add", "/lending", "/analytics", "/tools", "/profile"],
    showLending: true,
    showAffordabilityOnAdd: true,
  },
  {
    id: "family",
    label: "Family household",
    emoji: "👨‍👩‍👧",
    description: "Shared expenses and joint goals.",
    navPaths: ["/", "/commitments", "/add", "/lending", "/analytics", "/tools", "/profile"],
    showLending: true,
    showAffordabilityOnAdd: true,
  },
  {
    id: "student",
    label: "Student",
    emoji: "🎓",
    description: "Education costs and simple budgeting.",
    navPaths: ["/", "/commitments", "/add", "/analytics", "/tools", "/profile"],
    showLending: false,
    showAffordabilityOnAdd: true,
  },
  {
    id: "power",
    label: "Power user",
    emoji: "⚡",
    description: "All features enabled.",
    navPaths: ["/", "/commitments", "/add", "/lending", "/analytics", "/tools", "/profile"],
    showLending: true,
    showAffordabilityOnAdd: true,
  },
];

export function getUserModeConfig(modeId) {
  return USER_MODES.find((m) => m.id === modeId) || USER_MODES[0];
}

export function navItemsForMode(modeId) {
  const cfg = getUserModeConfig(modeId);
  const all = [
    { to: "/", label: "Home", icon: "🏠" },
    { to: "/commitments", label: "Commitments", icon: "📋" },
    { to: "/add", label: "Add", icon: "➕" },
    { to: "/lending", label: "Lending", icon: "🤝" },
    { to: "/analytics", label: "Analytics", icon: "📊" },
    { to: "/tools", label: "Tools", icon: "⚙️" },
    { to: "/profile", label: "Profile", icon: "👤" },
  ];
  return all.filter((item) => cfg.navPaths.includes(item.to));
}
