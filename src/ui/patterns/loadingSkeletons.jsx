import { Skeleton } from "./Loading.jsx";

/** @param {string} pathname */
function skeletonKindForPath(pathname) {
  const path = pathname.replace(/\/$/, "") || "/";
  if (path === "/") return "dashboard";
  if (path.startsWith("/ledger/bills") || path.startsWith("/money/bills") || path.startsWith("/commitments")) return "list";
  if (path.startsWith("/money/lending") || path.startsWith("/lending")) return "list";
  if (path.startsWith("/plan") || path.startsWith("/tools")) return "dashboard";
  if (path.startsWith("/add") || path.startsWith("/onboarding")) return "form";
  if (path.startsWith("/insights") || path.startsWith("/money/insights") || path.startsWith("/analytics") || path.startsWith("/net-worth") || path.startsWith("/profile/analytics") || path.startsWith("/paycheck")) return "analytics";
  if (path.startsWith("/profile")) return "profile";
  if (path.startsWith("/admin")) return "admin";
  return "generic";
}

function PageHeaderSkeleton() {
  return (
    <div className="ct-load-header">
      <Skeleton className="ct-load-sk-eyebrow" />
      <Skeleton className="ct-load-sk-title" />
      <Skeleton className="ct-load-sk-sub" />
    </div>
  );
}

function ListRowSkeleton({ count = 4 }) {
  return (
    <div className="ct-load-list">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="ct-load-row">
          <Skeleton className="ct-load-sk-icon" />
          <div className="ct-load-row-body">
            <Skeleton className="ct-load-sk-line" />
            <Skeleton className="ct-load-sk-line-sm" />
          </div>
          <Skeleton className="ct-load-sk-pill" />
        </div>
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="ct-load-page ct-stack">
      <PageHeaderSkeleton />
      <Skeleton className="ct-load-sk-hero" />
      <div className="ct-load-chip-row">
        <Skeleton className="ct-load-sk-chip" />
        <Skeleton className="ct-load-sk-chip" />
        <Skeleton className="ct-load-sk-chip" />
      </div>
      <ListRowSkeleton count={3} />
      <div className="ct-load-stat-row">
        <Skeleton className="ct-load-sk-stat" />
        <Skeleton className="ct-load-sk-stat" />
      </div>
    </div>
  );
}

export function ListPageSkeleton() {
  return (
    <div className="ct-load-page ct-stack">
      <PageHeaderSkeleton />
      <div className="ct-load-chip-row">
        <Skeleton className="ct-load-sk-chip" />
        <Skeleton className="ct-load-sk-chip-wide" />
      </div>
      <ListRowSkeleton count={5} />
    </div>
  );
}

export function FormPageSkeleton() {
  return (
    <div className="ct-load-page ct-stack">
      <PageHeaderSkeleton />
      <div className="ct-load-form">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="ct-load-field">
            <Skeleton className="ct-load-sk-label" />
            <Skeleton className="ct-load-sk-input" />
          </div>
        ))}
        <Skeleton className="ct-load-sk-btn" />
      </div>
    </div>
  );
}

export function AnalyticsSkeleton() {
  return (
    <div className="ct-load-page ct-stack">
      <PageHeaderSkeleton />
      <Skeleton className="ct-load-sk-chart" />
      <div className="ct-load-stat-row">
        <Skeleton className="ct-load-sk-stat" />
        <Skeleton className="ct-load-sk-stat" />
        <Skeleton className="ct-load-sk-stat" />
        <Skeleton className="ct-load-sk-stat" />
      </div>
      <ListRowSkeleton count={3} />
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="ct-load-page ct-stack">
      <Skeleton className="ct-load-sk-profile-hero" />
      <div className="ct-load-settings">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="ct-load-setting-row">
            <Skeleton className="ct-load-sk-setting-icon" />
            <div className="ct-load-row-body">
              <Skeleton className="ct-load-sk-line" />
              <Skeleton className="ct-load-sk-line-sm" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminSkeleton() {
  return (
    <div className="ct-load-page ct-stack">
      <PageHeaderSkeleton />
      <div className="ct-load-admin-grid">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="ct-load-sk-metric" />
        ))}
      </div>
      <Skeleton className="ct-load-sk-chart" />
    </div>
  );
}

export function GenericPageSkeleton() {
  return (
    <div className="ct-load-page ct-stack">
      <PageHeaderSkeleton />
      <Skeleton className="ct-load-sk-card" />
      <Skeleton className="ct-load-sk-card" />
      <Skeleton className="ct-load-sk-card-short" />
    </div>
  );
}

const SKELETON_MAP = {
  dashboard: DashboardSkeleton,
  list: ListPageSkeleton,
  form: FormPageSkeleton,
  analytics: AnalyticsSkeleton,
  profile: ProfileSkeleton,
  admin: AdminSkeleton,
  generic: GenericPageSkeleton,
};

/** @param {{ pathname: string }} props */
export function RouteSkeleton({ pathname }) {
  const key = skeletonKindForPath(pathname);
  const Comp = SKELETON_MAP[key] || GenericPageSkeleton;
  return <Comp />;
}
