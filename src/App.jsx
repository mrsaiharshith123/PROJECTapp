import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { routerBasename } from "./utils/basePath.js";
import { CommitTrackProvider, useCommitTrack } from "./context/CommitTrackContext.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import { Navbar, InstallAppBanner, Screen, MainContent } from "./ui";
import Onboarding from "./ui/features/pages/OnboardingPage.jsx";
import ModeRoute from "./app/ModeRoute.jsx";
import NotificationSync from "./app/NotificationSync.jsx";
import ThemeSync from "./app/ThemeSync.jsx";
import AccountPanel from "./ui/features/auth/AccountPanel.jsx";

const Home = lazy(() => import("./ui/features/pages/HomePage.jsx"));
const Commitments = lazy(() => import("./ui/features/pages/CommitmentsPage.jsx"));
const Add = lazy(() => import("./ui/features/pages/AddPage.jsx"));
const Lending = lazy(() => import("./ui/features/pages/LendingPage.jsx"));
const Profile = lazy(() => import("./ui/features/pages/ProfilePage.jsx"));
const Analytics = lazy(() => import("./ui/features/pages/AnalyticsPage.jsx"));
const Tools = lazy(() => import("./app/ToolsRedirect.jsx"));
const LendingOfferReview = lazy(() => import("./ui/features/pages/LendingOfferReviewPage.jsx"));

function PageLoader() {
  return (
    <div className="ct-loader ct-caption" role="status">
      Loading…
    </div>
  );
}

function OnboardingShell() {
  return (
    <Screen narrow>
      <ThemeSync />
      <div className="mb-6">
        <InstallAppBanner />
      </div>
      <Routes>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    </Screen>
  );
}

function MainShell() {
  return (
    <Screen>
      <ThemeSync />
      <Navbar />
      <NotificationSync />
      <MainContent>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/commitments" element={<Commitments />} />
            <Route path="/add" element={<Add />} />
            <Route
              path="/lending"
              element={
                <ModeRoute path="/lending">
                  <Lending />
                </ModeRoute>
              }
            />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/tools" element={<Tools />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/onboarding" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </MainContent>
    </Screen>
  );
}

function AuthShell() {
  return (
    <Screen narrow>
      <ThemeSync />
      <div className="mb-6">
        <InstallAppBanner />
      </div>
      <AccountPanel />
      <p className="ct-caption ct-caption-center mt-4">Login or create account to continue.</p>
    </Screen>
  );
}

function AppShell() {
  const { settings, updateSettings } = useCommitTrack();
  const { isReady, isLoggedIn, user, profile, saveProfile } = useAuth();
  const onboarded = Boolean(settings?.onboardingComplete);

  useEffect(() => {
    if (!isLoggedIn || !user?.id) return;
    const meta = user.user_metadata || {};
    const key = `committrack_auth_seeded_${user.id}`;
    if (localStorage.getItem(key) === "1") return;

    const patch = {};
    if (!settings.displayName && meta.display_name) patch.displayName = String(meta.display_name);
    if ((!settings.monthlyIncome || Number(settings.monthlyIncome) <= 0) && Number(meta.monthly_income) > 0) {
      patch.monthlyIncome = Number(meta.monthly_income);
    }
    if (meta.user_mode) patch.userMode = String(meta.user_mode);
    if (meta.household_scope) patch.householdScope = meta.household_scope === "family" ? "family" : "single";
    if (!settings.onboardingComplete && meta.onboarding_complete === true) patch.onboardingComplete = true;

    if (Object.keys(patch).length > 0) {
      updateSettings(patch);
    }
    localStorage.setItem(key, "1");
  }, [isLoggedIn, user, settings, updateSettings]);

  useEffect(() => {
    if (!isLoggedIn || !user?.id || !settings?.onboardingComplete) return;
    const key = `committrack_profile_seeded_${user.id}`;
    if (localStorage.getItem(key) === "1") return;
    if (profile?.monthly_income != null || profile?.user_mode || profile?.onboarding_complete === true) {
      localStorage.setItem(key, "1");
      return;
    }
    saveProfile({
      username: settings.displayName || profile?.username || "",
      display_name: settings.displayName || "",
      user_mode: settings.userMode || "salaried",
      household_scope: settings.householdScope || "single",
      monthly_income: Number(settings.monthlyIncome) || 0,
      business_type: settings.businessType || "",
      onboarding_complete: true,
      pan: profile?.pan || "",
      pan_verified: Boolean(profile?.pan_verified),
    })
      .then(() => {
        localStorage.setItem(key, "1");
      })
      .catch(() => {
        // Keep app usable even when DB schema does not yet include onboarding columns.
      });
  }, [isLoggedIn, user, profile, settings, saveProfile]);

  if (!isReady) {
    return <PageLoader />;
  }

  if (!isLoggedIn) {
    return <AuthShell />;
  }

  if (!onboarded) {
    return <OnboardingShell />;
  }

  return <MainShell />;
}

function App() {
  return (
    <BrowserRouter basename={routerBasename()}>
      <AuthProvider>
        <CommitTrackProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/lend/offer" element={<LendingOfferReview />} />
              <Route path="*" element={<AppShell />} />
            </Routes>
          </Suspense>
        </CommitTrackProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
