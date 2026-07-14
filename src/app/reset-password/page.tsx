"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import {
  confirmPasswordReset,
  verifyPasswordResetCode,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const actionCode = searchParams.get("oobCode") || "";
  const mode = searchParams.get("mode") || "";
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isCheckingCode, setIsCheckingCode] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isComplete, setIsComplete] = useState(false);

  const isResetMode = useMemo(() => mode === "resetPassword", [mode]);

  useEffect(() => {
    const verifyCode = async () => {
      if (!actionCode || !isResetMode) {
        setErrorMessage("This password reset link is invalid or incomplete.");
        setIsCheckingCode(false);
        return;
      }

      try {
        const resetEmail = await verifyPasswordResetCode(auth, actionCode);
        setEmail(resetEmail);
      } catch (error) {
        console.error("Password reset code verification error:", error);
        setErrorMessage("This password reset link has expired or was already used.");
      } finally {
        setIsCheckingCode(false);
      }
    };

    verifyCode();
  }, [actionCode, isResetMode]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage("");

    if (newPassword.length < 6) {
      setErrorMessage("New password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("New passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      await confirmPasswordReset(auth, actionCode, newPassword);
      setIsComplete(true);
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Password reset confirmation error:", error);
      setErrorMessage("Failed to reset password. Please request a new reset link.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-white px-6 py-10 text-on-background">
      {/* TopAppBar */}
      <header className="fixed top-0 left-0 w-full h-16 flex items-center justify-between px-8 z-50 bg-[#0F172A] border-b border-white/10">
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold text-white tracking-tight">
            MyPerakuan
          </span>
        </div>
      </header>
      
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-5xl items-center">
        <div className="grid w-full grid-cols-1 items-center gap-10 lg:grid-cols-12">
          <section className="hidden lg:col-span-7 lg:block">
            <p className="mb-3 text-sm font-bold uppercase tracking-wide text-primary">
              Account Recovery
            </p>
            <h1 className="max-w-xl text-4xl font-extrabold leading-tight text-primary">
              Reset your portal password securely.
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-6 text-on-surface-variant">
              Choose a new password for your account. After this is complete, you can
              return to the login page and sign in with the updated password.
            </p>
          </section>

          <section className="lg:col-span-5">
            <div className="rounded-xl border border-outline-variant bg-white p-8 shadow-sm">
              <div className="mb-6">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-white">
                  <span className="material-symbols-outlined">lock_reset</span>
                </div>
                <h2 className="text-2xl font-bold text-primary">
                  Reset Password
                </h2>
                <p className="mt-1 text-sm text-on-surface-variant">
                  {email || "Verifying your reset link..."}
                </p>
              </div>

              {isCheckingCode ? (
                <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-4 text-sm font-medium text-on-surface-variant">
                  Checking reset link...
                </div>
              ) : isComplete ? (
                <div className="space-y-4">
                  <div className="rounded-lg border border-green-200 bg-green-100 p-4 text-sm font-semibold text-green-800">
                    Password updated successfully.
                  </div>
                  <Link
                    className="block rounded-lg bg-primary px-4 py-3 text-center text-sm font-bold text-white transition-colors hover:bg-primary/90"
                    href="/login"
                  >
                    Back to Login
                  </Link>
                </div>
              ) : errorMessage && !email ? (
                <div className="space-y-4">
                  <div className="rounded-lg border border-error/20 bg-error-container p-4 text-sm font-semibold text-error">
                    {errorMessage}
                  </div>
                  <Link
                    className="block rounded-lg border border-outline px-4 py-3 text-center text-sm font-bold text-primary transition-colors hover:bg-gray-50"
                    href="/login"
                  >
                    Back to Login
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {errorMessage && (
                    <div className="rounded-lg border border-error/20 bg-error-container p-3 text-sm font-semibold text-error">
                      {errorMessage}
                    </div>
                  )}

                  <div>
                    <label className="mb-1 block text-sm font-semibold text-on-surface">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={newPassword}
                        onChange={(event) => setNewPassword(event.target.value)}
                        className="w-full rounded-lg border border-outline-variant bg-white py-2.5 pl-4 pr-12 text-sm outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-primary"
                      />
                      <button
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-primary"
                        type="button"
                        onClick={() => setShowPassword((value) => !value)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        <span className="material-symbols-outlined text-xl">
                          {showPassword ? "visibility_off" : "visibility"}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-semibold text-on-surface">
                      Confirm New Password
                    </label>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      className="w-full rounded-lg border border-outline-variant bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-gray-400"
                  >
                    <span>{isSubmitting ? "Updating..." : "Update Password"}</span>
                    {!isSubmitting && (
                      <span className="material-symbols-outlined text-lg">
                        arrow_forward
                      </span>
                    )}
                  </button>
                </form>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-white p-6 text-sm font-medium text-on-surface-variant">
          Loading reset form...
        </main>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
