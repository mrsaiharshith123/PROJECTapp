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
    <div className="ed-load-header">
      <Skeleton className="ed-load-sk-eyebrow" />
      <Skeleton className="ed-load-sk-title" />
      <Skeleton className="ed-load-sk-sub" />
    </div>
  );
}

function ListRowSkeleton({ count = 4 }) {
  return (
    <div className="ed-load-list">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="ed-load-row">
          <Skeleton className="ed-load-sk-icon" />
          <div className="ed-load-row-body">
            <Skeleton className="ed-load-sk-line" />
            <Skeleton className="ed-load-sk-line-sm" />
          </div>
          <Skeleton className="ed-load-sk-pill" />
        </div>
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="ed-load-page ed-stack">
      <PageHeaderSkeleton />
      <Skeleton className="ed-load-sk-hero" />
      <div className="ed-load-chip-row">
        <Skeleton className="ed-load-sk-chip" />
        <Skeleton className="ed-load-sk-chip" />
        <Skeleton className="ed-load-sk-chip" />
      </div>
      <ListRowSkeleton count={3} />
      <div className="ed-load-stat-row">
        <Skeleton className="ed-load-sk-stat" />
        <Skeleton className="ed-load-sk-stat" />
      </div>
    </div>
  );
}

export function ListPageSkeleton() {
  return (
    <div className="ed-load-page ed-stack">
      <PageHeaderSkeleton />
      <div className="ed-load-chip-row">
        <Skeleton className="ed-load-sk-chip" />
        <Skeleton className="ed-load-sk-chip-wide" />
      </div>
      <ListRowSkeleton count={5} />
    </div>
  );
}

export function FormPageSkeleton() {
  return (
    <div className="ed-load-page ed-stack">
      <PageHeaderSkeleton />
      <div className="ed-load-form">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="ed-load-field">
            <Skeleton className="ed-load-sk-label" />
            <Skeleton className="ed-load-sk-input" />
          </div>
        ))}
        <Skeleton className="ed-load-sk-btn" />
      </div>
    </div>
  );
}

export function AnalyticsSkeleton() {
  return (
    <div className="ed-load-page ed-stack">
      <PageHeaderSkeleton />
      <Skeleton className="ed-load-sk-chart" />
      <div className="ed-load-stat-row">
        <Skeleton className="ed-load-sk-stat" />
        <Skeleton className="ed-load-sk-stat" />
        <Skeleton className="ed-load-sk-stat" />
        <Skeleton className="ed-load-sk-stat" />
      </div>
      <ListRowSkeleton count={3} />
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="ed-load-page ed-stack">
      <Skeleton className="ed-load-sk-profile-hero" />
      <div className="ed-load-settings">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="ed-load-setting-row">
            <Skeleton className="ed-load-sk-setting-icon" />
            <div className="ed-load-row-body">
              <Skeleton className="ed-load-sk-line" />
              <Skeleton className="ed-load-sk-line-sm" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminSkeleton() {
  return (
    <div className="ed-load-page ed-stack">
      <PageHeaderSkeleton />
      <div className="ed-load-admin-grid">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="ed-load-sk-metric" />
        ))}
      </div>
      <Skeleton className="ed-load-sk-chart" />
    </div>
  );
}

export function GenericPageSkeleton() {
  return (
    <div className="ed-load-page ed-stack">
      <PageHeaderSkeleton />
      <Skeleton className="ed-load-sk-card" />
      <Skeleton className="ed-load-sk-card" />
      <Skeleton className="ed-load-sk-card-short" />
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
