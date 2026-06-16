"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signInWithStaffId } from "../../../../lib/user_auth";

export default function StaffLoginPage() {
  const router = useRouter();

  // Form Field States
  const [staffId, setStaffId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // UI Feedback States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsLoading(true);

    try {
      const user = await signInWithStaffId(staffId, password);
      console.log("Logged in administrative profile:", user);
      localStorage.setItem("userRole", user.role);
      router.push("/staff/approval-review");
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg(getErrorMessage(err, "Invalid Staff ID or password. Access denied."));
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-on-surface bg-[#f7f9fb] [background-image:radial-gradient(circle_at_2px_2px,#e2e8f0_1px,transparent_0)] [background-size:48px_48px] selection:bg-secondary-container">
      {/* Main Container */}
      <main className="flex-grow flex items-center justify-center px-4 md:px-6 py-10">
        <div className="w-full max-w-[440px] animate-fade-in-up">
          {/* Logo & Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#001736] rounded-xl shadow-sm mb-3">
              <span className="material-symbols-outlined text-white text-[32px]">account_balance</span>
            </div>
            <h1 className="text-xl font-bold text-[#001736] tracking-tight">
              Dewan Perdana Administrative Console
            </h1>
            <p className="text-xs text-secondary mt-1">Official Administrative Console</p>
          </div>

          {/* Form Card */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden p-6 md:p-8">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-[#001736] mb-1">Staff Sign In</h2>
              <p className="text-xs text-secondary leading-relaxed">
                Authorized personnel only. Access is monitored.
              </p>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 bg-red-50 text-[#ba1a1a] border border-red-200 rounded-lg text-xs font-semibold text-center">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Staff ID */}
              <div className="space-y-1.5">
                <label className="block font-mono text-[10px] font-semibold text-secondary uppercase tracking-wider" htmlFor="staff-id">
                  Staff ID
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-outline text-[20px] group-focus-within:text-[#001736] transition-colors">
                      badge
                    </span>
                  </div>
                  <input
                    className="block w-full pl-10 pr-3 py-2.5 bg-[#f7f9fb] text-primary border border-outline-variant rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all text-sm font-mono"
                    id="staff-id"
                    placeholder="e.g. DP-88421"
                    required
                    type="text"
                    value={staffId}
                    onChange={(e) => setStaffId(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block font-mono text-[10px] font-semibold text-secondary uppercase tracking-wider" htmlFor="password">
                    Password
                  </label>
                  <a className="text-[11px] text-[#002b5b] font-medium hover:underline transition-all" href="#">
                    Forgot Password?
                  </a>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-outline text-[20px] group-focus-within:text-[#001736] transition-colors">
                      lock
                    </span>
                  </div>
                  <input
                    className="block w-full pl-10 pr-10 py-2.5 bg-[#f7f9fb] text-primary border border-outline-variant rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all text-sm"
                    id="password"
                    placeholder="••••••••"
                    required
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-outline hover:text-[#001736] transition-colors cursor-pointer"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center">
                <input
                  className="h-4 w-4 text-[#001736] focus:ring-primary border-outline-variant rounded cursor-pointer"
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isLoading}
                />
                <label className="ml-2 block text-xs text-secondary cursor-pointer select-none" htmlFor="remember-me">
                  Remember this workstation
                </label>
              </div>

              {/* Sign In Button */}
              <button
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm font-semibold text-sm text-white bg-[#001736] hover:bg-[#002b5b] focus:outline-none active:scale-[0.98] transition-all cursor-pointer disabled:opacity-80"
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin mr-2 text-[20px]">sync</span>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <span className="material-symbols-outlined ml-2 text-[20px]">login</span>
                  </>
                )}
              </button>

              <div className="text-center mt-4">
                <p className="text-xs text-secondary">
                  Don&apos;t have an account?
                  <Link className="text-[#001736] font-semibold hover:underline transition-all ml-1" href="/staff/register">
                    Register New Account
                  </Link>
                </p>
              </div>
            </form>

            {/* IT Helpdesk alert */}
            <div className="pt-4 border-t border-[#E2E8F0] flex items-start gap-2 text-[#3B82F6] bg-[#3B82F6]/5 p-3 rounded-lg mt-4 text-xs font-medium leading-relaxed">
              <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">info</span>
              <p>For technical assistance, please contact the IT Helpdesk.</p>
            </div>
          </div>

          {/* Citizen Portal redirect */}
          <div className="text-center flex flex-col items-center gap-2 mb-4 mt-6">
            <div className="flex items-center gap-1.5 text-secondary hover:text-primary transition-colors text-xs font-semibold">
              <span className="material-symbols-outlined text-[16px]">public</span>
              <Link href="/login">Go to Citizen Public Portal</Link>
            </div>
            <div className="flex items-center gap-4 mt-2">
              <span className="font-mono text-[10px] text-outline font-semibold uppercase">v2.4.0 Stable</span>
              <span className="h-1 w-1 bg-outline-variant rounded-full"></span>
              <span className="font-mono text-[10px] text-outline font-semibold uppercase">Secure Gateway</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-4 px-6 flex flex-col md:flex-row justify-between items-center text-center md:text-left bg-[#f2f4f6] border-t border-[#E2E8F0] text-xs">
        <p className="text-secondary font-mono text-[10px] uppercase font-semibold">
          © 2024 Administrative Console. All Rights Reserved. Secure Government Portal.
        </p>
        <div className="flex gap-4 mt-2 md:mt-0 font-mono text-[10px] uppercase font-semibold">
          <a className="text-secondary hover:text-primary transition-colors" href="#">
            Privacy Policy
          </a>
          <a className="text-secondary hover:text-primary transition-colors" href="#">
            Security Guidelines
          </a>
        </div>
      </footer>
    </div>
  );
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message?: unknown }).message || fallback);
  }

  return fallback;
}
