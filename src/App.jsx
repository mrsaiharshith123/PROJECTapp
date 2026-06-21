import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { routerBasename } from "./utils/basePath.js";
import { isCustomerModeEnabled } from "./utils/embeddedApp.js";
import { isUpdateTestShell } from "./utils/updateTestShell.js";
import { PerovoProvider, usePerovo } from "./context/PerovoContext.jsx";
import { NetWorthProvider } from "./context/NetWorthContext.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import { Navbar, InstallAppBanner, Screen, MainContent, PageLoader, RouteFallback } from "./ui";
import Onboarding from "./ui/features/pages/OnboardingPage.jsx";
import AuthGatePage from "./ui/features/auth/AuthGatePage.jsx";
import ModeRoute from "./app/ModeRoute.jsx";
import NotificationSync from "./app/NotificationSync.jsx";
import ThemeSync from "./app/ThemeSync.jsx";
import BrandDocumentSync from "./app/BrandDocumentSync.jsx";
import CloudSyncBridge from "./app/CloudSyncBridge.jsx";
import HouseholdRoomBridge from "./app/HouseholdRoomBridge.jsx";
import SalaryDayBridge from "./app/SalaryDayBridge.jsx";
import AnalyticsBridge from "./app/AnalyticsBridge.jsx";
import RequireAdmin from "./app/RequireAdmin.jsx";
import { isAccountSetupComplete } from "./utils/profileSetup.js";
import { normalizeIndianPhone } from "./utils/phone.js";
import { isSignupPending } from "./utils/authSessionCleanup.js";
import { I18nProvider, PerovoLocaleSync } from "./i18n/index.js";
import ErrorBoundary from "./ui/layout/ErrorBoundary.jsx";
import { DevFloatingButton } from "./ui/dev/DevFloatingButton.jsx";
import WebLandingPage from "./ui/features/pages/WebLandingPage.jsx";
import PrivacyPage from "./ui/features/pages/PrivacyPage.jsx";
import AuthConfirmPage from "./ui/features/auth/AuthConfirmPage.jsx";
import UpdateTestShellApp from "./app/UpdateTestShellApp.jsx";

