import { lazy, Suspense, useEffect, useRef } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { routerBasename } from "./utils/basePath.js";
import { isCustomerModeEnabled } from "./utils/embeddedApp.js";
import { isUpdateTestShell } from "./utils/updateTestShell.js";
import { PerovoProvider, usePerovo } from "./context/PerovoContext.jsx";
import { NetWorthProvider } from "./context/NetWorthContext.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import { Navbar, InstallAppBanner, Screen, MainContent, RouteFallback } from "./ui";
import { I18nProvider, PerovoLocaleSync } from "./i18n/index.js";
import ErrorBoundary from "./ui/layout/ErrorBoundary.jsx";
import WebLandingPage from "./ui/features/pages/WebLandingPage.jsx";
import PrivacyPage from "./ui/features/pages/PrivacyPage.jsx";
import AuthConfirmPage from "./ui/features/auth/AuthConfirmPage.jsx";
import UpdateTestShellApp from "./app/UpdateTestShellApp.jsx";
import AuthGatePage from "./ui/features/auth/AuthGatePage.jsx";
import ScrollToTop from "./app/ScrollToTop.jsx";
import NotificationSync from "./app/NotificationSync.jsx";
import ThemeSync from "./app/ThemeSync.jsx";
import BrandDocumentSync from "./app/BrandDocumentSync.jsx";
import CloudSyncBridge from "./app/CloudSyncBridge.jsx";
import HouseholdRoomBridge from "./app/HouseholdRoomBridge.jsx";
import SalaryDayBridge from "./app/SalaryDayBridge.jsx";
import AnalyticsBridge from "./app/AnalyticsBridge.jsx";
import BootShell from "./boot/BootShell.jsx";
import { isAccountSetupComplete } from "./utils/profileSetup.js";
import { normalizeIndianPhone } from "./utils/phone.js";
import { isSignupPending } from "./utils/authSessionCleanup.js";
import Onboarding from "./ui/features/pages/OnboardingPage.jsx";
import { AdminFloatingButton } from "./ui/admin/AdminFloatingButton.jsx";

/** Eager — bottom nav pages load instantly with no Suspense stall on tap */
import Home from "./ui/features/pages/HomePage.jsx";
import Ledger from "./ui/features/pages/LedgerPage.jsx";
import Agreements from "./ui/features/pages/AgreementsPage.jsx";
import Add from "./ui/features/pages/AddPage.jsx";
import Profile from "./ui/features/pages/YouPage.jsx";
import MoneyShell from "./ui/features/pages/MoneyShellPage.jsx";
import Commitments from "./ui/features/pages/CommitmentsPage.jsx";
import Spends from "./ui/features/pages/SpendsPage.jsx";

const LendingOfferReview = lazy(() => import("./ui/features/pages/LendingOfferReviewPage.jsx"));
const ProfileScoresDetail = lazy(() => import("./ui/features/pages/ProfileScoresDetailPage.jsx"));
const ScoreDetail = lazy(() => import("./ui/features/pages/ScoreDetailPage.jsx"));
const Analytics = lazy(() => import("./ui/features/pages/AnalyticsPage.jsx"));
const MoneyWealth = lazy(() => import("./ui/features/pages/MoneyWealthPage.jsx"));
const YouToolsPage = lazy(() => import("./ui/features/profile/pages/YouToolsPage.jsx"));
const Privacy = lazy(() => import("./ui/features/pages/PrivacyPage.jsx"));
const Admin = lazy(() => import("./ui/features/pages/AdminPage.jsx"));
const YouPersonalPage = lazy(() => import("./ui/features/profile/pages/YouPersonalPage.jsx"));
const YouAccountPage = lazy(() => import("./ui/features/profile/pages/YouAccountPage.jsx"));
const YouMoneyPage = lazy(() => import("./ui/features/profile/pages/YouMoneyPage.jsx"));
// Household UI reserved for v1.1 — routes redirect; lazy imports keep modules reachable for audit.
// eslint-disable-next-line no-unused-vars -- v1.1 household routes
const YouHouseholdPage = lazy(() => import("./ui/features/profile/pages/YouHouseholdPage.jsx"));
const YouAppearancePage = lazy(() => import("./ui/features/profile/pages/YouAppearancePage.jsx"));
const YouSecurityPage = lazy(() => import("./ui/features/profile/pages/YouSecurityPage.jsx"));
const YouBackupPage = lazy(() => import("./ui/features/profile/pages/YouBackupPage.jsx"));
const YouNotificationsPage = lazy(() => import("./ui/features/profile/pages/YouNotificationsPage.jsx"));
const YouHistoryPage = lazy(() => import("./ui/features/profile/pages/YouHistoryPage.jsx"));
const YouSupportPage = lazy(() => import("./ui/features/profile/pages/YouSupportPage.jsx"));
const YouAboutPage = lazy(() => import("./ui/features/profile/pages/YouAboutPage.jsx"));
const YouPlansPage = lazy(() => import("./ui/features/profile/pages/YouPlansPage.jsx"));
// eslint-disable-next-line no-unused-vars -- v1.1 household routes
const HouseholdRoom = lazy(() => import("./ui/features/household/HouseholdRoomPage.jsx"));
function RequireAdmin({ children }) {
  const { isAdmin } = useAuth();
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
}

