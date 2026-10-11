
import {
  createHashRouter,
  RouterProvider,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import {
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

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
import ProfilePage from "./pages/Profile";

import SignUp from "./pages/auth/sign-up";
import Login from "./pages/auth/sign-in";
import VerifyOtpPage from "./pages/auth/verify-otp";
import ResetPassword from "./pages/auth/reset-password";

import { SettingsContext } from "./store/Settings.context";
import { getThemeColors } from "./constants/Theme";
import { authClient } from "./lib/auth-client";
import { Toaster } from "./components/ui/toast";
import { cloudSync } from "./lib/cloud-sync";





function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    () => navigator.onLine
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}





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
      <Route
        path="/"
        element={<Navigate to="/login" replace />}
      />

      <Route path="/login" element={<Login />} />
      <Route path="/sign-up" element={<SignUp />} />

      <Route
        path="/forgot-password"
        element={<ResetPassword />}
      />

      <Route
        path="*"
        element={<Navigate to="/login" replace />}
      />
    </Routes>
  );
}





function AppRoutes({ offlineMode = false }) {
  return (
    <div className="flex h-screen w-full">
      <Sidebar offlineMode={offlineMode} />

      <main className="min-w-0 flex-1 overflow-auto">
        <Routes>
          <Route path="/" element={<Home />} />

          <Route
            path="/create-note"
            element={<CreateNote />}
          />

          <Route
            path="/read/note/:id"
            element={<ReadNote />}
          />

          <Route
            path="/edit/note/:id"
            element={<EditNote />}
          />

          <Route
            path="/favorites"
            element={<FavNote />}
          />

          <Route
            path="/trash"
            element={<TrashNote />}
          />

          <Route
            path="/templates"
            element={<Templates />}
          />

          {/*
            User/account pages are unavailable offline.
          */}
          {!offlineMode && (
            <>
              <Route
                path="/profile"
                element={<ProfilePage />}
              />

              <Route
                path="/settings"
                element={<Settings />}
              />
            </>
          )}

          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />
        </Routes>
      </main>
    </div>
  );
}





function AppContent({ isOnline }) {
  const location = useLocation();

  const {
    data: session,
    isPending,
  } = authClient.useSession();

 
  if (!isOnline) {
    return <AppRoutes offlineMode />;
  }

 
  if (isPending) {
    return (
      <div className="flex h-screen items-center justify-center">
        Checking your session...
      </div>
    );
  }

 
  if (location.pathname === "/verify-otp") {
    return <VerifyOtpPage />;
  }

 
  if (session) {
    return (
      <>
        <RestoreRoute />
        <AppRoutes />
      </>
    );
  }

 
  return <AuthRoutes />;
}





function AppShell() {
  const isOnline = useOnlineStatus();

  const { settings } = useContext(SettingsContext);

  const colors = useMemo(
    () =>
      getThemeColors(
        settings.theme,
        settings.accent_color
      ),
    [settings.theme, settings.accent_color]
  );

  const fontSize = settings.font_size;
  const wordWrap = settings.word_wrap;

  useEffect(() => {
    document.body.setAttribute(
      "data-font-size",
      fontSize
    );

    document.body.setAttribute(
      "data-word-wrap",
      Boolean(Number(wordWrap)).toString()
    );
  }, [fontSize, wordWrap]);

 
  useEffect(() => {
    if (!isOnline) return;

    let cancelled = false;

    const runSync = async () => {
      try {
        console.log("Syncing notes...");

        const result = await cloudSync();

        if (!cancelled) {
          console.log("Sync completed:", result);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Cloud sync failed:", error);
        }
      }
    };

    void runSync();

    return () => {
      cancelled = true;
    };
  }, [isOnline]);

  return (
    <>
      <RouteTracker />

      <div
        className="min-h-screen"
        style={{
          backgroundColor: colors.bgPrimary,
          color: colors.textPrimary,
        }}
      >
        <AppContent isOnline={isOnline} />
      </div>

      <Toaster />
    </>
  );
}





const router = createHashRouter([
  {
    path: "*",
    element: <AppShell />,
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
