import { useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { authClient } from "@/lib/auth-client";

export default function VerifyOtpPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const email = location.state?.email ?? "";

  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleVerifyOtp = async () => {
    if (!email) {
      setErrorMessage(
        "Email is missing. Please sign up again."
      );
      return;
    }

    if (otp.length !== 6) {
      setErrorMessage("Please enter the 6-digit OTP.");
      return;
    }

    setIsVerifying(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const { error } =
        await authClient.emailOtp.verifyEmail({
          email,
          otp,
        });

      if (error) {
        setErrorMessage(
          error.message || "Invalid or expired OTP."
        );
        return;
      }

      setSuccessMessage("Email verified successfully.");

      navigate("/login", { replace: true });
    } catch (error) {
      console.error(error);
      setErrorMessage(
        "Something went wrong. Please try again."
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (!email) {
      setErrorMessage(
        "Email is missing. Please sign up again."
      );
      return;
    }

    setIsResending(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const { error } =
        await authClient.emailOtp.sendVerificationOtp({
          email,
          type: "email-verification",
        });

      if (error) {
        setErrorMessage(
          error.message || "Unable to send OTP."
        );
        return;
      }

      setOtp("");
      setSuccessMessage(
        "A new OTP has been sent to your email."
      );
    } catch (error) {
      console.error(error);
      setErrorMessage(
        "Something went wrong. Please try again."
      );
    } finally {
      setIsResending(false);
    }
  };

  if (!email) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">
            Email not found
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Please sign up or log in to continue.
          </p>

          <Link
            to="/sign-up"
            className="mt-6 inline-flex rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
          >
            Create account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-sm">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <svg
              className="h-7 w-7 text-primary"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect
                width="20"
                height="16"
                x="2"
                y="4"
                rx="2"
              />
              <path d="m22 7-10 6L2 7" />
            </svg>
          </div>

          <h1 className="mt-6 text-2xl font-semibold tracking-tight">
            Verify your email
          </h1>

          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Enter the 6-digit verification code sent to:
          </p>

          <div className="mt-4 rounded-lg border bg-muted/40 px-4 py-3">
            <p className="break-all text-sm font-medium">
              {email}
            </p>
          </div>
        </div>

        {errorMessage && (
          <div
            className="mt-5 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3"
            role="alert"
          >
            <p className="text-sm text-destructive">
              {errorMessage}
            </p>
          </div>
        )}

        {successMessage && (
          <div
            className="mt-5 rounded-lg border border-green-500/20 bg-green-500/10 px-4 py-3"
            role="status"
          >
            <p className="text-sm text-green-600">
              {successMessage}
            </p>
          </div>
        )}

        <form
          className="mt-6"
          onSubmit={(event) => {
            event.preventDefault();
            void handleVerifyOtp();
          }}
        >
          <label
            htmlFor="otp"
            className="mb-2 block text-sm font-medium"
          >
            Verification code
          </label>

          <input
            id="otp"
            name="otp"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={otp}
            onChange={(event) => {
              setOtp(
                event.target.value
                  .replace(/\D/g, "")
                  .slice(0, 6)
              );
            }}
            placeholder="000000"
            disabled={isVerifying}
            required
            className="w-full rounded-lg border bg-background px-4 py-3 text-center text-2xl font-semibold tracking-[0.5em] outline-none transition focus:border-primary disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={isVerifying || otp.length !== 6}
            className="mt-5 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isVerifying
              ? "Verifying..."
              : "Verify Email"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Didn't receive the code?
          </p>

          <button
            type="button"
            onClick={handleResendOtp}
            disabled={isResending || isVerifying}
            className="mt-2 text-sm font-medium text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isResending
              ? "Sending..."
              : "Resend OTP"}
          </button>
        </div>

        <div className="mt-6 border-t pt-6 text-center">
          <Link
            to="/login"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}