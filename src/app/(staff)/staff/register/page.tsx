"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registerStaffAccount } from "../../../../lib/user_auth";
import { districtOptions } from "@/lib/districts";

export default function StaffRegisterPage() {
  const router = useRouter();

  // Form Field States
  const [fullName, setFullName] = useState("");
  const [staffId, setStaffId] = useState("");
  const [department, setDepartment] = useState("");
  const [district, setDistrict] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // UI Feedback States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      await registerStaffAccount(email, password, {
        name: fullName,
        staffId,
        department,
        district,
      });

      setSuccessMsg("Registration submitted for office approval.");
      setTimeout(() => {
        router.push("/staff/login");
      }, 3000);
    } catch (err: unknown) {
      console.error(err);
      switch (getErrorCode(err)) {
        case "auth/email-already-in-use":
          setErrorMsg("An account with this official email already exists.");
          break;
        case "auth/weak-password":
          setErrorMsg("Password should be at least 6 characters.");
          break;
        default:
          setErrorMsg(getErrorMessage(err, "Failed to create staff account."));
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f9fb] font-sans selection:bg-secondary-container text-on-surface">
      {/* Success Notification Banner */}
      {successMsg && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 bg-[#10B981] text-white px-8 py-3.5 rounded-full shadow-2xl flex items-center gap-2 z-50 animate-bounce text-sm font-semibold">
          <span className="material-symbols-outlined">verified</span>
          {successMsg}
        </div>
      )}

      {/* Main Registration Container */}
      <main className="flex-grow flex items-center justify-center px-4 md:px-6 py-10">
        <div className="w-full max-w-4xl flex flex-col md:flex-row bg-white rounded-xl shadow-sm overflow-hidden border border-[#E2E8F0]">
          
          {/* Left Branding Panel */}
          <div className="hidden md:flex md:w-1/3 bg-[#001736] p-8 flex-col justify-between relative overflow-hidden text-white">
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <div className="absolute top-0 left-0 w-64 h-64 border-2 border-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
              <div className="absolute bottom-0 right-0 w-96 h-96 border-4 border-white rounded-full translate-x-1/3 translate-y-1/3"></div>
            </div>
            <div className="z-10">
              <p className="text-xs text-[#7594ca] font-medium tracking-tight">
                Official Government Administrative Portal
              </p>
            </div>
            <div className="z-10 space-y-2">
              <div className="flex items-center gap-2 text-white">
                <span className="material-symbols-outlined text-white">verified_user</span>
                <span className="font-mono text-xs uppercase tracking-widest font-semibold">
                  Secure Registration
                </span>
              </div>
              <p className="text-xs text-[#7594ca] leading-relaxed">
                Access official certificate services and staff directory management. Your identity is
                verified against the National Personnel Database.
              </p>
            </div>
          </div>

          {/* Right Form Panel */}
          <div className="w-full md:w-2/3 p-8 bg-white">
            <header className="mb-6">
              <div className="flex items-center gap-2 mb-1.5 text-[#001736]">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                  how_to_reg
                </span>
                <span className="font-mono text-xs font-semibold tracking-wider uppercase">
                  PORTAL ACCESS
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-[#001736] tracking-tight">
                Staff Onboarding
              </h2>
              <p className="text-sm text-secondary mt-1">
                Enter your official credentials to create your administrative profile.
              </p>
            </header>

            {errorMsg && (
              <div className="mb-4 p-3 bg-red-50 text-[#ba1a1a] border border-red-200 rounded-lg text-xs font-semibold text-center">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-xs font-semibold text-on-surface-variant uppercase tracking-wider" htmlFor="full_name">
                    Full Name (As per NRIC)
                  </label>
                  <div className="relative group">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-[20px] group-focus-within:text-[#001736]">
                      person
                    </span>
                    <input
                      className="w-full pl-10 pr-4 py-2.5 bg-[#f7f9fb] border border-outline-variant rounded focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all text-sm"
                      id="full_name"
                      placeholder="e.g. Ahmad bin Ibrahim"
                      required
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Staff ID */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-xs font-semibold text-on-surface-variant uppercase tracking-wider" htmlFor="staff_id">
                    Staff ID / ID Number
                  </label>
                  <div className="relative group">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-[20px] group-focus-within:text-[#001736]">
                      badge
                    </span>
                    <input
                      className="w-full pl-10 pr-4 py-2.5 bg-[#f7f9fb] border border-outline-variant rounded focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all text-sm font-mono"
                      id="staff_id"
                      placeholder="PEN-2024-0012"
                      required
                      type="text"
                      value={staffId}
                      onChange={(e) => setStaffId(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Department */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-xs font-semibold text-on-surface-variant uppercase tracking-wider" htmlFor="department">
                    Department
                  </label>
                  <div className="relative group">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-[20px] group-focus-within:text-[#001736]">
                      corporate_fare
                    </span>
                    <select
                      className="w-full pl-10 pr-10 py-2.5 bg-[#f7f9fb] border border-outline-variant rounded focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all text-sm appearance-none cursor-pointer"
                      id="department"
                      required
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      disabled={isLoading}
                    >
                      <option value="" disabled>
                        Select Department
                      </option>
                      <option value="penghulu_office">Office Administration</option>
                      <option value="civil_records">Civil Records</option>
                      <option value="community_affairs">Community Affairs</option>
                      <option value="it_admin">IT Administration</option>
                      <option value="security">Internal Security</option>
                    </select>
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined pointer-events-none text-outline text-lg">
                      expand_more
                    </span>
                  </div>
                </div>

                {/* Official Email */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-xs font-semibold text-on-surface-variant uppercase tracking-wider" htmlFor="email">
                    Official Email Address
                  </label>
                  <div className="relative group">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-[20px] group-focus-within:text-[#001736]">
                      mail
                    </span>
                    <input
                      className="w-full pl-10 pr-4 py-2.5 bg-[#f7f9fb] border border-outline-variant rounded focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all text-sm"
                      id="email"
                      placeholder="name@gov.my"
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* District Area */}
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="font-mono text-xs font-semibold text-on-surface-variant uppercase tracking-wider" htmlFor="district">
                    Assigned District Area
                  </label>
                  <div className="relative group">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-[20px] group-focus-within:text-[#001736]">
                      location_on
                    </span>
                    <select
                      className="w-full pl-10 pr-10 py-2.5 bg-[#f7f9fb] border border-outline-variant rounded focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all text-sm appearance-none cursor-pointer"
                      id="district"
                      required
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      disabled={isLoading}
                    >
                      <option value="" disabled>
                        Select District Area
                      </option>
                      {districtOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined pointer-events-none text-outline text-lg">
                      expand_more
                    </span>
                  </div>
                </div>

                {/* Password */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-xs font-semibold text-on-surface-variant uppercase tracking-wider" htmlFor="password">
                    Password
                  </label>
                  <div className="relative group">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-[20px] group-focus-within:text-[#001736]">
                      lock
                    </span>
                    <input
                      className="w-full pl-10 pr-4 py-2.5 bg-[#f7f9fb] border border-outline-variant rounded focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all text-sm"
                      id="password"
                      placeholder="••••••••"
                      required
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-xs font-semibold text-on-surface-variant uppercase tracking-wider" htmlFor="confirm_password">
                    Confirm Password
                  </label>
                  <div className="relative group">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-[20px] group-focus-within:text-[#001736]">
                      enhanced_encryption
                    </span>
                    <input
                      className={`w-full pl-10 pr-4 py-2.5 bg-[#f7f9fb] border rounded focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all text-sm ${
                        confirmPassword
                          ? password === confirmPassword
                            ? "border-green-500"
                            : "border-red-500"
                          : "border-outline-variant"
                      }`}
                      id="confirm_password"
                      placeholder="••••••••"
                      required
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>

              {/* Information Disclaimer */}
              <div className="bg-[#eceef0] rounded-lg p-4 flex gap-3 items-start border-l-4 border-[#001736]">
                <span className="material-symbols-outlined text-[#001736] text-[20px] mt-0.5">
                  info
                </span>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  By creating an account, you agree to comply with the <strong>Official Secrets Act 1972</strong> and government cybersecurity protocols. All actions are audited.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-4 pt-2">
                <button
                  className="w-full bg-[#001736] text-white py-3 px-4 font-semibold rounded hover:bg-[#002b5b] active:scale-[0.99] transition-all flex justify-center items-center gap-2 shadow-sm cursor-pointer disabled:opacity-80"
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-sm">sync</span>
                      <span>Validating Credentials...</span>
                    </>
                  ) : (
                    <>
                      <span>Create Account</span>
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </>
                  )}
                </button>
                <div className="flex justify-center items-center gap-2">
                  <span className="text-secondary text-xs">Already registered?</span>
                  <Link
                    className="text-[#001736] text-xs font-semibold hover:underline flex items-center gap-1 group"
                    href="/staff/login"
                  >
                    <span className="material-symbols-outlined text-[16px] group-hover:-translate-x-0.5 transition-transform">
                      arrow_back
                    </span>
                    <span>Back to Login</span>
                  </Link>
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full px-6 flex flex-col md:flex-row justify-between items-center text-center md:text-left bg-[#f2f4f6] border-t border-[#E2E8F0] py-3 text-xs">
        <div className="mb-2 md:mb-0">
          <span className="font-mono text-xs font-semibold text-on-surface">ADMIN</span>
        </div>
        <div className="text-secondary max-w-xl text-[10px]">
          © 2024 Administrative Console. All Rights Reserved. Secure Government Portal.
        </div>
        <div className="flex gap-4 mt-2 md:mt-0">
          <a className="text-secondary hover:text-primary transition-colors font-medium text-[10px]" href="#">
            Privacy Policy
          </a>
          <a className="text-secondary hover:text-primary transition-colors font-medium text-[10px]" href="#">
            Security Guidelines
          </a>
        </div>
      </footer>
    </div>
  );
}

function getErrorCode(error: unknown) {
  if (error && typeof error === "object" && "code" in error) {
    return String((error as { code?: unknown }).code || "");
  }

  return "";
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message?: unknown }).message || fallback);
  }

  return fallback;
}