const Home = lazy(() => import("./ui/features/pages/HomePage.jsx"));
const Commitments = lazy(() => import("./ui/features/pages/CommitmentsPage.jsx"));
const Spends = lazy(() => import("./ui/features/pages/SpendsPage.jsx"));
const Add = lazy(() => import("./ui/features/pages/AddPage.jsx"));
const Lending = lazy(() => import("./ui/features/pages/LendingPage.jsx"));
const Profile = lazy(() => import("./ui/features/pages/ProfilePage.jsx"));
const ProfileScoresDetail = lazy(() => import("./ui/features/pages/ProfileScoresDetailPage.jsx"));
const Analytics = lazy(() => import("./ui/features/pages/AnalyticsPage.jsx"));
const MoneyShell = lazy(() => import("./ui/features/pages/MoneyShellPage.jsx"));
const Plan = lazy(() => import("./ui/features/pages/PlanPage.jsx"));
const ProfileWealthAnalytics = lazy(() => import("./ui/features/pages/ProfileWealthAnalyticsPage.jsx"));
const Tools = lazy(() => import("./app/ToolsRedirect.jsx"));
const LendingOfferReview = lazy(() => import("./ui/features/pages/LendingOfferReviewPage.jsx"));
const Privacy = lazy(() => import("./ui/features/pages/PrivacyPage.jsx"));
const Admin = lazy(() => import("./ui/features/pages/AdminPage.jsx"));
const YouPersonalPage = lazy(() => import("./ui/features/profile/pages/YouPersonalPage.jsx"));
const YouAccountPage = lazy(() => import("./ui/features/profile/pages/YouAccountPage.jsx"));
const YouMoneyPage = lazy(() => import("./ui/features/profile/pages/YouMoneyPage.jsx"));
const YouHouseholdPage = lazy(() => import("./ui/features/profile/pages/YouHouseholdPage.jsx"));
const YouAppearancePage = lazy(() => import("./ui/features/profile/pages/YouAppearancePage.jsx"));
const YouSecurityPage = lazy(() => import("./ui/features/profile/pages/YouSecurityPage.jsx"));
const YouBackupPage = lazy(() => import("./ui/features/profile/pages/YouBackupPage.jsx"));
const YouNotificationsPage = lazy(() => import("./ui/features/profile/pages/YouNotificationsPage.jsx"));
const YouHistoryPage = lazy(() => import("./ui/features/profile/pages/YouHistoryPage.jsx"));
const YouSupportPage = lazy(() => import("./ui/features/profile/pages/YouSupportPage.jsx"));
const YouAboutPage = lazy(() => import("./ui/features/profile/pages/YouAboutPage.jsx"));
const YouPlansPage = lazy(() => import("./ui/features/profile/pages/YouPlansPage.jsx"));
const HouseholdRoom = lazy(() => import("./ui/features/household/HouseholdRoomPage.jsx"));
const DevPanel = lazy(() => import("./ui/features/dev/DevPanel.jsx"));

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
      <div className="mb-6">
        <InstallAppBanner />
      </div>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/privacy" element={<Privacy />} />
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
      <CloudSyncBridge />
      <HouseholdRoomBridge />
      <SalaryDayBridge />
      <AnalyticsBridge />
      <Navbar />
      <NotificationSync />
      <MainContent>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/money" element={<MoneyShell />}>
              <Route index element={<Navigate to="bills" replace />} />
              <Route path="bills" element={<Commitments />} />
              <Route path="spends" element={<Spends />} />
              <Route
                path="lending"
                element={
                  <ModeRoute path="/money/lending">
                    <Lending />
                  </ModeRoute>
                }
              />
              <Route path="insights" element={<Analytics />} />
            </Route>
            <Route path="/commitments" element={<Navigate to="/money/bills" replace />} />
            <Route path="/lending" element={<Navigate to="/money/lending" replace />} />
            <Route path="/analytics" element={<Navigate to="/money/insights" replace />} />
            <Route path="/plan" element={<Plan />} />
            <Route path="/tools" element={<Navigate to="/plan" replace />} />
            <Route path="/" element={<Home />} />
            <Route path="/add" element={<Add />} />
            <Route path="/paycheck" element={<Navigate to="/money/insights" replace />} />
            <Route path="/family-room" element={<HouseholdRoom />} />
            <Route path="/profile/analytics" element={<ProfileWealthAnalytics />} />
            <Route path="/net-worth" element={<ProfileWealthAnalytics />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/scores" element={<ProfileScoresDetail />} />
            <Route path="/you/personal" element={<YouPersonalPage />} />
            <Route path="/you/account" element={<YouAccountPage />} />
            <Route path="/you/money" element={<YouMoneyPage />} />
            <Route path="/you/household" element={<YouHouseholdPage />} />
            <Route path="/you/appearance" element={<YouAppearancePage />} />
            <Route path="/you/security" element={<YouSecurityPage />} />
            <Route path="/you/backup" element={<YouBackupPage />} />
            <Route path="/you/notifications" element={<YouNotificationsPage />} />
            <Route path="/you/history" element={<YouHistoryPage />} />
            <Route path="/you/support" element={<YouSupportPage />} />
            <Route path="/you/about" element={<YouAboutPage />} />
            <Route path="/you/plans" element={<YouPlansPage />} />
            <Route
              path="/admin"
              element={
                <RequireAdmin>
                  <Admin />
                </RequireAdmin>
              }
            />
            {import.meta.env.DEV ? <Route path="/dev" element={<DevPanel />} /> : null}
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/auth" element={<Navigate to="/profile" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </MainContent>
      {import.meta.env.DEV ? <DevFloatingButton /> : null}
    </Screen>
  );
}

