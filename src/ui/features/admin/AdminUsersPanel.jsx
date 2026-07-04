import { useState } from "react";
import { useAuth } from "../../../context/AuthContext.jsx";
import { useAdminUsers } from "../../../hooks/useAdminUsers.js";
import {
  adminBanUser,
  adminDeleteUser,
  adminExportUsersCsv,
  adminResetOnboarding,
  adminRevokeSessions,
  adminSetUserAdmin,
  adminUpdateUser,
  adminVerifyEmail,
} from "../../../services/adminUsers.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { Button, Caption, inputClassName } from "../../index.js";
import { Modal } from "../../primitives/Modal.jsx";
import AdminUserDetailDrawer from "./AdminUserDetailDrawer.jsx";

function userInitials(user) {
  const name = String(user.display_name || user.email || "U").trim();
  return name.slice(0, 2).toUpperCase();
}

function formatWhen(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return "—";
  }
}

function formatActive(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return "—";
  }
}

function isUserBanned(user) {
  if (!user?.banned_until) return false;
  return new Date(String(user.banned_until)).getTime() > Date.now();
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
  const [exporting, setExporting] = useState(false);
  const [editUser, setEditUser] = useState(/** @type {Record<string, unknown> | null} */ (null));
  const [viewUser, setViewUser] = useState(/** @type {Record<string, unknown> | null} */ (null));
  const [editForm, setEditForm] = useState({
    display_name: "",
    phone: "",
    subscription_tier: "free",
    monthly_income: "",
    onboarding_complete: false,
  });

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
      showFlash(e instanceof Error ? e.message : t("admin.users.actionFailed"));
    } finally {
      setBusyId(null);
    }
  };

  const openEdit = (row) => {
    setEditUser(row);
    setEditForm({
      display_name: String(row.display_name || ""),
      phone: String(row.phone || ""),
      subscription_tier: String(row.subscription_tier || "free"),
      monthly_income: row.monthly_income != null ? String(row.monthly_income) : "",
      onboarding_complete: Boolean(row.onboarding_complete),
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
      showFlash(e instanceof Error ? e.message : t("admin.users.actionFailed"));
    } finally {
      setBusyId(null);
    }
  };

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const csv = await adminExportUsersCsv();
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "perovo-users.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      showFlash(e instanceof Error ? e.message : t("admin.users.actionFailed"));
    } finally {
      setExporting(false);
    }
  };

  const from = total === 0 ? 0 : offset + 1;
  const to = Math.min(offset + limit, total);

  return (
    <div className="ed-admin-panel ed-stack-sm">
      <p className="ed-admin-panel-title">{t("admin.section.users")}</p>

      <div className="ed-row gap-2 flex-wrap">
        <form
          className="ed-row gap-2 flex-1 min-w-0"
          onSubmit={(e) => {
            e.preventDefault();
            runSearch();
          }}
        >
          <input
            className={`${inputClassName()} ed-input flex-1 min-w-0`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("admin.users.search")}
          />
          <button type="submit" className="ed-btn ed-btn-secondary ed-btn-sm shrink-0" disabled={loading}>
            {t("admin.users.searchBtn")}
          </button>
        </form>
        <button
          type="button"
          className="ed-btn ed-btn-ghost ed-btn-sm shrink-0"
          disabled={exporting}
          onClick={handleExportCsv}
        >
          {exporting ? t("admin.users.exporting") : t("admin.users.exportCsv")}
        </button>
      </div>

      {flash ? <Caption style={{ color: "var(--ed-green)" }}>{flash}</Caption> : null}
      {error && error !== "NOT_ADMIN" ? (
        <Caption style={{ color: "var(--ed-red)" }}>{error}</Caption>
      ) : null}

      {loading && users.length === 0 ? (
        <Caption>{t("admin.users.loading")}</Caption>
      ) : users.length === 0 ? (
        <Caption>{t("admin.users.empty")}</Caption>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="ed-admin-table">
            <thead>
              <tr>
                <th>{t("admin.users.colUser")}</th>
                <th>{t("admin.users.colTier")}</th>
                <th>{t("admin.users.colLastActive")}</th>
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
                const banned = isUserBanned(u);
                const emailVerified = Boolean(u.email_confirmed_at);
                const busy = busyId === id;

                return (
                  <tr key={id}>
                    <td>
                      <div className="ed-row gap-2 items-center">
                        <span className="ed-admin-drawer-avatar" style={{ width: 32, height: 32, fontSize: 12 }}>
                          {userInitials(u)}
                        </span>
                        <div className="min-w-0">
                          <p style={{ fontSize: 13, fontWeight: 600 }}>{userLabel(u)}</p>
                          <Caption className="block">
                            {u.phone ? String(u.phone) : "—"} · {t("admin.users.joined", { when: formatWhen(u.created_at) })}
                          </Caption>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="ed-admin-badge">{String(u.subscription_tier || "free")}</span>
                    </td>
                    <td style={{ fontSize: 12, whiteSpace: "nowrap" }}>{formatActive(u.last_active_at)}</td>
                    <td>
                      <div className="ed-row gap-1 flex-wrap">
                        <span className={`ed-admin-badge${verified ? " ed-admin-badge-ok" : ""}`}>
                          {verified ? t("admin.users.verified") : t("admin.users.unverified")}
                        </span>
                        {isAdmin ? (
                          <span className="ed-admin-badge ed-admin-badge-admin">{t("admin.users.adminBadge")}</span>
                        ) : null}
                        {banned ? (
                          <span className="ed-admin-badge ed-admin-badge-danger">{t("admin.users.banned")}</span>
                        ) : null}
                        {!emailVerified ? (
                          <span className="ed-admin-badge ed-admin-badge-warn">{t("admin.users.emailUnverified")}</span>
                        ) : null}
                      </div>
                    </td>
                    <td>
                      <div className="ed-row gap-1 flex-wrap">
                        <button
                          type="button"
                          className="ed-admin-action-btn"
                          disabled={busy}
                          onClick={() => setViewUser(u)}
                        >
                          {t("admin.users.view")}
                        </button>
                        <button type="button" className="ed-admin-action-btn" disabled={busy} onClick={() => openEdit(u)}>
                          {t("admin.users.edit")}
                        </button>
                        <button
                          type="button"
                          className="ed-admin-action-btn"
                          disabled={busy}
                          onClick={() => runAction(id, () => adminUpdateUser(id, { pan_verified: !verified }))}
                        >
                          {verified ? t("admin.users.unverify") : t("admin.users.verify")}
                        </button>
                        {!emailVerified ? (
                          <button
                            type="button"
                            className="ed-admin-action-btn"
                            disabled={busy}
                            onClick={() => runAction(id, () => adminVerifyEmail(id))}
                          >
                            {t("admin.users.verifyEmail")}
                          </button>
                        ) : null}
                        <button
                          type="button"
                          className="ed-admin-action-btn"
                          disabled={busy || isSelf}
                          onClick={() => runAction(id, () => adminBanUser(id, !banned))}
                        >
                          {banned ? t("admin.users.unban") : t("admin.users.ban")}
                        </button>
                        <button
                          type="button"
                          className="ed-admin-action-btn"
                          disabled={busy}
                          onClick={() => {
                            if (!window.confirm(t("admin.users.revokeSessionsConfirm"))) return;
                            runAction(id, () => adminRevokeSessions(id));
                          }}
                        >
                          {t("admin.users.revokeSessions")}
                        </button>
                        <button
                          type="button"
                          className="ed-admin-action-btn"
                          disabled={busy}
                          onClick={() => runAction(id, () => adminResetOnboarding(id))}
                        >
                          {t("admin.users.resetOnboarding")}
                        </button>
                        <button
                          type="button"
                          className="ed-admin-action-btn"
                          disabled={busy || isSelf}
                          onClick={() => runAction(id, () => adminSetUserAdmin(id, !isAdmin))}
                        >
                          {isAdmin ? t("admin.users.revokeAdmin") : t("admin.users.makeAdmin")}
                        </button>
                        <button
                          type="button"
                          className="ed-admin-action-btn danger"
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
                        </button>
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
        <div className="ed-row-between gap-2 flex-wrap">
          <Caption>{t("admin.users.showing", { from, to, total })}</Caption>
          <div className="ed-row shrink-0">
            <button
              type="button"
              className="ed-btn ed-btn-ghost ed-btn-sm"
              onClick={prevPage}
              disabled={loading || offset === 0}
            >
              {t("admin.users.prev")}
            </button>
            <button
              type="button"
              className="ed-btn ed-btn-ghost ed-btn-sm"
              onClick={nextPage}
              disabled={loading || offset + limit >= total}
            >
              {t("admin.users.next")}
            </button>
          </div>
        </div>
      )}

      <AdminUserDetailDrawer user={viewUser} onClose={() => setViewUser(null)} />

      {editUser ? (
        <Modal title={t("admin.users.editTitle")} onClose={() => setEditUser(null)}>
          <div className="ed-stack-sm">
            <Caption className="block">{userLabel(editUser)}</Caption>
            <label className="ed-admin-form-row">
              <span className="ed-admin-field-label">{t("admin.users.fieldName")}</span>
              <input
                className="ed-input"
                value={editForm.display_name}
                onChange={(e) => setEditForm((f) => ({ ...f, display_name: e.target.value }))}
              />
            </label>
            <label className="ed-admin-form-row">
              <span className="ed-admin-field-label">{t("admin.users.fieldPhone")}</span>
              <input
                className="ed-input"
                value={editForm.phone}
                onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value.replace(/[^\d]/g, "") }))}
                inputMode="numeric"
              />
            </label>
            <label className="ed-admin-form-row">
              <span className="ed-admin-field-label">{t("admin.users.fieldTier")}</span>
              <select
                className="ed-select"
                value={editForm.subscription_tier}
                onChange={(e) => setEditForm((f) => ({ ...f, subscription_tier: e.target.value }))}
              >
                <option value="free">{t("plans.tier.free")}</option>
                <option value="pro">{t("plans.tier.pro")}</option>
              </select>
            </label>
            <label className="ed-admin-form-row">
              <span className="ed-admin-field-label">{t("admin.users.fieldIncome")}</span>
              <input
                className="ed-input"
                value={editForm.monthly_income}
                onChange={(e) => setEditForm((f) => ({ ...f, monthly_income: e.target.value.replace(/[^\d]/g, "") }))}
                inputMode="numeric"
              />
            </label>
            <label className="ed-row gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={editForm.onboarding_complete}
                onChange={(e) => setEditForm((f) => ({ ...f, onboarding_complete: e.target.checked }))}
              />
              <span style={{ fontSize: 14 }}>{t("admin.users.fieldOnboarding")}</span>
            </label>
            <div className="ed-row gap-2">
              <Button type="button" variant="outline" className="!w-auto" onClick={() => setEditUser(null)}>
                {t("admin.users.cancel")}
              </Button>
              <Button type="button" className="!w-auto" onClick={saveEdit} disabled={busyId === String(editUser.id)}>
                {t("admin.users.save")}
              </Button>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
