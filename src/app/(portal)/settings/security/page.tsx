"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  signOut,
  updatePassword,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function SecuritySettingsPage() {
  const router = useRouter();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPasswordUpdating, setIsPasswordUpdating] = useState(false);
  const [isPasswordResetSending, setIsPasswordResetSending] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [toastMessage, setToastMessage] = useState({ text: "", type: "" });

  const showToast = (text: string, type: "success" | "error") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage({ text: "", type: "" }), 3000);
  };

  const handleSendPasswordReset = async () => {
    const user = auth.currentUser;
    if (!user?.email) {
      setPasswordError("No email address is linked to this account.");
      return;
    }

    setPasswordError("");
    setIsPasswordResetSending(true);
    try {
      const response = await fetch("/api/auth/password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error || "Failed to send password reset email.");
      }

      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showToast("Password reset link sent to your email.", "success");
    } catch (error: unknown) {
      console.error("Password reset email error:", error);
      setPasswordError(
        getAuthErrorMessage(error, "Failed to send password reset email."),
      );
    } finally {
      setIsPasswordResetSending(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters.");
      return;
    }

    const user = auth.currentUser;
    if (!user?.email) return;

    setIsPasswordUpdating(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, oldPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);

      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      await signOut(auth);
      router.push("/login");
    } catch (error: unknown) {
      console.error("Password update error:", error);
      const errorCode = getAuthErrorCode(error);
      if (
        errorCode === "auth/invalid-credential" ||
        errorCode === "auth/wrong-password"
      ) {
        setPasswordError("Incorrect old password.");
      } else {
        setPasswordError(
          getAuthErrorMessage(error, "Failed to update password."),
        );
      }
    } finally {
      setIsPasswordUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-lg border border-outline-variant bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-outline-variant bg-surface-container-low px-6 py-4">
          <div className="flex items-center gap-2 font-bold text-primary">
            <span className="material-symbols-outlined">lock</span>
            <h2>Security & Password</h2>
          </div>
        </div>

        <form onSubmit={handleChangePassword} className="max-w-xl space-y-4 p-6">
          {passwordError && (
            <div className="flex items-center gap-2 rounded-lg border border-error/20 bg-error-container p-3 text-xs font-semibold text-error">
              <span className="material-symbols-outlined text-[16px]">
                error
              </span>
              <span className="leading-6">{passwordError}</span>
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-bold uppercase text-on-surface-variant">
              Old Password
            </label>
            <input
              type="password"
              required
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full rounded-lg border border-outline px-3 py-2 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
            <button
              type="button"
              onClick={handleSendPasswordReset}
              disabled={isPasswordResetSending || isPasswordUpdating}
              className="mt-2 text-xs font-bold text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPasswordResetSending
                ? "Sending reset link..."
                : "Forgot old password? Send reset link to email"}
            </button>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase text-on-surface-variant">
              New Password
            </label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-lg border border-outline px-3 py-2 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase text-on-surface-variant">
              Confirm New Password
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-lg border border-outline px-3 py-2 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <button
              type="button"
              onClick={() => {
                setPasswordError("");
                setOldPassword("");
                setNewPassword("");
                setConfirmPassword("");
              }}
              disabled={isPasswordUpdating || isPasswordResetSending}
              className="w-full rounded-lg border border-outline px-4 py-2 text-sm font-bold text-secondary transition-colors hover:bg-gray-100 sm:w-auto"
            >
              Clear
            </button>
            <button
              type="submit"
              disabled={isPasswordUpdating || isPasswordResetSending}
              className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-primary/90 disabled:opacity-50 sm:w-auto"
            >
              {isPasswordUpdating ? "Updating..." : "Confirm Update"}
            </button>
          </div>
        </form>
      </section>

      {toastMessage.text && (
        <Toast message={toastMessage.text} type={toastMessage.type} />
      )}
    </div>
  );
}

function getAuthErrorCode(error: unknown) {
  if (error && typeof error === "object" && "code" in error) {
    return String((error as { code?: unknown }).code || "");
  }

  return "";
}

function getAuthErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message?: unknown }).message || fallback);
  }

  return fallback;
}

function Toast({ message, type }: { message: string; type: string }) {
  return (
    <div
      className={`fixed bottom-10 right-10 z-50 flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold shadow-xl ${
        type === "success"
          ? "border border-green-200 bg-green-100 text-green-800"
          : "border border-error/20 bg-error-container text-error"
      }`}
    >
      <span className="material-symbols-outlined text-lg">
        {type === "success" ? "check_circle" : "error"}
      </span>
      {message}
    </div>
  );
}
