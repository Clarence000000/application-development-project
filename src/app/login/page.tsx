"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "../../lib/user_auth"; 

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [notifOpen, setNotifOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    try {
      const user = await signIn(email, password);
      
      console.log("Logged in successfully as:", user.role);
      localStorage.setItem("userRole", user.role);
      
      router.push("/dashboard");
    } catch (err: any) {
      console.error(err);
      switch (err.code) {
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
          setErrorMsg(err.message || "Failed to log in. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-background font-sans">
      {/* TopAppBar */}
      <header className="fixed top-0 left-0 w-full h-16 flex items-center justify-between px-8 z-50 bg-white dark:bg-gray-900 border-b border-[#E2E8F0] dark:border-gray-800">
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold text-[#002D62] dark:text-white tracking-tight">
            Sistem Borang Pengesahan Penghulu
          </span>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="flex-grow flex items-center justify-center pt-24 pb-16 px-6 bg-white">
        <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Branding/Hero Section */}
          <div className="hidden lg:flex lg:col-span-7 flex-col space-y-8 pr-8 animate-fade-in">
             <h1 className="text-4xl font-extrabold text-primary leading-tight tracking-tight">
                Sistem Borang Pengesahan Penghulu
             </h1>
          </div>

          {/* Login Card */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="w-full max-w-sm bg-white border border-[#E2E8F0] rounded-xl p-8 shadow-sm">
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

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-on-surface" htmlFor="id-user">
                    Email
                  </label>
                  <input
                    className="w-full px-4 py-2.5 bg-white border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
                    id="id-user"
                    placeholder="Enter your email"
                    type="email"
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
                      <span className="material-symbols-outlined text-xl">
                        {showPassword ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>
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

              <div className="text-center space-y-4 mt-6">
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