"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [notifOpen, setNotifOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate login and transition to dashboard
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-background font-sans">
      {/* TopAppBar */}
      <header className="fixed top-0 left-0 w-full h-16 flex items-center justify-between px-8 z-50 bg-white dark:bg-gray-900 border-b border-[#E2E8F0] dark:border-gray-800">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-primary-container flex items-center justify-center rounded">
            <img
              alt="Government Logo"
              className="w-8 h-8"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuB84yK7T6Zn5-67SOga2H1-XW60JPsw4VlE8koyHjcAj_RDSA_42RHkODe5HeASvCrNIBW1QWhsf6UPR4ItBuuxCEDBE4D6MrzlNx50Zf-fTZqf7YywhlGkiE-46aAg6FczBGYJe9h2PSgv1DOdaHRbqbHs4NjGM289RaKMNKtUq6agcPa4heaD4feWsR9FSbDLjoshnyFUFy25YTLAAHde4kuSzXSX3axSKRZKmtizMyibhQS_B7nCeMxcewz1N9p8OwEdTZ-USMI"
            />
          </div>
          <span className="text-lg font-bold text-[#002D62] dark:text-white tracking-tight">
            Sistem Borang Pengesahan Penghulu
          </span>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            {/* Notification Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setNotifOpen(!notifOpen);
                  setSettingsOpen(false);
                }}
                className="material-symbols-outlined text-blue-900 dark:text-blue-400 cursor-pointer active:opacity-80 p-2 rounded-full hover:bg-gray-50"
              >
                notifications
              </button>
              {notifOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-outline-variant rounded-xl shadow-lg z-50">
                  <div className="p-4 border-b border-outline-variant font-bold text-primary">
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
                        Your application has been verified.
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
                className="material-symbols-outlined text-blue-900 dark:text-blue-400 cursor-pointer active:opacity-80 p-2 rounded-full hover:bg-gray-50"
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

      {/* Main Content Canvas */}
      <main className="flex-grow flex items-center justify-center pt-24 pb-16 px-6 bg-white">
        <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Branding/Hero Section */}
          <div className="hidden lg:flex lg:col-span-7 flex-col space-y-8 pr-8 animate-fade-in">
            <div className="space-y-4">
              <h1 className="text-4xl font-extrabold text-primary leading-tight tracking-tight">
                Sistem Borang Pengesahan Penghulu
              </h1>
              <p className="text-lg text-on-surface-variant max-w-md leading-relaxed">
                An integrated system to facilitate document verification, aid applications,
                and monitoring of community activities at the grassroots level.
              </p>
            </div>
            {/* Decorative Graphic / Bento Element */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/30 flex flex-col justify-between h-36">
                <span
                  className="material-symbols-outlined text-primary text-3xl"
                  style={{ fontVariationSettings: '"FILL" 1' }}
                >
                  security
                </span>
                <div className="font-semibold text-sm text-primary">Secure Data Storage</div>
              </div>
              <div className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/30 flex flex-col justify-between h-36">
                <span
                  className="material-symbols-outlined text-secondary text-3xl"
                  style={{ fontVariationSettings: '"FILL" 1' }}
                >
                  speed
                </span>
                <div className="font-semibold text-sm text-secondary">Fast Approval Process</div>
              </div>
            </div>
          </div>

          {/* Login Card */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="w-full max-w-sm bg-white border border-[#E2E8F0] rounded-xl p-8 shadow-sm">
              <div className="mb-8 text-center lg:text-left">
                <h2 className="text-2xl font-bold text-primary mb-1">Welcome Back</h2>
                <p className="text-sm text-on-surface-variant">
                  Please log in to access your account.
                </p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email Field */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-on-surface" htmlFor="id-user">
                    Email
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-xl">
                      person
                    </span>
                    <input
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm text-on-surface"
                      id="id-user"
                      placeholder="Enter your email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="block text-sm font-semibold text-on-surface" htmlFor="password">
                      Password
                    </label>
                    <a className="text-xs font-semibold text-primary hover:underline" href="#">
                      Forgot Password?
                    </a>
                  </div>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-xl">
                      lock
                    </span>
                    <input
                      className="w-full pl-10 pr-12 py-2.5 bg-white border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm text-on-surface"
                      id="password"
                      placeholder="••••••••"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-primary"
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <span className="material-symbols-outlined text-xl">
                        {showPassword ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Checkbox */}
                <div className="flex items-center gap-2 py-1">
                  <input
                    className="w-4 h-4 text-primary border-outline-variant rounded focus:ring-primary"
                    id="remember"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <label
                    className="text-xs font-medium text-on-surface-variant cursor-pointer"
                    htmlFor="remember"
                  >
                    Remember me on this device
                  </label>
                </div>

                {/* Action Button */}
                <button
                  type="submit"
                  className="w-full py-3 rounded-lg hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer text-white font-semibold text-sm bg-primary"
                >
                  <span>Log In</span>
                  <span className="material-symbols-outlined text-lg">login</span>
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
                <p className="text-xs text-on-surface-variant">Don't have an account?</p>
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

      {/* Footer */}
      <footer className="w-full py-6 px-8 flex flex-col md:flex-row justify-between items-center mt-auto bg-white dark:bg-gray-955 border-t border-[#E2E8F0] dark:border-gray-800 text-xs">
        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
          <span className="font-semibold text-gray-900 dark:text-white">
            Sistem Borang Pengesahan Penghulu
          </span>
          <span className="text-gray-600 dark:text-gray-400">
            © 2024 Government of Malaysia. All Rights Reserved.
          </span>
        </div>
        <div className="flex items-center gap-6 mt-4 md:mt-0">
          <a className="text-gray-500 hover:text-[#002D62] dark:hover:text-blue-400 transition-colors" href="#">
            Privacy Policy
          </a>
          <a className="text-gray-500 hover:text-[#002D62] dark:hover:text-blue-400 transition-colors" href="#">
            Terms &amp; Conditions
          </a>
          <a className="text-gray-500 hover:text-[#002D62] dark:hover:text-blue-400 transition-colors" href="#">
            Contact Us
          </a>
        </div>
      </footer>
    </div>
  );
}
