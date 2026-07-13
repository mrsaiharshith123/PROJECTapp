import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { routerBasename } from "./utils/basePath.js";
import { PerovoProvider, usePerovo } from "./context/PerovoContext.jsx";
import { IntelProvider } from "./app/IntelProvider.jsx";
import { NetWorthProvider } from "./context/NetWorthContext.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import { Navbar, Screen, MainContent, RouteFallback } from "./ui";
import { PerovoLocaleSync } from "./i18n/index.js";
import ErrorBoundary, { RouteErrorBoundary } from "./ui/layout/ErrorBoundary.jsx";
import AuthConfirmPage from "./ui/features/auth/AuthConfirmPage.jsx";
import AuthGatePage from "./ui/features/auth/AuthGatePage.jsx";
import ScrollToTop from "./app/ScrollToTop.jsx";
import NotificationSync from "./app/NotificationSync.jsx";
import LocalReminderSync from "./app/LocalReminderSync.jsx";
import PushNotificationBridge from "./app/PushNotificationBridge.jsx";
import ThemeSync from "./app/ThemeSync.jsx";
import BrandDocumentSync from "./app/BrandDocumentSync.jsx";
import CloudSyncBridge from "./app/CloudSyncBridge.jsx";
import CloudRestoreGate from "./app/CloudRestoreGate.jsx";
import StartupUpdateGate from "./app/StartupUpdateGate.jsx";
import NativePermissionGate from "./app/NativePermissionGate.jsx";
import SalaryDayBridge from "./app/SalaryDayBridge.jsx";
import AnalyticsBridge from "./app/AnalyticsBridge.jsx";
import BootShell from "./boot/BootShell.jsx";
import { OfflineScreen } from "./ui/layout/OfflineScreen.jsx";
import { useOnlineStatus } from "./hooks/useOnlineStatus.js";
import { isAccountSetupComplete } from "./utils/profileSetup.js";
import { normalizeIndianPhone } from "./utils/phone.js";
import { isSignupPending } from "./utils/authSessionCleanup.js";
import {
  getMarketingLandingUrl,
  shouldBrowserUseMarketingLanding,
} from "./utils/marketingLanding.js";
import Onboarding from "./ui/features/pages/OnboardingPage.jsx";
import { ADMIN_UI_ENABLED } from "./constants/featureFlags.js";
import { STORAGE_KEYS } from "./utils/storage/keys.js";

/** Eager — bottom nav pages load instantly with no Suspense stall on tap */
import Home from "./ui/features/pages/HomePage.jsx";
import Ledger from "./ui/features/pages/LedgerPage.jsx";
import Agreements from "./ui/features/pages/AgreementsPage.jsx";
import Add from "./ui/features/pages/AddPage.jsx";
import Profile from "./ui/features/pages/YouPage.jsx";
import LedgerRootLayout from "./ui/features/pages/LedgerRootLayout.jsx";
import LedgerOpsShell from "./ui/features/pages/MoneyShellPage.jsx";
import Commitments from "./ui/features/pages/CommitmentsPage.jsx";

