"use client";

import React, { useState } from "react";
import Link from "next/link";
import { signIn, signInWithStaffId } from "../../lib/user_auth"; 

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResetSending, setIsResetSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    try {
      const isEmail = email.includes("@");
      let user;
      if (isEmail) {
        user = await signIn(email, password);
      } else {
        user = await signInWithStaffId(email, password);
      }
      
      console.log("Logged in successfully as:", user.role);
      localStorage.setItem("userRole", user.role);
      
      // --- MODIFIED ROUTING BLOCK ---
      // Using window.location.href instead of router.push forces a full page hydration.
      // This completely eliminates the Firestore token propagation race condition.
      if (user.role === "Admin" || user.role === "SuperAdmin") {
        window.location.href = "/staff/approval-review";
      } else {
        window.location.href = "/dashboard";
      }
      // ------------------------------

    } catch (err: unknown) {
      console.error(err);
      switch (getAuthErrorCode(err)) {
        case "auth/invalid-credential":
        case "auth/wrong-password":
          setErrorMsg("The email or password you entered is incorrect.");
          break;
        case "auth/user-not-found":
          setErrorMsg("No account exists with this email address.");
          break;
        case "auth/too-many-requests":
          setErrorMsg("Account temporarily locked due to too many failed attempts.");
          break;
        default:
          setErrorMsg(getAuthErrorMessage(err, "Failed to log in. Please try again."));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendPasswordReset = async () => {
    setErrorMsg("");
    setSuccessMsg("");

    if (!email.trim()) {
      setErrorMsg("Enter your email first, then request a password reset link.");
      return;
    }

    setIsResetSending(true);
    try {
      const response = await fetch("/api/auth/password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error || "Failed to send password reset link.");
      }

      setSuccessMsg("Password reset link sent. Check your email inbox.");
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg(
        err instanceof Error ? err.message : getResetErrorMessage(err),
      );
    } finally {
      setIsResetSending(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-on-background font-sans">
      {/* TopAppBar */}
      <header className="fixed top-0 left-0 w-full h-16 flex items-center justify-between px-8 z-50 bg-[#0F172A] border-b border-white/10">
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold text-white tracking-tight">
            MyPerakuan
          </span>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="flex-grow flex items-center justify-center pt-24 pb-16 px-6">
        <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Branding/Hero Section */}
          <div className="hidden lg:flex lg:col-span-7 flex-col space-y-8 pr-10 animate-fade-in">
            <div className="max-w-xl">
              <h1 className="text-5xl font-extrabold text-[#001F45] leading-tight tracking-tight">
                Certificate Validation System
              </h1>
              <p className="mt-4 max-w-lg text-base leading-7 text-[#475569]">
                Verify applications, review official records, and manage certificate requests from one secure workspace.
              </p>
            </div>

            <div className="grid max-w-xl grid-cols-3 gap-3">
              {[
                { icon: "lock", label: "Secure Access" },
                { icon: "fact_check", label: "Review Status" },
                { icon: "workspace_premium", label: "Official Records" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-lg border border-[#E2E8F0] bg-white px-4 py-3 shadow-sm"
                >
                  <span className="material-symbols-outlined text-[20px] text-primary">
                    {item.icon}
                  </span>
                  <p className="mt-2 text-xs font-bold text-[#0F172A]">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>

            <div className="relative h-40 max-w-xl overflow-hidden rounded-lg border border-[#E2E8F0] bg-white shadow-sm">
              <div className="absolute left-6 top-6 h-24 w-20 rounded-md border border-[#CBD5E1] bg-[#F8FAFC]" />
              <div className="absolute left-10 top-10 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white">
                <span className="material-symbols-outlined text-[26px]">
                  approval
                </span>
              </div>
              <div className="absolute left-36 top-8 h-3 w-56 rounded-full bg-[#CBD5E1]" />
              <div className="absolute left-36 top-14 h-2 w-72 rounded-full bg-[#E2E8F0]" />
              <div className="absolute left-36 top-28 grid grid-cols-3 gap-3">
                <span className="h-7 w-24 rounded-md bg-[#EFF6FF]" />
                <span className="h-7 w-24 rounded-md bg-[#F1F5F9]" />
                <span className="h-7 w-24 rounded-md bg-[#F8FAFC]" />
              </div>
              <div className="absolute right-0 top-0 h-full w-1 bg-primary" />
            </div>
          </div>

          {/* Login Card */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="w-full max-w-sm bg-white border border-[#E2E8F0] rounded-xl p-8 shadow-sm">
              <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-lg bg-[#EFF6FF] text-primary">
                <span className="material-symbols-outlined text-[24px]">
                  shield_person
                </span>
              </div>
              <div className="mb-6 text-center lg:text-left">
                <h2 className="text-2xl font-bold text-primary mb-1">Welcome Back</h2>
                <p className="text-sm text-on-surface-variant">Please log in to access your account.</p>
              </div>

              {/* Error Message Display */}
              {errorMsg && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm text-center font-medium">
                  {errorMsg}
                </div>
              )}
              {successMsg && (
                <div className="mb-4 rounded-lg border border-green-200 bg-green-100 p-3 text-center text-sm font-medium text-green-800">
                  {successMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-on-surface" htmlFor="id-user">
                    Email / Staff ID
                  </label>
                  <input
                    className="w-full px-4 py-2.5 bg-white border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
                    id="id-user"
                    placeholder="Enter email or Staff ID"
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="block text-sm font-semibold text-on-surface" htmlFor="password">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={handleSendPasswordReset}
                      disabled={isResetSending || isLoading}
                      className="text-xs font-bold text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isResetSending ? "Sending..." : "Forgot Password?"}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      className="w-full pl-4 pr-12 py-2.5 bg-white border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
                      id="password"
                      placeholder="••••••••"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                    <button
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-primary"
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <span className="material-symbols-outlined text-xl py-5">
                        {showPassword ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>
                </div>

                {/*Remember me button*/}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(event) => setRememberMe(event.target.checked)}
                      className="h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary"
                      disabled={isLoading}
                    />
                    Remember me
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-3 rounded-lg flex items-center justify-center gap-2 font-semibold text-sm transition-all ${
                    isLoading ? "bg-gray-400 cursor-not-allowed text-white" : "bg-primary text-white hover:opacity-90 active:scale-[0.98] cursor-pointer"
                  }`}
                >
                  <span>{isLoading ? "Authenticating..." : "Log In"}</span>
                  {!isLoading && <span className="material-symbols-outlined text-lg">login</span>}
                </button>
              </form>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-outline-variant"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-white text-outline font-semibold uppercase tracking-widest text-[10px]">
                    Or
                  </span>
                </div>
              </div>

              {/* Secondary Action */}
              <div className="text-center space-y-4">
                <p className="text-xs text-on-surface-variant">Don&apos;t have an account?</p>
                <Link
                  className="block w-full border border-outline text-primary font-semibold py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-center text-sm"
                  href="/register"
                >
                  Register New Account
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function getResetErrorMessage(error: unknown) {
  const code = getAuthErrorCode(error);

  if (code === "auth/user-not-found") {
    return "No account exists with this email address.";
  }

  if (code === "auth/invalid-email") {
    return "Enter a valid email address.";
  }

  if (code === "auth/too-many-requests") {
    return "Too many reset attempts. Please try again later.";
  }

  return "Failed to send password reset link. Please try again.";
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
