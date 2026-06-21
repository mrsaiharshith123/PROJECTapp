/** @param {Record<string, unknown> | null | undefined} data */
export function exportAdminOverviewCsv(data) {
  if (!data || typeof data !== "object") return;
  const totals = /** @type {Record<string, unknown>} */ (data.totals || {});
  const rows = [
    ["metric", "value"],
    ["users", totals.users],
    ["dau", totals.dau],
    ["wau", totals.wau],
    ["mau", totals.mau],
    ["active_30d", totals.active_30d],
    ["premium_users", totals.premium_users],
    ["mrr_inr", totals.mrr_inr],
    ["fetched_at", data.fetched_at],
  ];
  const csv = rows.map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `perovo-admin-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/** @param {string | undefined} iso */
export function adminTimeAgo(iso) {
  if (!iso) return "—";
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.round(diff / 60000);
    if (mins < 1) return "< 1 min ago";
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.round(mins / 60);
    return `${hrs} hr ago`;
  } catch {
    return "—";
  }
}

/** @param {number | undefined} users @param {number | undefined} unique */
export function moduleAdoptionPct(users, unique) {
  const u = Number(users) || 0;
  const n = Number(unique) || 0;
  if (u <= 0) return 0;
  return Math.min(100, Math.round((n / u) * 100));
}