function RequireAuth({ children }) {
  const { isReady, isLoggedIn } = useAuth();
  if (!isReady) return <BootShell />;
  if (!isLoggedIn) return <Navigate to="/auth" replace />;
  return children;
}

function AppRoutes() {
  const location = useLocation();
  return (
    <Suspense fallback={<RouteFallback />} key={location.key}>
      <Routes location={location}>
        <Route path="/" element={<Home />} />
        <Route path="/ledger" element={<Ledger />} />
        <Route path="/agreements" element={<Agreements />} />
        <Route path="/add" element={<Add />} />
        <Route path="/you" element={<Profile />} />
        <Route path="/money" element={<MoneyShell />}>
          <Route index element={<Navigate to="bills" replace />} />
          <Route path="bills" element={<Commitments />} />
          <Route path="spends" element={<Spends />} />
        </Route>
        <Route path="/money/lending" element={<Navigate to="/agreements" replace />} />
        <Route path="/money/insights" element={<Suspense fallback={<RouteFallback />}><Analytics /></Suspense>} />
        <Route path="/money/wealth" element={<Suspense fallback={<RouteFallback />}><MoneyWealth /></Suspense>} />
        <Route path="/commitments" element={<Navigate to="/money/bills" replace />} />
        <Route path="/lending" element={<Navigate to="/agreements" replace />} />
        <Route path="/analytics" element={<Navigate to="/money/insights" replace />} />
        <Route path="/plan" element={<Navigate to="/you/tools" replace />} />
        <Route path="/tools" element={<Navigate to="/you/tools" replace />} />
        <Route path="/paycheck" element={<Navigate to="/money/insights" replace />} />
        <Route path="/family-room" element={<Navigate to="/you" replace />} />
        <Route path="/profile/analytics" element={<Navigate to="/money/wealth" replace />} />
        <Route path="/net-worth" element={<Navigate to="/ledger" replace />} />
        <Route path="/profile" element={<Navigate to="/you" replace />} />
        <Route path="/profile/scores" element={<Suspense fallback={<RouteFallback />}><ProfileScoresDetail /></Suspense>} />
        <Route path="/score-detail" element={<Suspense fallback={<RouteFallback />}><ScoreDetail /></Suspense>} />
        <Route path="/you/personal" element={<Suspense fallback={<RouteFallback />}><YouPersonalPage /></Suspense>} />
        <Route path="/you/account" element={<Suspense fallback={<RouteFallback />}><YouAccountPage /></Suspense>} />
        <Route path="/you/money" element={<Suspense fallback={<RouteFallback />}><YouMoneyPage /></Suspense>} />
        <Route path="/you/household" element={<Navigate to="/you" replace />} />
        <Route path="/you/appearance" element={<Suspense fallback={<RouteFallback />}><YouAppearancePage /></Suspense>} />
        <Route path="/you/security" element={<Suspense fallback={<RouteFallback />}><YouSecurityPage /></Suspense>} />
        <Route path="/you/backup" element={<Suspense fallback={<RouteFallback />}><YouBackupPage /></Suspense>} />
        <Route path="/you/notifications" element={<Suspense fallback={<RouteFallback />}><YouNotificationsPage /></Suspense>} />
        <Route path="/you/history" element={<Suspense fallback={<RouteFallback />}><YouHistoryPage /></Suspense>} />
        <Route path="/you/support" element={<Suspense fallback={<RouteFallback />}><YouSupportPage /></Suspense>} />
        <Route path="/you/about" element={<Suspense fallback={<RouteFallback />}><YouAboutPage /></Suspense>} />
        <Route path="/you/tools" element={<Suspense fallback={<RouteFallback />}><YouToolsPage /></Suspense>} />
        <Route path="/you/plans" element={<Suspense fallback={<RouteFallback />}><YouPlansPage /></Suspense>} />
        <Route path="/admin" element={<RequireAdmin><Suspense fallback={<RouteFallback />}><Admin /></Suspense></RequireAdmin>} />
        <Route path="/privacy" element={<Suspense fallback={<RouteFallback />}><Privacy /></Suspense>} />
        <Route path="/auth" element={<Navigate to="/you" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

function AuthGateShell() {
  return (
    <div className="ct-screen ct-auth-shell">
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
      <div className="mb-6"><InstallAppBanner /></div>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/privacy" element={<PrivacyPage />} />
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
      <HouseholdRoomBridge />
      <SalaryDayBridge />
      <AnalyticsBridge />
      <Navbar />
      <NotificationSync />
      <MainContent>
        <AppRoutes />
      </MainContent>
      <AdminFloatingButton />
    </Screen>
  );
}

function AppShell() {
  const { settings, updateSettings } = usePerovo();
  const { isReady, isLoggedIn, user, profile, profileResolved, saveProfile } = useAuth();
  const setupComplete = isAccountSetupComplete(settings, profile, user?.id);
  const authSeededRef = useRef(false);
  const settingsRef = useRef(settings);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    if (!isLoggedIn || !user?.id || authSeededRef.current) return;
    const key = `perovo_auth_seeded_${user.id}`;
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
    if (meta.household_scope && s.householdScope !== "family" && s.householdScope !== "single") {
      patch.householdScope = meta.household_scope === "family" ? "family" : "single";
    }
    if (profile?.onboarding_complete === true && !s.onboardingComplete) {
      patch.onboardingComplete = true;
    }
    if (Object.keys(patch).length > 0) updateSettings(patch);
    localStorage.setItem(key, "1");
    authSeededRef.current = true;
  }, [isLoggedIn, user, profile, updateSettings]);

  useEffect(() => {
    if (!isLoggedIn || !user?.id || !setupComplete) return;
    const key = `perovo_profile_seeded_${user.id}`;
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
      household_scope: settingsRef.current.householdScope || "single",
      monthly_income: Number(settingsRef.current.monthlyIncome) || 0,
      onboarding_complete: true,
      pan: profile?.pan || "",
      pan_verified: Boolean(profile?.pan_verified),
    }).then(() => localStorage.setItem(key, "1")).catch(() => {});
  }, [isLoggedIn, user?.id, profile, saveProfile, setupComplete]);

  if (!isReady || (isLoggedIn && !profileResolved)) return <BootShell />;
  if (!isLoggedIn) return <AuthGateShell />;
  if (!profile && !isSignupPending()) return <AuthGateShell />;
  if (!setupComplete) return <OnboardingShell />;
  return <MainShell />;
}

