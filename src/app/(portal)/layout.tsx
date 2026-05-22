"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [notifOpen, setNotifOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push("/login");
  };

  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: "dashboard",
    },
    {
      name: "New Application",
      href: "/new-application",
      icon: "description",
    },
    {
      name: "Review Status",
      href: "/review-status",
      icon: "fact_check",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-background font-sans">
      {/* TopAppBar */}
      <header className="fixed top-0 left-0 w-full h-14 flex items-center justify-between px-6 z-50 bg-white dark:bg-gray-900 border-b border-[#E2E8F0] dark:border-gray-800">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden material-symbols-outlined text-gray-600 dark:text-gray-400 hover:bg-gray-50 p-1.5 rounded-full"
          >
            menu
          </button>
          <span className="text-base font-bold text-[#002D62] dark:text-white tracking-tight">
            Penghulu Certificate Validation System
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setNotifOpen(!notifOpen);
                setSettingsOpen(false);
                setProfileOpen(false);
              }}
              className="material-symbols-outlined text-gray-600 dark:text-gray-400 hover:bg-gray-50 p-1.5 rounded-full transition-colors"
            >
              notifications
            </button>
            {notifOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-outline-variant rounded-xl shadow-lg z-50 py-2">
                <p className="text-xs font-bold text-gray-500 px-3 py-2 border-b border-gray-100">
                  Notifications
                </p>
                <div className="max-h-48 overflow-y-auto">
                  <a className="block px-3 py-3 hover:bg-gray-50 rounded-lg transition-colors" href="#">
                    <p className="text-xs font-semibold text-on-surface">Application Approved</p>
                    <p className="text-[10px] text-on-surface-variant">
                      Your Mastautin request is ready.
                    </p>
                  </a>
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
                setProfileOpen(false);
              }}
              className="material-symbols-outlined text-gray-600 dark:text-gray-400 hover:bg-gray-50 p-1.5 rounded-full transition-colors"
            >
              settings
            </button>
            {settingsOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-[#E2E8F0] rounded-xl shadow-lg z-50 py-2">
                <a className="flex items-center gap-3 px-3 py-2 text-sm text-on-surface hover:bg-gray-50 rounded-lg" href="#">
                  <span className="material-symbols-outlined text-sm">language</span> Language
                </a>
                <div className="flex items-center justify-between px-3 py-2 text-sm text-on-surface hover:bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-sm">dark_mode</span> Dark Mode
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input className="sr-only peer" type="checkbox" />
                    <div className="w-8 h-4 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setProfileOpen(!profileOpen);
                setNotifOpen(false);
                setSettingsOpen(false);
              }}
              className="flex items-center gap-2 p-0.5 hover:bg-gray-50 rounded-full transition-colors border border-outline-variant"
            >
              <div className="h-7 w-7 rounded-full overflow-hidden">
                <img
                  alt="User Profile Avatar"
                  className="w-full h-full object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCgJHdfJp_aL3WYl4th7I4aICU3qJBKIhAYgu2e43NJyVouU-5elW5XdY6wodTi82qCyiIJvuWgs52Xu_KzMWRaX0W8DtYURqXNfPj-18DlfAu1zLMC5zeI2mWBF3idk8DZWkEPwwpf0vA3JIyrl1VmKGoLxBwuMZUIQj7jdurgdJMT6906_c396TuZnvZYTHEpjsCa04orSmU71Wm-NvST3D6yGnccXFTksB1PUM9S21sjA0ajJGqzoXksgi9yGuUHND8FWQSwdgA"
                />
              </div>
            </button>
            {profileOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-[#E2E8F0] rounded-xl shadow-lg z-50 py-2">
                <a className="flex items-center gap-3 px-3 py-2 text-sm text-on-surface hover:bg-gray-50 rounded-lg" href="#">
                  <span className="material-symbols-outlined text-sm">person</span> View Profile
                </a>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-error hover:bg-error-container/20 rounded-lg border-t border-gray-100 mt-1 cursor-pointer text-left"
                >
                  <span className="material-symbols-outlined text-sm">logout</span> Log Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Sidebar and Main Content Wrapper */}
      <div className="flex flex-1 pt-14">
        {/* SideNavBar (Desktop) */}
        <aside className="w-60 h-[calc(100vh-56px)] sticky top-14 flex flex-col py-4 bg-white dark:bg-gray-900 border-r border-[#E2E8F0] dark:border-gray-800 z-40 hidden md:flex">
          <div className="px-5 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-primary flex items-center justify-center rounded-lg">
                <span
                  className="material-symbols-outlined text-white text-xl"
                  style={{ fontVariationSettings: '"FILL" 1' }}
                >
                  account_balance
                </span>
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#002D62] dark:text-white leading-tight">
                  Citizen Portal
                </h2>
                <p className="text-[10px] text-gray-500 font-medium">Official Government Service</p>
              </div>
            </div>
          </div>
          <nav className="flex-1 px-2 space-y-0.5">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-2.5 transition-all text-sm font-semibold rounded-lg ${
                    isActive
                      ? "bg-gray-100 dark:bg-gray-800 text-[#002D62] dark:text-white border-l-4 border-[#002D62]"
                      : "text-gray-500 dark:text-gray-400 hover:text-[#002D62] hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  <span
                    className="material-symbols-outlined text-xl"
                    style={{ fontVariationSettings: isActive ? '"FILL" 1' : '"FILL" 0' }}
                  >
                    {item.icon}
                  </span>
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
          <div className="px-5 mb-4">
            <button
              onClick={() => router.push("/new-application")}
              className="w-full bg-primary-container text-white py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">add</span> New Form
            </button>
          </div>
          <div className="px-2 border-t border-gray-100 dark:border-gray-800 pt-3">
            <a className="flex items-center gap-3 px-4 py-2 text-gray-500 dark:text-gray-400 hover:text-[#002D62] transition-all text-sm font-semibold" href="#">
              <span className="material-symbols-outlined text-xl">help</span>
              <span>Help</span>
            </a>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2 text-gray-500 dark:text-gray-400 hover:text-error transition-all text-sm font-semibold cursor-pointer text-left"
            >
              <span className="material-symbols-outlined text-xl">logout</span>
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* Overlay and Mobile Sidebar */}
        {mobileMenuOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            ></div>
            <aside className="fixed left-0 top-0 bottom-0 w-60 flex flex-col py-4 bg-white dark:bg-gray-900 border-r border-[#E2E8F0] dark:border-gray-800 z-50 animate-slide-in">
              <div className="px-5 mb-6 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-primary flex items-center justify-center rounded-lg">
                    <span
                      className="material-symbols-outlined text-white text-xl"
                      style={{ fontVariationSettings: '"FILL" 1' }}
                    >
                      account_balance
                    </span>
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-[#002D62] dark:text-white leading-tight">
                      Citizen Portal
                    </h2>
                    <p className="text-[10px] text-gray-500 font-medium">Official Government</p>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="material-symbols-outlined p-1 text-gray-500"
                >
                  close
                </button>
              </div>
              <nav className="flex-1 px-2 space-y-0.5">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-2.5 transition-all text-sm font-semibold rounded-lg ${
                        isActive
                          ? "bg-gray-100 dark:bg-gray-800 text-[#002D62] dark:text-white border-l-4 border-[#002D62]"
                          : "text-gray-500 dark:text-gray-400 hover:text-[#002D62] hover:bg-gray-50 dark:hover:bg-gray-800"
                      }`}
                    >
                      <span
                        className="material-symbols-outlined text-xl"
                        style={{ fontVariationSettings: isActive ? '"FILL" 1' : '"FILL" 0' }}
                      >
                        {item.icon}
                      </span>
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
              <div className="px-5 mb-4">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    router.push("/new-application");
                  }}
                  className="w-full bg-primary-container text-white py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">add</span> New Form
                </button>
              </div>
              <div className="px-2 border-t border-gray-100 dark:border-gray-800 pt-3">
                <a className="flex items-center gap-3 px-4 py-2 text-gray-500 dark:text-gray-400 hover:text-[#002D62] transition-all text-sm font-semibold" href="#">
                  <span className="material-symbols-outlined text-xl">help</span>
                  <span>Help</span>
                </a>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2 text-gray-500 dark:text-gray-400 hover:text-error transition-all text-sm font-semibold cursor-pointer text-left"
                >
                  <span className="material-symbols-outlined text-xl">logout</span>
                  <span>Logout</span>
                </button>
              </div>
            </aside>
          </>
        )}

        {/* Main Content Area */}
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-[1440px] mx-auto w-full">{children}</div>
        </main>
      </div>

      {/* Footer */}
      <footer className="md:pl-60 py-4 px-6 flex flex-col md:flex-row justify-between items-center bg-gray-50 dark:bg-gray-950 border-t border-[#E2E8F0] dark:border-gray-800 text-xs">
        <div className="flex flex-col">
          <span className="text-xs font-bold text-gray-900 dark:text-white">Penghulu Portal</span>
          <p className="text-[10px] text-gray-500 dark:text-gray-400">
            © 2024 Government of Malaysia. All Rights Reserved.
          </p>
        </div>
        <div className="flex gap-5 mt-2 md:mt-0">
          <a className="text-[11px] text-gray-500 hover:text-[#002D62] dark:hover:text-blue-400 transition-colors font-medium" href="#">
            Privacy Policy
          </a>
          <a className="text-[11px] text-gray-500 hover:text-[#002D62] dark:hover:text-blue-400 transition-colors font-medium" href="#">
            Terms &amp; Conditions
          </a>
          <a className="text-[11px] text-gray-500 hover:text-[#002D62] dark:hover:text-blue-400 transition-colors font-medium" href="#">
            Contact Us
          </a>
        </div>
      </footer>

      {/* BottomNavBar (Mobile Only) */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-1.5 pb-safe bg-white border-t border-outline-variant md:hidden shadow-sm">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center px-3 py-1 ${
                isActive ? "text-[#002D62] font-bold" : "text-on-surface-variant font-medium"
              }`}
            >
              <span
                className="material-symbols-outlined text-[20px]"
                style={{ fontVariationSettings: isActive ? '"FILL" 1' : '"FILL" 0' }}
              >
                {item.icon}
              </span>
              <span className="text-[10px]">{item.name.replace("Application", "Apply").replace("Review Status", "Status")}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
