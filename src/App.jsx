import {
  HashRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import { useContext, useEffect, useMemo } from "react";

import Sidebar from "./components/Sidebar";

import Home from "./Home";
import CreateNote from "./pages/CreateNote";
import ReadNote from "./pages/ReadNote";
import EditNote from "./pages/UpdateNote";
import FavNote from "./pages/FavNote";
import TrashNote from "./pages/TrashNote";
import Settings from "./pages/Settings";
import RestoreRoute from "./pages/RestoreRoute";
import Templates from "./pages/Templates";

import SignUp from "./pages/auth/sign-up";
import Login from "./pages/auth/sign-in";
import VerifyOtpPage from "./pages/auth/verify-otp";

import { SettingsContext } from "./store/Settings.context";
import { getThemeColors } from "./constants/Theme";

import { authClient } from "./lib/auth-client";

import ProfilePage from "./pages/Profile";
import { Toaster } from "./components/ui/toast";
import ResetPassword from "./pages/auth/reset-password";
import { cloudSync } from "./lib/cloud-sync";

function RouteTracker() {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname !== "/verify-otp") {
      localStorage.setItem("lastRoute", location.pathname);
    }
  }, [location.pathname]);

  return null;
}

function AuthRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route path="/login" element={<Login />} />

      <Route path="/sign-up" element={<SignUp />} />

      <Route path="/forgot-password" element={<ResetPassword />} />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function AppRoutes() {
  return (
    <div className="flex h-screen w-full">
      <Sidebar />

      <main className="flex-1 overflow-auto">
        <Routes>
          <Route path="/" element={<Home />} />

          <Route path="/profile" element={<ProfilePage />} />

          <Route path="/create-note" element={<CreateNote />} />

          <Route path="/read/note/:id" element={<ReadNote />} />

          <Route path="/edit/note/:id" element={<EditNote />} />

          <Route path="/favorites" element={<FavNote />} />

          <Route path="/trash" element={<TrashNote />} />

          <Route path="/settings" element={<Settings />} />

          <Route path="/templates" element={<Templates />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function AppContent() {
  const location = useLocation();

  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return (
      <div className="flex h-screen items-center justify-center">
        Loading...
      </div>
    );
  }

  if (location.pathname === "/verify-otp") {
    return <VerifyOtpPage />;
  }

  return (
    <>
      {session ? (
        <>
          <RestoreRoute />
          <AppRoutes />
        </>
      ) : (
        <AuthRoutes />
      )}
    </>
  );
}

function App() {
  useEffect(() => {
    const runSync = async () => {
      try {
        console.log("Syncing notes...");

        const result = await cloudSync();

        console.log("Sync completed:", result);
      } catch (error) {
        console.error("Cloud sync failed:", error);
      }
    };

    void runSync();
  }, []);

  const { settings } = useContext(SettingsContext);

  const colors = useMemo(
    () => getThemeColors(settings.theme, settings.accent_color),
    [settings.theme, settings.accent_color],
  );

  const fontSize = useMemo(() => settings.font_size, [settings.font_size]);

  const wordWrap = useMemo(() => settings.word_wrap, [settings.word_wrap]);

  useEffect(() => {
    document.body.setAttribute("data-font-size", fontSize);

    document.body.setAttribute(
      "data-word-wrap",
      Boolean(Number(wordWrap)).toString(),
    );
  }, [fontSize, wordWrap]);

  return (
    <HashRouter>
      <RouteTracker />

      <div
        className="min-h-screen"
        style={{
          backgroundColor: colors.bgPrimary,
          color: colors.textPrimary,
        }}
      >
        <AppContent />
      </div>
      <Toaster />
    </HashRouter>
  );
}

export default App;
