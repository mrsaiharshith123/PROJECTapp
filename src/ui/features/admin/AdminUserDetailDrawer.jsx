import { Button, Caption, Heading } from "../../index.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { CtIcon } from "../../icons/CtIcon.jsx";

/**
 * @param {{ user: Record<string, unknown> | null, onClose: () => void }} props
 */
export default function AdminUserDetailDrawer({ user, onClose }) {
  const { t } = useTranslation();
  if (!user) return null;
  const name = String(user.display_name || user.username || "User");
  const email = String(user.email || "—");
  const tier = String(user.subscription_tier || "free");

  return (
    <div className="ct-admin-drawer-backdrop" role="presentation" onClick={onClose}>
      <aside className="ct-admin-drawer" onClick={(e) => e.stopPropagation()} aria-labelledby="admin-drawer-title">
        <div className="ct-hero-card lending ct-stack-sm mb-3">
          <div className="ct-row-between gap-2 items-start">
            <div className="min-w-0">
              <Heading level={4} id="admin-drawer-title">
                {name}
              </Heading>
              <Caption className="block mt-1">{email}</Caption>
            </div>
            <Button type="button" variant="ghost" size="sm" className="!w-auto shrink-0" onClick={onClose}>
              ×
            </Button>
          </div>
        </div>

        <div className="ct-stack-sm">
          <div className="ct-stat-tile indigo ct-row-between gap-2 items-center">
            <span className="ct-icon-tile-sm indigo shrink-0" aria-hidden>
              <CtIcon name="crown" size={16} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="ct-stat-tile-label">{t("admin.users.fieldTier")}</p>
              <p className="ct-stat-tile-value text-sm capitalize">{tier}</p>
            </div>
          </div>
          <div className="ct-stat-tile ct-row-between gap-2 items-center">
            <span className="ct-icon-tile-sm teal shrink-0" aria-hidden>
              <CtIcon name="device-mobile" size={16} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="ct-stat-tile-label">{t("admin.users.fieldPhone")}</p>
              <p className="ct-stat-tile-value text-sm">{user.phone ? String(user.phone) : "—"}</p>
            </div>
          </div>
          <div className="ct-stat-tile teal">
            <p className="ct-stat-tile-label">{t("admin.users.fieldOnboarding")}</p>
            <p className="ct-stat-tile-value text-sm">
              {user.onboarding_complete ? t("admin.onboarding.done") : t("admin.onboarding.pending")}
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}
