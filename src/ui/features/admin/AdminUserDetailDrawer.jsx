import { Button, Caption, Heading, Body } from "../../index.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";

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
        <div className="ct-row-between mb-3">
          <Heading level={4} id="admin-drawer-title">
            {name}
          </Heading>
          <Button type="button" variant="ghost" size="sm" className="!w-auto" onClick={onClose}>
            ×
          </Button>
        </div>
        <Caption className="block">{email}</Caption>
        <Body className="mt-3 !text-sm">
          {t("admin.users.fieldTier")}: <span className="font-semibold capitalize">{tier}</span>
        </Body>
        <Caption className="block mt-2 opacity-80">
          {t("admin.users.fieldPhone")}: {user.phone ? String(user.phone) : "—"}
        </Caption>
        <Caption className="block mt-1 opacity-80">
          {t("admin.users.fieldOnboarding")}: {user.onboarding_complete ? t("admin.onboarding.done") : t("admin.onboarding.pending")}
        </Caption>
      </aside>
    </div>
  );
}