function MarketingShell() {
  return (
    <BrowserRouter basename={routerBasename()}>
      <I18nProvider standalone>
        <ErrorBoundary>
          <Routes>
            <Route path="/auth/confirm" element={<AuthConfirmPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="*" element={<WebLandingPage />} />
          </Routes>
        </ErrorBoundary>
      </I18nProvider>
    </BrowserRouter>
  );
}

function App() {
  if (isUpdateTestShell()) return <UpdateTestShellApp />;
  if (isCustomerModeEnabled()) return <MarketingShell />;

  return (
    <BrowserRouter basename={routerBasename()} useTransitions={false}>
      <AuthProvider>
        <PerovoProvider>
          <PerovoLocaleSync />
          <NetWorthProvider>
            <BrandDocumentSync />
            <ErrorBoundary>
              <Suspense fallback={<BootShell />}>
                <Routes>
                  <Route path="/auth/confirm" element={<AuthConfirmPage />} />
                  <Route
                    path="/lend/offer"
                    element={
                      <RequireAuth>
                        <Suspense fallback={<RouteFallback />}>
                          <LendingOfferReview />
                        </Suspense>
                      </RequireAuth>
                    }
                  />
                  <Route path="*" element={<AppShell />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </NetWorthProvider>
        </PerovoProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
