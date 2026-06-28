"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase"; // adjust path depending on where your firebase configuration lives
import AiHelpChat from "@/components/AiHelpChat";
import {
  getStaffNotificationKey,
  loadStaffNotificationReadKeys,
  mapStaffApplicationNotification,
  saveStaffNotificationReadKeys,
  sortStaffApplicationNotifications,
  type StaffApplicationNotification,
} from "@/lib/staffNotifications";
import { SUPERADMIN_EMAIL, type UserRole } from "@/lib/user_auth";

const navItems = [
  {
    name: "Approval Review",
    href: "/staff/approval-review",
    icon: "how_to_reg",
  },
  {
    name: "Notifications",
    href: "/staff/notifications",
    icon: "notifications",
  },
];

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState<StaffApplicationNotification[]>([]);
  const [staffUid, setStaffUid] = useState("");
  const [readNotificationKeys, setReadNotificationKeys] = useState<Set<string>>(
    () => new Set(),
  );
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifOpen && notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }

      if (profileOpen && profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [notifOpen, profileOpen]);

  useEffect(() => {
    let unsubscribeApplications: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      unsubscribeApplications?.();
      unsubscribeApplications = null;

      if (!user) {
        setStaffUid("");
        setReadNotificationKeys(new Set());
        setNotifications([]);
        return;
      }

      try {
        setStaffUid(user.uid);
        setReadNotificationKeys(loadStaffNotificationReadKeys(user.uid));
        const staffSnapshot = await getDoc(doc(db, "users", user.uid));
        const staffData = staffSnapshot.exists() ? staffSnapshot.data() : {};
        const district = readString(staffData.district) || "Mukim Ayer Hitam";
        const role =
          readString(staffData.email, user.email).toLowerCase() === SUPERADMIN_EMAIL
            ? "SuperAdmin"
            : readUserRole(staffData.role);

        const applicationsQuery =
          role === "SuperAdmin"
            ? query(collection(db, "applications"))
            : query(collection(db, "applications"), where("district", "==", district));

        unsubscribeApplications = onSnapshot(
          applicationsQuery,
          (snapshot) => {
            const priorityItems = snapshot.docs
              .map((applicationSnapshot) =>
                mapStaffApplicationNotification(
                  applicationSnapshot.id,
                  applicationSnapshot.data(),
                ),
              )
              .filter((item): item is StaffApplicationNotification => Boolean(item))
              .sort(sortStaffApplicationNotifications);

            setNotifications(priorityItems);
          },
          (error) => {
            console.error("Staff priority notification listener failed", error);
            setNotifications([]);
          },
        );
      } catch (error) {
        console.error("Failed to load staff notification scope", error);
        setNotifications([]);
      }
    });

    return () => {
      unsubscribeApplications?.();
      unsubscribeAuth();
    };
  }, []);

  const unreadCount = useMemo(
    () =>
      notifications.filter(
        (notification) =>
          !readNotificationKeys.has(getStaffNotificationKey(notification)),
      ).length,
    [notifications, readNotificationKeys],
  );
  const notificationCountLabel = unreadCount > 99 ? "99+" : String(unreadCount);

  function markNotificationRead(notification: StaffApplicationNotification) {
    if (!staffUid) return;

    setReadNotificationKeys((current) => {
      const next = new Set(current);
      next.add(getStaffNotificationKey(notification));
      saveStaffNotificationReadKeys(staffUid, next);
      return next;
    });
  }

  const handleLogout = async (event: React.MouseEvent) => {
    event.preventDefault();
    try {
      await signOut(auth); // Terminate session on Firebase servers
      localStorage.removeItem("userRole"); // Wipe local cache token
      router.push("/login"); // Securely redirect away
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const toggleSidebar = () => {
    if (window.matchMedia("(min-width: 768px)").matches) {
      setDesktopSidebarOpen((current) => !current);
      return;
    }

    setMobileMenuOpen((current) => !current);
  };

  return (
    <div className="min-h-screen bg-background text-on-background">
      <header className="fixed left-0 top-0 z-50 flex h-14 w-full items-center justify-between border-b border-[#E2E8F0] bg-white px-6">
        <div className="flex items-center gap-4">
          <button
            type="button"
            aria-label="Toggle staff sidebar menu"
            aria-expanded={desktopSidebarOpen || mobileMenuOpen}
            onClick={toggleSidebar}
            className="material-symbols-outlined rounded-full p-1.5 text-gray-900 transition hover:bg-gray-50"
          >
            menu
          </button>
          <span className="text-base font-bold tracking-tight text-[#002D62]">
            Staff Portal
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              aria-label={`Open staff notifications, ${unreadCount} active`}
              onClick={() => {
                setNotifOpen((current) => !current);
                setProfileOpen(false);
              }}
              className="relative material-symbols-outlined rounded-full p-1.5 text-gray-600 transition hover:bg-gray-50"
            >
              notifications
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 min-w-4 rounded-full bg-error px-1 text-[10px] font-mono leading-4 text-white">
                  {notificationCountLabel}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 z-50 mt-2 w-72 rounded-xl border border-outline-variant bg-white py-2 shadow-lg">
                <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2">
                  <div>
                    <p className="text-xs font-bold text-gray-500">Notifications</p>
                    <p className="mt-0.5 text-[10px] font-semibold text-outline">
                      {unreadCount} active alert(s)
                    </p>
                  </div>
                  <Link
                    className="text-[10px] font-bold text-primary hover:underline"
                    href="/staff/notifications"
                    onClick={() => setNotifOpen(false)}
                  >
                    View all
                  </Link>
                </div>
                {notifications.length > 0 ? (
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.slice(0, 4).map((notification) => (
                      <Link
                        key={notification.documentId}
                        className="block px-3 py-3 transition-colors hover:bg-gray-50"
                        href={`/staff/approval-review?focus=${encodeURIComponent(
                          notification.referenceNumber,
                        )}`}
                        onClick={() => {
                          markNotificationRead(notification);
                          setNotifOpen(false);
                        }}
                      >
                        <div className="flex items-start gap-2">
                          <span
                            className={`mt-0.5 h-2 w-2 rounded-full ${
                              readNotificationKeys.has(getStaffNotificationKey(notification))
                                ? "bg-outline"
                                : "bg-primary"
                            }`}
                          />
                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold text-on-surface">
                              {notification.referenceNumber}
                            </p>
                            <p className="mt-0.5 line-clamp-2 text-[10px] text-on-surface-variant">
                              {notification.kind === "new_submission"
                                ? "New submission"
                                : `Pending for ${notification.pendingDays} days`} · {notification.applicantName}
                            </p>
                            <p className="mt-1 text-[9px] font-semibold text-outline">
                              {notification.applicationTitle}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="px-3 py-6 text-center">
                    <span className="material-symbols-outlined text-2xl text-outline">
                      notifications_off
                    </span>
                    <p className="mt-1 text-xs font-semibold text-on-surface">
                      No staff notifications
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="relative" ref={profileRef}>
          {/* Staff Profile Avatar Icon Toggle Button */}
          <button
            onClick={() => {
              setProfileOpen((prev) => !prev);
              setNotifOpen(false);
            }}
            className="flex cursor-pointer items-center gap-2 p-0.5 rounded-full border border-outline-variant transition-all duration-200 hover:bg-slate-100 hover:border-slate-600 focus:outline-none"
          >
            <div className="h-7 w-7 rounded-full overflow-hidden">
              <img
                alt="Staff Profile Avatar"
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCgJHdfJp_aL3WYl4th7I4aICU3qJBKIhAYgu2e43NJyVouU-5elW5XdY6wodTi82qCyiIJvuWgs52Xu_KzMWRaX0W8DtYURqXNfPj-18DlfAu1zLMC5zeI2mWBF3idk8DZWkEPwwpf0vA3JIyrl1VmKGoLxBwuMZUIQj7jdurgdJMT6906_c396TuZnvZYTHEpjsCa04orSmU71Wm-NvST3D6yGnccXFTksB1PUM9S21sjA0ajJGqzoXksgi9yGuUHND8FWQSwdgA" 
              />
            </div>
          </button>

          {/* Dropdown Container Matrix */}
          {profileOpen && (
            <>
              {/* 1. Invisible full-screen backdrop to capture outside clicks */}
              <div 
                className="fixed inset-0 z-40 cursor-default" 
                onClick={() => setProfileOpen(false)}
              />
              
              {/* 2. Actual Dropdown Menu Box */}
              <div className="absolute right-0 z-50 mt-2 w-52 rounded-lg border border-[#E2E8F0] bg-white py-2 shadow-lg">
                <div className="border-b border-gray-100 px-3 py-2">
                  <p className="text-xs font-bold text-on-surface">Staff Account</p>
                  <p className="text-[10px] font-medium text-on-surface-variant">
                    Staff Workspace
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex w-full cursor-pointer items-center gap-3 px-3 py-2 text-left text-sm text-error hover:bg-error-container/20"
                >
                  <span className="material-symbols-outlined text-sm">logout</span>
                  Log Out
                </button>
              </div>
            </>
          )}
          </div>
        </div>
      </header>

      <div className="flex pt-14">
        <aside
          className={`sticky top-14 hidden h-[calc(100vh-56px)] shrink-0 flex-col overflow-hidden bg-white py-4 transition-[width,border-color] duration-300 ease-in-out md:flex ${
            desktopSidebarOpen
              ? "w-60 border-r border-[#E2E8F0]"
              : "w-0 border-r border-transparent"
          }`}
        >
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
            <aside className="fixed bottom-0 left-0 top-0 z-50 flex w-60 flex-col border-r border-[#E2E8F0] bg-white py-4 transition-transform duration-300 ease-out md:hidden">
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

      <AiHelpChat />
    </div>
  );
}

function readUserRole(value: unknown): UserRole {
  if (value === "Applicant" || value === "Admin" || value === "SuperAdmin") {
    return value;
  }

  return "Admin";
}

function readString(...values: unknown[]) {
  const found = values.find(
    (value) => typeof value === "string" && value.trim(),
  );

  return typeof found === "string" ? found.trim() : "";
}
