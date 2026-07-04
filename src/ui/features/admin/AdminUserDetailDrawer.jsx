import { useTranslation } from "../../../i18n/I18nProvider.js";

function formatWhen(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return "—";
  }
}

function isUserBanned(user) {
  if (!user?.banned_until) return false;
  return new Date(String(user.banned_until)).getTime() > Date.now();
}

/**
 * @param {{ user: Record<string, unknown> | null, onClose: () => void }} props
 */
export default function AdminUserDetailDrawer({ user, onClose }) {
  const { t } = useTranslation();
  if (!user) return null;

  const isBanned = isUserBanned(user);
  const emailVerified = Boolean(user.email_confirmed_at);
  const initials = String(user.display_name || user.email || "U")
    .slice(0, 2)
    .toUpperCase();

  const rows = [
    [t("admin.drawer.id"), String(user.id || "—")],
    [t("admin.drawer.phone"), user.phone ? String(user.phone) : "—"],
    [
      t("admin.drawer.monthlyIncome"),
      user.monthly_income != null ? `₹${Number(user.monthly_income).toLocaleString("en-IN")}` : "—",
    ],
    [t("admin.drawer.userMode"), user.user_mode ? String(user.user_mode) : "—"],
    [
      t("admin.drawer.onboarding"),
      user.onboarding_complete ? t("admin.onboarding.done") : t("admin.onboarding.pending"),
    ],
    [t("admin.drawer.joined"), formatWhen(user.created_at)],
    [t("admin.drawer.lastActive"), formatWhen(user.last_active_at)],
    [t("admin.drawer.subUpdated"), formatWhen(user.subscription_updated_at)],
    [t("admin.drawer.paymentId"), user.razorpay_payment_id ? String(user.razorpay_payment_id) : "—"],
    [
      t("admin.drawer.bannedUntil"),
      user.banned_until ? formatWhen(user.banned_until) : t("admin.drawer.notBanned"),
    ],
  ];

  return (
    <div className="ed-backdrop" onClick={onClose} role="presentation">
      <aside className="ed-admin-drawer" onClick={(e) => e.stopPropagation()} aria-label={t("admin.drawer.aria")}>
        <div className="ed-admin-drawer-head">
          <div className="ed-admin-drawer-avatar">{initials}</div>
          <div className="min-w-0 flex-1">
            <p className="ed-admin-drawer-name">{String(user.display_name || "—")}</p>
            <p className="ed-admin-drawer-email">{String(user.email || "—")}</p>
          </div>
          <button type="button" className="ed-subpage-back" onClick={onClose} aria-label={t("common.close")}>
            ✕
          </button>
        </div>

        <div className="ed-admin-drawer-chips">
          <span className={`ed-admin-badge ${isBanned ? "ed-admin-badge-danger" : "ed-admin-badge-ok"}`}>
            {isBanned ? t("admin.users.banned") : t("admin.drawer.active")}
          </span>
          <span className={`ed-admin-badge ${emailVerified ? "ed-admin-badge-ok" : "ed-admin-badge-warn"}`}>
            {emailVerified ? t("admin.drawer.emailVerified") : t("admin.users.emailUnverified")}
          </span>
          <span className="ed-admin-badge">{String(user.subscription_tier || "free")}</span>
          {user.is_admin ? (
            <span className="ed-admin-badge ed-admin-badge-admin">{t("admin.users.adminBadge")}</span>
          ) : null}
          {user.pan_verified ? (
            <span className="ed-admin-badge ed-admin-badge-ok">{t("admin.users.verified")}</span>
          ) : null}
        </div>

        <div className="ed-admin-drawer-rows">
          {rows.map(([label, value]) => (
            <div key={label} className="ed-admin-drawer-row">
              <span className="ed-admin-drawer-row-label">{label}</span>
              <span className="ed-admin-drawer-row-value">{value}</span>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
