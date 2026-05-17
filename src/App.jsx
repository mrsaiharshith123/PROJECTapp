import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { routerBasename } from "./utils/basePath.js";
import { CommitTrackProvider, useCommitTrack } from "./context/CommitTrackContext.jsx";
import Navbar from "./components/Navbar";
import Onboarding from "./pages/Onboarding.jsx";
import ModeRoute from "./components/ModeRoute.jsx";
import NotificationSync from "./components/NotificationSync.jsx";
import ThemeSync from "./components/ThemeSync.jsx";
import InstallAppBanner from "./components/InstallAppBanner.jsx";

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
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-slate-950 px-4 max-w-lg mx-auto py-8">
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
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-slate-950">
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

function AppShell() {
  const { settings } = useCommitTrack();
  const onboarded = Boolean(settings?.onboardingComplete);

  if (!onboarded) {
    return <OnboardingShell />;
  }

  return <MainShell />;
}

function App() {
  return (
    <BrowserRouter basename={routerBasename()}>
      <CommitTrackProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/lend/offer" element={<LendingOfferReview />} />
            <Route path="*" element={<AppShell />} />
          </Routes>
        </Suspense>
      </CommitTrackProvider>
    </BrowserRouter>
  );
}

export default App;
