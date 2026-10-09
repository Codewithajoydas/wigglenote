import { useContext, useMemo, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { toast } from "@/components/ui/toast";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

import {
  Loader2,
  LogOut,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { getThemeColors } from "@/constants/Theme";
import { SettingsContext } from "@/store/Settings.context";

export default function ProfilePage() {
    const { settings } = useContext(SettingsContext);
  
  const { data: session, isPending } = authClient.useSession();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      const { error } = await authClient.signOut();

      if (error) {
        toast.add({
          type: "error",
          title: "Logout failed",
          description: error.message || "Please try again.",
        });

        return;
      }

      toast.add({
        type: "success",
        title: "Logged out",
        description: "You have been logged out successfully.",
      });
    } catch (error) {
      console.error("Logout failed:", error);

      toast.add({
        type: "error",
        title: "Something went wrong",
        description: "Unable to log out. Please try again.",
      });
    } finally {
      setIsLoggingOut(false);
    }
  };
    const COLORS = useMemo(
    () => getThemeColors(settings.theme, settings.accent_color),
    [settings.theme, settings.accent_color],
  );

  if (isPending) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">
          Loading profile...
        </span>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4" >
        <Card className="w-full max-w-md">
          <CardHeader className="items-center text-center">
            <Avatar className="mb-2 h-14 w-14">
              <AvatarFallback>
                <UserRound className="h-7 w-7" />
              </AvatarFallback>
            </Avatar>

            <CardTitle>You are not logged in</CardTitle>

            <CardDescription>
              Please sign in to view your profile.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Button
              className="w-full"
              onClick={() => {
                window.location.assign("/sign-in");
              }}
            >
              Sign in
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const user = session.user;

  const initials =
    user.name
      ?.trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("") || "U";

  return (
    <main className="container mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          My Profile
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Manage your account information and security.
        </p>
      </div>

      <Card style={{ backgroundColor: COLORS.bgSecondary, color: COLORS.textPrimary }}>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-xl font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <CardTitle className="truncate text-xl">
                {user.name || "Unnamed User"}
              </CardTitle>

              <CardDescription className="mt-1 break-all">
                {user.email}
              </CardDescription>

              <div className="mt-3">
                {user.emailVerified ? (
                  <Badge
                    style={{color: COLORS.textPrimary}}
                    variant="default"
                    className="gap-1"
                  >
                    <ShieldCheck className="h-3.5 w-3.5" color="currentColor"/>
                    Email verified
                  </Badge>
                ) : (
                  <Badge variant="destructive" style={{color: COLORS.textPrimary}}>
                    Email not verified
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="border-t pt-5">
            <h2 className="mb-4 text-sm font-semibold">
              Account information
            </h2>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <UserRound className="mt-0.5 h-5 w-5 text-muted-foreground" />

                <div className="min-w-0 flex-1">
                  <p className="text-sm text-muted-foreground">
                    Full name
                  </p>

                  <p className="break-words font-medium">
                    {user.name || "Not provided"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-5 w-5 text-muted-foreground" />

                <div className="min-w-0 flex-1">
                  <p className="text-sm text-muted-foreground">
                    Email address
                  </p>

                  <p className="break-all font-medium">
                    {user.email}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 text-muted-foreground" />

                <div className="min-w-0 flex-1">
                  <p className="text-sm text-muted-foreground">
                    Email verification status
                  </p>

                  <p className="font-medium">
                    {user.emailVerified
                      ? "Verified"
                      : "Not verified"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t pt-5">
            <h2 className="text-sm font-semibold">
              Account security
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Sign out of your current account on this device.
            </p>

            <Button
              variant="destructive"
              className="mt-4 w-full sm:w-auto"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="mr-2 h-4 w-4" />
              )}

              {isLoggingOut ? "Logging out..." : "Logout"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}