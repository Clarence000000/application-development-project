"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [notifOpen, setNotifOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate creation and navigate to dashboard
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-background font-sans overflow-x-hidden">
      {/* TopAppBar */}
      <header className="fixed top-0 left-0 w-full h-14 flex items-center justify-between px-6 z-50 bg-white dark:bg-gray-900 border-b border-[#E2E8F0] dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary-container flex items-center justify-center rounded">
            <img
              alt="Government Logo"
              className="w-6 h-6"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuB84yK7T6Zn5-67SOga2H1-XW60JPsw4VlE8koyHjcAj_RDSA_42RHkODe5HeASvCrNIBW1QWhsf6UPR4ItBuuxCEDBE4D6MrzlNx50Zf-fTZqf7YywhlGkiE-46aAg6FczBGYJe9h2PSgv1DOdaHRbqbHs4NjGM289RaKMNKtUq6agcPa4heaD4feWsR9FSbDLjoshnyFUFy25YTLAAHde4kuSzXSX3axSKRZKmtizMyibhQS_B7nCeMxcewz1N9p8OwEdTZ-USMI"
            />
          </div>
          <span className="text-base font-bold text-[#002D62] dark:text-white tracking-tight">
            Sistem Borang Pengesahan Penghulu
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            {/* Notifications Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setNotifOpen(!notifOpen);
                  setSettingsOpen(false);
                }}
                className="material-symbols-outlined text-blue-900 dark:text-blue-400 cursor-pointer active:opacity-80 p-1.5 rounded-full hover:bg-gray-50"
              >
                notifications
              </button>
              {notifOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-outline-variant rounded-xl shadow-lg z-50">
                  <div className="p-3 border-b border-outline-variant font-bold text-primary">
                    Notifications
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    <div className="p-3 hover:bg-surface-container-low border-b border-outline-variant">
                      <p className="text-xs font-semibold">System Update</p>
                      <p className="text-[10px] text-on-surface-variant">
                        Maintenance scheduled for tonight.
                      </p>
                    </div>
                    <div className="p-3 hover:bg-surface-container-low">
                      <p className="text-xs font-semibold">Application Status</p>
                      <p className="text-[10px] text-on-surface-variant">
                        Your account is pending verification.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Settings Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setSettingsOpen(!settingsOpen);
                  setNotifOpen(false);
                }}
                className="material-symbols-outlined text-blue-900 dark:text-blue-400 cursor-pointer active:opacity-80 p-1.5 rounded-full hover:bg-gray-50"
              >
                settings
              </button>
              {settingsOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-outline-variant rounded-xl shadow-lg z-50 py-2">
                  <button className="w-full text-left px-4 py-2 text-sm hover:bg-surface-container-low flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">language</span>{" "}
                    Language
                  </button>
                  <div className="border-t border-outline-variant my-1"></div>
                  <button className="w-full text-left px-4 py-2 text-sm hover:bg-surface-container-low flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">dark_mode</span>{" "}
                      Dark Mode
                    </span>
                    <div className="w-8 h-4 bg-outline-variant rounded-full relative">
                      <div className="absolute left-0.5 top-0.5 w-3 h-3 bg-white rounded-full"></div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center pt-20 pb-8 px-6">
        <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Section */}
          <div className="hidden lg:flex lg:col-span-7 flex-col space-y-6">
            <div className="space-y-3">
              <h1 className="text-3xl font-bold leading-tight tracking-tight text-primary">
                Sistem Borang Pengesahan Penghulu
              </h1>
              <p className="text-base text-on-surface-variant max-w-lg">
                An integrated system to facilitate document verification, aid applications,
                and monitoring of community activities at the grassroots level.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface-container p-5 rounded-xl border border-outline-variant/30 flex flex-col justify-between h-32">
                <span
                  className="material-symbols-outlined text-primary text-2xl"
                  style={{ fontVariationSettings: '"FILL" 1' }}
                >
                  security
                </span>
                <div className="text-sm font-semibold text-primary">Secure Data Storage</div>
              </div>
              <div className="bg-secondary-container p-5 rounded-xl border border-outline-variant/30 flex flex-col justify-between h-32">
                <span
                  className="material-symbols-outlined text-secondary text-2xl"
                  style={{ fontVariationSettings: '"FILL" 1' }}
                >
                  speed
                </span>
                <div className="text-sm font-semibold text-secondary">Fast Approval Process</div>
              </div>
            </div>
          </div>

          {/* Right Section (Form) */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="w-full max-w-md bg-surface-container-lowest border border-[#E2E8F0] rounded-xl p-6 shadow-sm">
              <div className="mb-6 text-center lg:text-left">
                <h2 className="text-xl font-semibold text-primary mb-1">Create Account</h2>
                <p className="text-xs text-on-surface-variant">
                  Fill in the details below to start your application.
                </p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-on-surface">
                    Email Address
                  </label>
                  <input
                    className="w-full px-3 py-2.5 bg-white border border-outline rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none text-sm"
                    placeholder="e.g. name@example.com"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-on-surface">
                    OTP Verification
                  </label>
                  <div className="flex gap-2">
                    <input
                      className="flex-grow px-3 py-2.5 bg-white border border-outline rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none text-sm"
                      placeholder="6-digit code"
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      required
                    />
                    <button
                      className="px-4 py-2.5 bg-surface-container-high text-primary font-semibold rounded-lg hover:bg-surface-container-highest active:scale-95 transition-all whitespace-nowrap text-xs cursor-pointer"
                      type="button"
                    >
                      Request OTP
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-on-surface">Password</label>
                    <input
                      className="w-full px-3 py-2.5 bg-white border border-outline rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none text-sm"
                      placeholder="••••••••"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-on-surface">
                      Confirm Password
                    </label>
                    <input
                      className="w-full px-3 py-2.5 bg-white border border-outline rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none text-sm"
                      placeholder="••••••••"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-on-surface">
                    MyKad Verification
                  </label>
                  <div className="grid gap-3 grid-cols-2">
                    <div className="border-2 border-dashed border-outline-variant rounded-xl p-4 flex flex-col items-center justify-center text-center hover:border-primary transition-colors cursor-pointer bg-surface-container-low group">
                      <span className="material-symbols-outlined text-2xl mb-1 text-on-surface-variant group-hover:text-primary">
                        upload_file
                      </span>
                      <p className="text-[11px] font-medium text-on-surface">Upload MyKad Image</p>
                      <p className="text-[9px] text-on-surface-variant mt-0.5">PNG, JPG up to 5MB</p>
                    </div>
                    <div className="border-2 border-dashed border-outline-variant rounded-xl p-4 flex flex-col items-center justify-center text-center hover:border-primary transition-colors cursor-pointer bg-surface-container-low group">
                      <span className="material-symbols-outlined text-2xl mb-1 text-on-surface-variant group-hover:text-primary">
                        photo_camera
                      </span>
                      <p className="text-[11px] font-medium text-on-surface">Take Photo Directly</p>
                      <p className="text-[9px] text-on-surface-variant mt-0.5">Use webcam/camera</p>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-outline-variant">
                  <button
                    type="submit"
                    className="w-full py-3 bg-primary text-on-primary font-bold rounded-lg shadow-lg shadow-primary/20 hover:bg-primary-container active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
                  >
                    <span>Create Account</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                  <div className="mt-4 text-center">
                    <p className="text-xs text-on-surface-variant">
                      Already have an account?{" "}
                      <Link className="text-primary font-bold hover:underline" href="/login">
                        Log in here
                      </Link>
                    </p>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-4 px-6 flex flex-col md:flex-row justify-between items-center mt-auto bg-gray-50 dark:bg-gray-955 border-t border-[#E2E8F0] dark:border-gray-800 text-[10px]">
        <div className="flex flex-col md:flex-row items-center gap-3 md:gap-6">
          <span className="font-semibold text-gray-900 dark:text-white">
            Sistem Borang Pengesahan Penghulu
          </span>
          <span className="text-gray-600 dark:text-gray-400">
            © 2024 Government of Malaysia. All Rights Reserved.
          </span>
        </div>
        <div className="flex items-center gap-5 mt-3 md:mt-0">
          <a className="text-gray-500 hover:text-[#002D62] dark:hover:text-blue-400 transition-colors" href="#">
            Dasar Privasi
          </a>
          <a className="text-gray-500 hover:text-[#002D62] dark:hover:text-blue-400 transition-colors" href="#">
            Terma &amp; Syarat
          </a>
          <a className="text-gray-500 hover:text-[#002D62] dark:hover:text-blue-400 transition-colors" href="#">
            Hubungi Kami
          </a>
        </div>
      </footer>
    </div>
  );
}
