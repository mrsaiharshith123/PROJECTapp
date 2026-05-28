import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { routerBasename } from "./utils/basePath.js";
import { CommitTrackProvider, useCommitTrack } from "./context/CommitTrackContext.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import { isEnhancedUi } from "./constants/uiTheme.js";
import Navbar from "./components/Navbar";
import Onboarding from "./pages/Onboarding.jsx";
import ModeRoute from "./components/ModeRoute.jsx";
import NotificationSync from "./components/NotificationSync.jsx";
import ThemeSync from "./components/ThemeSync.jsx";
import InstallAppBanner from "./components/InstallAppBanner.jsx";
import AccountPanel from "./components/auth/AccountPanel.jsx";

const Home = lazy(() => import("./pages/Home"));
const Commitments = lazy(() => import("./pages/Commitments"));
const Add = lazy(() => import("./pages/Add"));
const Lending = lazy(() => import("./pages/Lending"));
const Profile = lazy(() => import("./pages/Profile"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Tools = lazy(() => import("./pages/Tools"));
const LendingOfferReview = lazy(() => import("./pages/LendingOfferReview.jsx"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center py-16 text-sm text-gray-500" role="status">
      Loading…
    </div>
  );
}

function OnboardingShell() {
  const enhanced = isEnhancedUi();
  return (
    <div className={`min-h-screen px-4 max-w-lg mx-auto py-8 ${enhanced ? "ui-screen-bg" : "bg-gray-100 dark:bg-slate-950"}`}>
      <ThemeSync />
      <div className="mb-6">
        <InstallAppBanner />
      </div>
      <Routes>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    </div>
  );
}

function MainShell() {
  const enhanced = isEnhancedUi();
  return (
    <div className={`min-h-screen ${enhanced ? "ui-screen-bg" : "bg-gray-100 dark:bg-slate-950"}`}>
      <ThemeSync />
      <Navbar />
      <NotificationSync />
      <main className="md:pt-[4.5rem] pb-[calc(5rem+env(safe-area-inset-bottom,0px))] md:pb-8 px-4 max-w-2xl mx-auto">
        <div className="pt-6">
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
        </div>
      </main>
    </div>
  );
}

function AuthShell() {
  const enhanced = isEnhancedUi();
  return (
    <div className={`min-h-screen px-4 max-w-lg mx-auto py-8 ${enhanced ? "ui-screen-bg" : "bg-gray-100 dark:bg-slate-950"}`}>
      <ThemeSync />
      <div className="mb-6">
        <InstallAppBanner />
      </div>
      <AccountPanel />
      <p className="text-center text-xs text-gray-500 dark:text-slate-400 mt-4">
        Login or create account to continue.
      </p>
    </div>
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
