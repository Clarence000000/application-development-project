"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const navItems = [
  {
    name: "Approval Review",
    href: "/staff/approval-review",
    icon: "how_to_reg",
  },
];

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = (event: React.MouseEvent) => {
    event.preventDefault();
    router.push("/login");
  };

  const isAuthPage = pathname === "/staff/login" || pathname === "/staff/register";

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background text-on-background">
      <header className="fixed left-0 top-0 z-50 flex h-14 w-full items-center justify-between border-b border-[#E2E8F0] bg-white px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="material-symbols-outlined rounded-full p-1.5 text-gray-600 hover:bg-gray-50 md:hidden"
          >
            menu
          </button>
          <span className="text-base font-bold tracking-tight text-[#002D62]">
            Penghulu Staff Portal
          </span>
        </div>

        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 rounded-full border border-outline-variant p-0.5 transition hover:bg-gray-50"
          >
            <span className="material-symbols-outlined flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[18px] text-white">
              badge
            </span>
          </button>
          {profileOpen && (
            <div className="absolute right-0 z-50 mt-2 w-52 rounded-lg border border-[#E2E8F0] bg-white py-2 shadow-lg">
              <div className="border-b border-gray-100 px-3 py-2">
                <p className="text-xs font-bold text-on-surface">Staff Account</p>
                <p className="text-[10px] font-medium text-on-surface-variant">
                  Mukim Ayer Hitam
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-error hover:bg-error-container/20"
              >
                <span className="material-symbols-outlined text-sm">logout</span>
                Log Out
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="flex pt-14">
        <aside className="sticky top-14 hidden h-[calc(100vh-56px)] w-60 flex-col border-r border-[#E2E8F0] bg-white py-4 md:flex">
          <div className="mb-6 px-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <span
                  className="material-symbols-outlined text-xl text-white"
                  style={{ fontVariationSettings: '"FILL" 1' }}
                >
                  admin_panel_settings
                </span>
              </div>
              <div>
                <h2 className="text-sm font-bold leading-tight text-[#002D62]">Staff Portal</h2>
                <p className="text-[10px] font-medium text-gray-500">
                  Administrative Workspace
                </p>
              </div>
            </div>
          </div>

          <nav className="flex-1 space-y-0.5 px-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                    isActive
                      ? "border-l-4 border-[#002D62] bg-gray-100 text-[#002D62]"
                      : "text-gray-500 hover:bg-gray-50 hover:text-[#002D62]"
                  }`}
                >
                  <span
                    className="material-symbols-outlined text-xl"
                    style={{ fontVariationSettings: isActive ? '"FILL" 1' : '"FILL" 0' }}
                  >
                    {item.icon}
                  </span>
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-gray-100 px-2 pt-3">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm font-semibold text-gray-500 transition hover:text-error"
            >
              <span className="material-symbols-outlined text-xl">logout</span>
              Logout
            </button>
          </div>
        </aside>

        {mobileMenuOpen && (
          <>
            <button
              className="fixed inset-0 z-40 bg-black/50 md:hidden"
              aria-label="Close staff menu"
              onClick={() => setMobileMenuOpen(false)}
            />
            <aside className="fixed bottom-0 left-0 top-0 z-50 flex w-60 flex-col border-r border-[#E2E8F0] bg-white py-4 md:hidden">
              <div className="mb-6 flex items-center justify-between px-5">
                <div>
                  <h2 className="text-sm font-bold text-[#002D62]">Staff Portal</h2>
                  <p className="text-[10px] font-medium text-gray-500">Administrative Workspace</p>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="material-symbols-outlined p-1 text-gray-500"
                >
                  close
                </button>
              </div>
              <nav className="flex-1 space-y-0.5 px-2">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-semibold text-[#002D62]"
                  >
                    <span className="material-symbols-outlined text-xl">{item.icon}</span>
                    {item.name}
                  </Link>
                ))}
              </nav>
            </aside>
          </>
        )}

        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto w-full max-w-[1440px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