const LendingOfferReview = lazy(() => import("./ui/features/pages/LendingOfferReviewPage.jsx"));
const ScoreDetail = lazy(() => import("./ui/features/pages/ScoreDetailPage.jsx"));
const Analytics = lazy(() => import("./ui/features/pages/AnalyticsPage.jsx"));
const InsightsYearlyBreakdown = lazy(() =>
  import("./ui/features/insights/InsightsBreakdownPages.jsx").then((m) => ({
    default: m.InsightsYearlyBreakdownPage,
  })),
);
const InsightsNetWorthBreakdown = lazy(() =>
  import("./ui/features/insights/InsightsBreakdownPages.jsx").then((m) => ({
    default: m.InsightsNetWorthBreakdownPage,
  })),
);
const InsightsCashflowBreakdown = lazy(() =>
  import("./ui/features/insights/InsightsBreakdownPages.jsx").then((m) => ({
    default: m.InsightsCashflowBreakdownPage,
  })),
);
const InsightsPulseBreakdown = lazy(() =>
  import("./ui/features/insights/InsightsBreakdownPages.jsx").then((m) => ({
    default: m.InsightsPulseBreakdownPage,
  })),
);
const InsightsAssetsBreakdown = lazy(() =>
  import("./ui/features/insights/InsightsBreakdownPages.jsx").then((m) => ({
    default: m.InsightsAssetsBreakdownPage,
  })),
);
const InsightsLiabilitiesBreakdown = lazy(() =>
  import("./ui/features/insights/InsightsBreakdownPages.jsx").then((m) => ({
    default: m.InsightsLiabilitiesBreakdownPage,
  })),
);
const InsightsInstrumentsBreakdown = lazy(() =>
  import("./ui/features/insights/InsightsBreakdownPages.jsx").then((m) => ({
    default: m.InsightsInstrumentsBreakdownPage,
  })),
);
const WealthEntryDetail = lazy(() => import("./ui/features/ledger/WealthEntryDetailPage.jsx"));
const YouToolsPage = lazy(() => import("./ui/features/profile/pages/YouToolsPage.jsx"));
const Privacy = lazy(() => import("./ui/features/pages/PrivacyPage.jsx"));
const EmergencyMode = lazy(() => import("./ui/features/pages/EmergencyModePage.jsx"));
const EmergencyAccessView = lazy(() => import("./ui/features/pages/EmergencyAccessViewPage.jsx"));
const Admin = lazy(() => import("./ui/features/pages/AdminPage.jsx"));
const YouPersonalPage = lazy(() => import("./ui/features/profile/pages/YouPersonalPage.jsx"));
const YouAccountPage = lazy(() => import("./ui/features/profile/pages/YouAccountPage.jsx"));
const YouMoneyPage = lazy(() => import("./ui/features/profile/pages/YouMoneyPage.jsx"));
const YouAppearancePage = lazy(() => import("./ui/features/profile/pages/YouAppearancePage.jsx"));
const YouSecurityPage = lazy(() => import("./ui/features/profile/pages/YouSecurityPage.jsx"));
const YouBackupPage = lazy(() => import("./ui/features/profile/pages/YouBackupPage.jsx"));
const YouNotificationsPage = lazy(() => import("./ui/features/profile/pages/YouNotificationsPage.jsx"));
const YouHistoryPage = lazy(() => import("./ui/features/profile/pages/YouHistoryPage.jsx"));
const YouSupportPage = lazy(() => import("./ui/features/profile/pages/YouSupportPage.jsx"));
const YouAboutPage = lazy(() => import("./ui/features/profile/pages/YouAboutPage.jsx"));
const YouPlansPage = lazy(() => import("./ui/features/profile/pages/YouPlansPage.jsx"));
const YouPermissionsPage = lazy(() => import("./ui/features/profile/pages/YouPermissionsPage.jsx"));

function LazyRoute({ name, children }) {
  return <RouteErrorBoundary routeName={name}>{children}</RouteErrorBoundary>;
}

function RequireAdmin({ children }) {
  const { isAdmin } = useAuth();
  if (!ADMIN_UI_ENABLED || !isAdmin) return <Navigate to="/" replace />;
  return children;
}

function RequireAuth({ children }) {
  const { isReady, isLoggedIn } = useAuth();
  if (!isReady) return <BootShell />;
  if (!isLoggedIn) return <Navigate to="/auth" replace />;
  return children;
}

function LegacyInsightsRedirect() {
  const { search } = useLocation();
  return <Navigate to={`/insights${search}`} replace />;
}