/** Signed-in only; onboarding until profile setup complete. */
function AppShell() {
  const { settings, updateSettings } = usePerovo();
  const { isReady, isLoggedIn, user, profile, profileResolved, saveProfile } = useAuth();
  const setupComplete = isAccountSetupComplete(settings, profile, user?.id);

  useEffect(() => {
    if (!isLoggedIn || !user?.id) return;
    const meta = user.user_metadata || {};
    const key = `perovo_auth_seeded_${user.id}`;
    if (localStorage.getItem(key) === "1") return;

    const patch = {};
    if (!settings.displayName && meta.display_name) patch.displayName = String(meta.display_name);
    if (!settings.phoneNumber && meta.phone) patch.phoneNumber = normalizeIndianPhone(meta.phone);
    if (profile?.phone && !settings.phoneNumber) patch.phoneNumber = normalizeIndianPhone(profile.phone);
    if ((!settings.monthlyIncome || Number(settings.monthlyIncome) <= 0) && Number(meta.monthly_income) > 0) {
      patch.monthlyIncome = Number(meta.monthly_income);
    }
    if (meta.user_mode) patch.userMode = String(meta.user_mode);
    // Local-first: only seed household scope when not already chosen on this device.
    if (
      meta.household_scope &&
      settings.householdScope !== "family" &&
      settings.householdScope !== "single"
    ) {
      patch.householdScope = meta.household_scope === "family" ? "family" : "single";
    }
    if (profile?.onboarding_complete === true && !settings.onboardingComplete) {
      patch.onboardingComplete = true;
    }
    if (!profile) {
      patch.onboardingComplete = false;
    }

    if (Object.keys(patch).length > 0) {
      updateSettings(patch);
    }
    localStorage.setItem(key, "1");
  }, [isLoggedIn, user, profile, settings, updateSettings]);

  useEffect(() => {
    if (!isLoggedIn || !user?.id || !setupComplete) return;
    const key = `perovo_profile_seeded_${user.id}`;
    if (localStorage.getItem(key) === "1") return;
    if (profile?.monthly_income != null || profile?.user_mode || profile?.onboarding_complete === true) {
      localStorage.setItem(key, "1");
      return;
    }
    saveProfile({
      username: settings.displayName || profile?.username || "",
      display_name: settings.displayName || "",
      phone: settings.phoneNumber || profile?.phone || "",
      user_mode: settings.userMode || "salaried",
      household_scope: settings.householdScope || "single",
      monthly_income: Number(settings.monthlyIncome) || 0,
      onboarding_complete: true,
      pan: profile?.pan || "",
      pan_verified: Boolean(profile?.pan_verified),
    })
      .then(() => {
        localStorage.setItem(key, "1");
      })
      .catch(() => {
        /* Keep app usable even when DB schema does not yet include onboarding columns. */
      });
  }, [isLoggedIn, user, profile, settings, saveProfile, setupComplete]);

  if (!isReady || (isLoggedIn && !profileResolved)) {
    return <PageLoader />;
  }

  if (!isLoggedIn) {
    return <AuthGateShell />;
  }

  if (!profile && !isSignupPending()) {
    return <AuthGateShell />;
  }

  if (!setupComplete) {
    return <OnboardingShell />;
  }

  return <MainShell />;
}

function RequireAuth({ children }) {
  const { isReady, isLoggedIn } = useAuth();
  if (!isReady) return <PageLoader />;
  if (!isLoggedIn) return <Navigate to="/auth" replace />;
  return children;
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
  if (isUpdateTestShell()) {
    return <UpdateTestShellApp />;
  }

  if (isCustomerModeEnabled()) {
    return <MarketingShell />;
  }

  return (
    <BrowserRouter basename={routerBasename()}>
      <I18nProvider>
        <AuthProvider>
          <PerovoProvider>
            <PerovoLocaleSync />
            <NetWorthProvider>
            <BrandDocumentSync />
            <ErrorBoundary>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/auth/confirm" element={<AuthConfirmPage />} />
                  <Route
                    path="/lend/offer"
                    element={
                      <RequireAuth>
                        <LendingOfferReview />
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
      </I18nProvider>
    </BrowserRouter>
  );
}

export default App;
