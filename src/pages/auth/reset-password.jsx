import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  KeyRound,
  Loader2,
  Mail,
} from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";


export default function ResetPassword() {
  const navigate = useNavigate();

  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const requestOTP = async (event) => {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      toast.add({
        title: "Error",
        type: "error",
        description: "Please enter your email.",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } =
        await authClient.emailOtp.requestPasswordReset({
          email: normalizedEmail,
        });

      if (error) {
        toast.add({
          title: "Error",
          type: "error",
          description: error.message??"Unable to send verification code.",
        })
        return;
      }

      setEmail(normalizedEmail);
      setStep("reset");

     toast.add({
      title: "Success",
      type: "success",
      description: "Verification code has been sent to your email.",
     })
    } catch {
      toast.add({
        title: "Error",
        type: "error",
        description: "Something went wrong. Please try again.",
      })
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (event) => {
    event.preventDefault();

    if (!/^\d{6}$/.test(otp)) {
      toast.add({
        title: "Error",
        type: "error",
        description: "Please enter a valid verification code.",
      })
      return;
    }

    if (password.length < 8) {
      toast.add({
        title: "Error",
        type: "error",
        description: "Password must be at least 8 characters.",
      })
      return;
    }

    if (password !== confirmPassword) {
      toast.add({
        title: "Error",
        type: "error",
        description: "Password and confirm password do not match.",
      })
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await authClient.emailOtp.resetPassword({
        email,
        otp,
        password,
      });

      if (error) {
        toast.add({
          title: "Error",
          type: "error",
          description: error.message??"Unable to reset password.",
        })
        return;
      }

      toast.add({
        title: "Success",
        type: "success",
        description: "Password has been reset successfully.",
      })

      navigate("/login", { replace: true });
    } catch {
      toast.add({
        title: "Error",
        type: "error",
        description: "Something went wrong. Please try again.",
      })
    } finally {
      setIsLoading(false);
    }
  };

  const resendOTP = async () => {
    setIsLoading(true);

    try {
      const { error } =
        await authClient.emailOtp.requestPasswordReset({ email });

      if (error) {
        toast.add({
          title: "Error",
          type: "error",
          description: error.message??"Unable to send verification code.",
        })
        return;
      }

      setOtp("");

      toast.add({
        title: "Success",
        type: "success",
        description: "Verification code has been sent to your email.",
      })
    } catch {
      toast.add({
        title: "Error",
        type: "error",
        description: "Something went wrong. Please try again.",
      })
    } finally {
      setIsLoading(false);
    }
  };

  const changeEmail = () => {
    setStep("email");
    setOtp("");
    setPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-10">
      <Card className="w-full max-w-md border-border/60 shadow-lg">
        <CardHeader className="space-y-4 text-center">
          {/* <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            {step === "email" ? (
              <Mail className="size-7" />
            ) : (
              <ShieldCheck className="size-7" />
            )}
          </div> */}

          <div className="space-y-2">
            <CardTitle className="text-2xl font-semibold tracking-tight text-left">
              {step === "email"
                ? "Forgot your password?"
                : "Reset your password"}
            </CardTitle>

            <CardDescription>
              {step === "email"
                ? "Enter your email address to request a password reset code."
                : `Enter the verification code sent to ${email} and choose a new password.`}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          {step === "email" ? (
            <form onSubmit={requestOTP} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>

                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Mail className="mr-2 size-4" />
                )}
                Send verification code
              </Button>
            </form>
          ) : (
            <form onSubmit={resetPassword} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="otp">Verification code</Label>

                <Input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  value={otp}
                  onChange={(event) =>
                    setOtp(
                      event.target.value.replace(/\D/g, "").slice(0, 6)
                    )
                  }
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">New password</Label>

                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={8}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  Confirm new password
                </Label>

                <Input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(event.target.value)
                  }
                  minLength={8}
                  required
                  disabled={isLoading}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <KeyRound className="mr-2 size-4" />
                )}
                Reset password
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={resendOTP}
                disabled={isLoading}
              >
                Resend verification code
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={changeEmail}
                disabled={isLoading}
              >
                <ArrowLeft className="mr-2 size-4" />
                Change email address
              </Button>
            </form>
          )}

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Remember your password?{" "}
            <Link
              to="/login"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