function AppRoutes() {
  const location = useLocation();
  return (
    <Suspense fallback={<RouteFallback />} key={location.key}>
      <Routes location={location}>
        <Route path="/" element={<Home />} />
        <Route path="/ledger" element={<LazyRoute name="Ledger"><LedgerRootLayout /></LazyRoute>}>
          <Route index element={<Ledger />} />
          <Route element={<LedgerOpsShell />}>
            <Route path="bills" element={<Commitments />} />
          </Route>
        </Route>
        <Route path="/agreements" element={<LazyRoute name="Agreements"><Agreements /></LazyRoute>} />
        <Route path="/add" element={<Add />} />
        <Route path="/you" element={<Profile />} />
        <Route path="/insights" element={<LazyRoute name="Insights"><Analytics /></LazyRoute>} />
        <Route path="/insights/score" element={<LazyRoute name="Score"><ScoreDetail /></LazyRoute>} />
        <Route path="/insights/spending/yearly" element={<LazyRoute name="Yearly spending"><InsightsYearlyBreakdown /></LazyRoute>} />
        <Route path="/insights/networth" element={<LazyRoute name="Net worth"><InsightsNetWorthBreakdown /></LazyRoute>} />
        <Route path="/insights/assets" element={<LazyRoute name="Assets"><InsightsAssetsBreakdown /></LazyRoute>} />
        <Route path="/insights/liabilities" element={<LazyRoute name="Liabilities"><InsightsLiabilitiesBreakdown /></LazyRoute>} />
        <Route path="/insights/instruments" element={<LazyRoute name="Instruments"><InsightsInstrumentsBreakdown /></LazyRoute>} />
        <Route path="/insights/entry/:id" element={<LazyRoute name="Asset detail"><WealthEntryDetail /></LazyRoute>} />
        <Route path="/insights/cashflow" element={<LazyRoute name="Cashflow"><InsightsCashflowBreakdown /></LazyRoute>} />
        <Route path="/insights/pulse" element={<LazyRoute name="Pulse"><InsightsPulseBreakdown /></LazyRoute>} />
        <Route path="/money/insights" element={<LegacyInsightsRedirect />} />
        <Route path="/you/personal" element={<LazyRoute name="Personal"><YouPersonalPage /></LazyRoute>} />
        <Route path="/you/account" element={<LazyRoute name="Account"><YouAccountPage /></LazyRoute>} />
        <Route path="/you/money" element={<LazyRoute name="Money"><YouMoneyPage /></LazyRoute>} />
        <Route path="/you/appearance" element={<LazyRoute name="Appearance"><YouAppearancePage /></LazyRoute>} />
        <Route path="/you/security" element={<LazyRoute name="Security"><YouSecurityPage /></LazyRoute>} />
        <Route path="/you/backup" element={<LazyRoute name="Backup"><YouBackupPage /></LazyRoute>} />
        <Route path="/you/notifications" element={<LazyRoute name="Notifications"><YouNotificationsPage /></LazyRoute>} />
        <Route path="/you/permissions" element={<LazyRoute name="Permissions"><YouPermissionsPage /></LazyRoute>} />
        <Route path="/you/history" element={<LazyRoute name="History"><YouHistoryPage /></LazyRoute>} />
        <Route path="/you/support" element={<LazyRoute name="Support"><YouSupportPage /></LazyRoute>} />
        <Route path="/you/about" element={<LazyRoute name="About"><YouAboutPage /></LazyRoute>} />
        <Route path="/you/tools" element={<LazyRoute name="Tools"><YouToolsPage /></LazyRoute>} />
        <Route path="/you/plans" element={<LazyRoute name="Plans"><YouPlansPage /></LazyRoute>} />
        <Route path="/admin" element={<RequireAdmin><LazyRoute name="Admin"><Admin /></LazyRoute></RequireAdmin>} />
        <Route path="/privacy" element={<LazyRoute name="Privacy"><Privacy /></LazyRoute>} />
        <Route path="/emergency" element={<LazyRoute name="Emergency"><EmergencyMode /></LazyRoute>} />
        <Route path="/auth" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

function AuthGateShell() {
  return (
    <div className="ed-screen ed-auth-shell">
      <ThemeSync />
      <Routes>
        <Route path="/auth" element={<AuthGatePage />} />
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    </div>
  );
}

function OnboardingShell() {
  return (
    <Screen narrow>
      <ThemeSync />
      <AnalyticsBridge />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/privacy" element={<LazyRoute name="Privacy"><Privacy /></LazyRoute>} />
          <Route path="*" element={<Navigate to="/onboarding" replace />} />
        </Routes>
      </Suspense>
    </Screen>
  );
}

function MainShell() {
  return (
    <Screen>
      <ThemeSync />
      <ScrollToTop />
      <CloudSyncBridge />
      <SalaryDayBridge />
      <AnalyticsBridge />
      <Navbar />
      <NotificationSync />
      <LocalReminderSync />
      <PushNotificationBridge />
      <MainContent>
        <AppRoutes />
      </MainContent>
    </Screen>
  );
}

function AppShell() {
  const { settings, updateSettings } = usePerovo();
  const { isReady, isLoggedIn, user, profile, profileResolved, saveProfile } = useAuth();
  const isOnline = useOnlineStatus();
  const [authBootTimedOut, setAuthBootTimedOut] = useState(false);
  const hasBootstrapped =
    isReady ||
    (typeof sessionStorage !== "undefined" && sessionStorage.getItem("perovo_bootstrapped") === "1");
  const setupComplete = isAccountSetupComplete(settings, profile, user?.id);
  const authSeededRef = useRef(false);
  const settingsRef = useRef(settings);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    if (!isLoggedIn || !user?.id || authSeededRef.current) return;
    const key = STORAGE_KEYS.authSeeded(user.id);
    if (localStorage.getItem(key) === "1") {
      authSeededRef.current = true;
      return;
    }
    const s = settingsRef.current;
    const meta = user.user_metadata || {};
    const patch = {};
    if (!s.displayName && meta.display_name) patch.displayName = String(meta.display_name);
    if (!s.phoneNumber && meta.phone) patch.phoneNumber = normalizeIndianPhone(meta.phone);
    if (profile?.phone && !s.phoneNumber) patch.phoneNumber = normalizeIndianPhone(profile.phone);
    if ((!s.monthlyIncome || Number(s.monthlyIncome) <= 0) && Number(meta.monthly_income) > 0) {
      patch.monthlyIncome = Number(meta.monthly_income);
    }
    if (meta.user_mode) patch.userMode = String(meta.user_mode);
    if (profile?.onboarding_complete === true && !s.onboardingComplete) {
      patch.onboardingComplete = true;
    }
    if (Object.keys(patch).length > 0) updateSettings(patch);
    localStorage.setItem(key, "1");
    authSeededRef.current = true;
  }, [isLoggedIn, user, profile, updateSettings]);

  useEffect(() => {
    if (!isLoggedIn || !user?.id || !setupComplete) return;
    const key = STORAGE_KEYS.profileSeeded(user.id);
    if (localStorage.getItem(key) === "1") return;
    if (profile?.monthly_income != null || profile?.user_mode || profile?.onboarding_complete === true) {
      localStorage.setItem(key, "1");
      return;
    }
    saveProfile({
      username: settingsRef.current.displayName || profile?.username || "",
      display_name: settingsRef.current.displayName || "",
      phone: settingsRef.current.phoneNumber || profile?.phone || "",
      user_mode: settingsRef.current.userMode || "salaried",
      monthly_income: Number(settingsRef.current.monthlyIncome) || 0,
      onboarding_complete: true,
      pan: profile?.pan || "",
      pan_verified: Boolean(profile?.pan_verified),
    }).then(() => localStorage.setItem(key, "1")).catch(() => {});
  }, [isLoggedIn, user?.id, profile, saveProfile, setupComplete]);

  useEffect(() => {
    const timer = window.setTimeout(() => setAuthBootTimedOut(true), 12000);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isReady) sessionStorage.setItem("perovo_bootstrapped", "1");
  }, [isReady]);

  if (!isOnline && !hasBootstrapped) {
    return <OfflineScreen />;
  }

  const authStillBooting = !isReady || (isLoggedIn && !profileResolved);
  if (authStillBooting && !authBootTimedOut) return <BootShell />;

  if (shouldBrowserUseMarketingLanding() && !isLoggedIn) {
    window.location.replace(getMarketingLandingUrl());
    return <BootShell />;
  }

  if (!isLoggedIn) return <AuthGateShell />;
  if (!profile && !isSignupPending()) return <BootShell />;
  return (
    <CloudRestoreGate>
      {!setupComplete ? <OnboardingShell /> : <MainShell />}
    </CloudRestoreGate>
  );
}

function App() {
  return (
    <BrowserRouter basename={routerBasename()} useTransitions={false}>
      <AuthProvider>
        <PerovoProvider>
          <IntelProvider>
          <PerovoLocaleSync />
          <NetWorthProvider>
            <BrandDocumentSync />
            <ErrorBoundary>
              <Suspense fallback={<BootShell />}>
                <Routes>
                  <Route path="/auth/confirm" element={<AuthConfirmPage />} />
                  <Route
                    path="/emergency-access/:token"
                    element={
                      <Suspense fallback={<BootShell />}>
                        <EmergencyAccessView />
                      </Suspense>
                    }
                  />
                  <Route
                    path="/lend/offer"
                    element={
                      <RequireAuth>
                        <LazyRoute name="Lending offer">
                          <LendingOfferReview />
                        </LazyRoute>
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="*"
                    element={
                      <StartupUpdateGate>
                        <NativePermissionGate>
                          <AppShell />
                        </NativePermissionGate>
                      </StartupUpdateGate>
                    }
                  />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </NetWorthProvider>
          </IntelProvider>
        </PerovoProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
