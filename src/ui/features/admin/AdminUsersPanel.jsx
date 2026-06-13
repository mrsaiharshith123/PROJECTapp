import { useState } from "react";
import { useAuth } from "../../../context/AuthContext.jsx";
import { useAdminUsers } from "../../../hooks/useAdminUsers.js";
import { adminDeleteUser, adminSetUserAdmin, adminUpdateUser } from "../../../services/adminUsers.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { Button, Caption, Heading, Body, inputClassName } from "../../index.js";
import { Modal } from "../../primitives/Modal.jsx";

function formatWhen(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return "—";
  }
}

/**
 * @param {Record<string, unknown>} user
 */
function userLabel(user) {
  const name = String(user.display_name || user.username || "").trim();
  const email = String(user.email || "").trim();
  if (name && email) return `${name} · ${email}`;
  return name || email || String(user.id || "User");
}

export default function AdminUsersPanel() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const selfId = user?.id ? String(user.id) : "";
  const { users, total, offset, limit, search, setSearch, loading, error, refresh, nextPage, prevPage, runSearch } =
    useAdminUsers();
  const [flash, setFlash] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [editUser, setEditUser] = useState(/** @type {Record<string, unknown> | null} */ (null));
  const [editForm, setEditForm] = useState(
    /** @type {{ display_name: string, phone: string, subscription_tier: string, monthly_income: string, onboarding_complete: boolean }} */ ({
      display_name: "",
      phone: "",
      subscription_tier: "free",
      monthly_income: "",
      onboarding_complete: false,
    }),
  );

  const showFlash = (msg) => {
    setFlash(msg);
    window.setTimeout(() => setFlash(""), 2500);
  };

  const runAction = async (id, fn) => {
    setBusyId(id);
    try {
      await fn();
      refresh();
    } catch (e) {
      showFlash(/** @type {{ message?: string }} */ (e)?.message || "Action failed");
    } finally {
      setBusyId(null);
    }
  };

  const openEdit = (user) => {
    setEditUser(user);
    setEditForm({
      display_name: String(user.display_name || ""),
      phone: String(user.phone || ""),
      subscription_tier: String(user.subscription_tier || "free"),
      monthly_income: user.monthly_income != null ? String(user.monthly_income) : "",
      onboarding_complete: Boolean(user.onboarding_complete),
    });
  };

  const saveEdit = async () => {
    if (!editUser?.id) return;
    const id = String(editUser.id);
    setBusyId(id);
    try {
      await adminUpdateUser(id, {
        display_name: editForm.display_name,
        phone: editForm.phone,
        subscription_tier: editForm.subscription_tier,
        monthly_income: editForm.monthly_income === "" ? null : Number(editForm.monthly_income) || 0,
        onboarding_complete: editForm.onboarding_complete,
      });
      setEditUser(null);
      showFlash(t("admin.users.saved"));
      refresh();
    } catch (e) {
      showFlash(/** @type {{ message?: string }} */ (e)?.message || "Save failed");
    } finally {
      setBusyId(null);
    }
  };

  const from = total === 0 ? 0 : offset + 1;
  const to = Math.min(offset + limit, total);

  return (
    <div className="ct-admin-panel ct-stack">
      <Heading level={4}>{t("admin.section.users")}</Heading>

      <form
        className="ct-admin-users-search"
        onSubmit={(e) => {
          e.preventDefault();
          runSearch();
        }}
      >
        <input
          className={`${inputClassName()} ct-admin-users-search-input`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("admin.users.search")}
        />
        <Button type="submit" variant="outline" size="sm" className="!w-auto shrink-0" disabled={loading}>
          {t("admin.users.searchBtn")}
        </Button>
      </form>

      {flash && <Caption className="text-[var(--ct-success)] font-semibold">{flash}</Caption>}
      {error && error !== "NOT_ADMIN" && <Body className="ct-admin-error">{error}</Body>}

      {loading && users.length === 0 ? (
        <Caption>{t("admin.users.loading")}</Caption>
      ) : users.length === 0 ? (
        <Caption>{t("admin.users.empty")}</Caption>
      ) : (
        <div className="ct-admin-users-table-wrap">
          <table className="ct-admin-users-table">
            <thead>
              <tr>
                <th>{t("admin.users.colUser")}</th>
                <th>{t("admin.users.colTier")}</th>
                <th>{t("admin.users.colStatus")}</th>
                <th>{t("admin.users.colActions")}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const id = String(u.id);
                const isSelf = id === selfId;
                const verified = Boolean(u.pan_verified);
                const isAdmin = Boolean(u.is_admin);
                const busy = busyId === id;

                return (
                  <tr key={id}>
                    <td>
                      <span className="ct-admin-users-name">{userLabel(u)}</span>
                      <Caption className="block mt-0.5">
                        {u.phone ? String(u.phone) : "—"} · joined {formatWhen(u.created_at)}
                      </Caption>
                    </td>
                    <td>
                      <span className="ct-admin-users-tier">{String(u.subscription_tier || "free")}</span>
                    </td>
                    <td>
                      <div className="ct-admin-users-badges">
                        <span className={`ct-admin-badge${verified ? " ct-admin-badge-ok" : ""}`}>
                          {verified ? t("admin.users.verified") : t("admin.users.unverified")}
                        </span>
                        {isAdmin && <span className="ct-admin-badge ct-admin-badge-admin">{t("admin.users.adminBadge")}</span>}
                      </div>
                    </td>
                    <td>
                      <div className="ct-admin-users-actions">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="!w-auto"
                          disabled={busy}
                          onClick={() => openEdit(u)}
                        >
                          {t("admin.users.edit")}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="!w-auto"
                          disabled={busy}
                          onClick={() =>
                            runAction(id, () =>
                              adminUpdateUser(id, { pan_verified: !verified }),
                            )
                          }
                        >
                          {verified ? t("admin.users.unverify") : t("admin.users.verify")}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="!w-auto"
                          disabled={busy || isSelf}
                          onClick={() =>
                            runAction(id, () => adminSetUserAdmin(id, !isAdmin))
                          }
                        >
                          {isAdmin ? t("admin.users.revokeAdmin") : t("admin.users.makeAdmin")}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="!w-auto !text-[var(--ct-danger)]"
                          disabled={busy || isSelf}
                          onClick={() => {
                            if (isSelf) {
                              showFlash(t("admin.users.cannotDeleteSelf"));
                              return;
                            }
                            if (!window.confirm(t("admin.users.deleteConfirm"))) return;
                            runAction(id, async () => {
                              await adminDeleteUser(id);
                              showFlash(t("admin.users.deleted"));
                            });
                          }}
                        >
                          {t("admin.users.delete")}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {total > 0 && (
        <div className="ct-admin-users-pager">
          <Caption>{t("admin.users.showing", { from, to, total })}</Caption>
          <div className="ct-row shrink-0">
            <Button type="button" variant="ghost" size="sm" className="!w-auto" onClick={prevPage} disabled={loading || offset === 0}>
              {t("admin.users.prev")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="!w-auto"
              onClick={nextPage}
              disabled={loading || offset + limit >= total}
            >
              {t("admin.users.next")}
            </Button>
          </div>
        </div>
      )}

      {editUser && (
        <Modal title={t("admin.users.editTitle")} onClose={() => setEditUser(null)}>
          <div className="ct-stack">
            <Caption className="block">{userLabel(editUser)}</Caption>
            <div>
              <label className="ct-field-label">{t("admin.users.fieldName")}</label>
              <input
                className={`${inputClassName()} mt-1`}
                value={editForm.display_name}
                onChange={(e) => setEditForm((f) => ({ ...f, display_name: e.target.value }))}
              />
            </div>
            <div>
              <label className="ct-field-label">{t("admin.users.fieldPhone")}</label>
              <input
                className={`${inputClassName()} mt-1`}
                value={editForm.phone}
                onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value.replace(/[^\d]/g, "") }))}
                inputMode="numeric"
              />
            </div>
            <div>
              <label className="ct-field-label">{t("admin.users.fieldTier")}</label>
              <select
                className={`${inputClassName()} mt-1`}
                value={editForm.subscription_tier}
                onChange={(e) => setEditForm((f) => ({ ...f, subscription_tier: e.target.value }))}
              >
                <option value="free">{t("plans.tier.free")}</option>
                <option value="pro">{t("plans.tier.pro")}</option>
                <option value="power">{t("plans.tier.power")}</option>
              </select>
            </div>
            <div>
              <label className="ct-field-label">{t("admin.users.fieldIncome")}</label>
              <input
                className={`${inputClassName()} mt-1`}
                value={editForm.monthly_income}
                onChange={(e) => setEditForm((f) => ({ ...f, monthly_income: e.target.value.replace(/[^\d]/g, "") }))}
                inputMode="numeric"
              />
            </div>
            <label className="ct-row gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={editForm.onboarding_complete}
                onChange={(e) => setEditForm((f) => ({ ...f, onboarding_complete: e.target.checked }))}
              />
              <span className="text-sm">{t("admin.users.fieldOnboarding")}</span>
            </label>
            <div className="ct-row">
              <Button type="button" variant="outline" className="!w-auto" onClick={() => setEditUser(null)}>
                {t("admin.users.cancel")}
              </Button>
              <Button type="button" className="!w-auto" onClick={saveEdit} disabled={busyId === String(editUser.id)}>
                {t("admin.users.save")}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
