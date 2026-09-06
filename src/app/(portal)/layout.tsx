"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import AiHelpChat from "@/components/AiHelpChat";
import { useTranslations } from "next-intl";
import {
  formatNotificationDate,
  subscribeNotificationHistory,
  type NotificationHistoryItem,
} from "@/lib/notifications";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("Navigation");
  const notificationT = useTranslations("Notifications");

  const [notifOpen, setNotifOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const [notifications, setNotifications] = useState<NotificationHistoryItem[]>([]);
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Create Refs to track the dropdown containers
  const notifRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // --- Click Outside Listener ---
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // If notification dropdown is open and the click is outside its ref boundary, close it
      if (notifOpen && notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
      // If settings dropdown is open and the click is outside its ref boundary, close it
      if (settingsOpen && settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setSettingsOpen(false);
      }
      // If profile dropdown is open and the click is outside its ref boundary, close it
      if (profileOpen && profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }

    // Bind the global window event listener
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      // Clean up the listener when the layout unmounts
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [notifOpen, settingsOpen, profileOpen]);

  // --- Existing Notification Auth Logic ---
  useEffect(() => {
    let unsubscribeNotifications: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        unsubscribeNotifications?.();
        unsubscribeNotifications = null;
        setNotifications([]);
        return;
      }

      unsubscribeNotifications?.();
      unsubscribeNotifications = subscribeNotificationHistory(
        user.uid,
        (history) => setNotifications(history.slice(0, 99)),
        (error) => console.error("Notification dropdown listener failed", error),
      );
    });

    return () => {
      unsubscribeNotifications?.();
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(Boolean(user));
      setAuthChecked(true);

      if (!user) {
        router.replace("/login");
      }
    });

    return unsubscribe;
  }, [router]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications],
  );

  if (!authChecked || !isAuthenticated) {
    return null;
  }

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    await signOut(auth);
    router.replace("/login");
  };

  const handleSettings = () => {
    router.push("/settings");
  };

  const toggleSidebar = () => {
    if (window.matchMedia("(min-width: 768px)").matches) {
      setDesktopSidebarOpen((current) => !current);
      return;
    }

    setMobileMenuOpen((current) => !current);
  };

  const navItems = [
    { name: t("dashboard"), href: "/dashboard", icon: "dashboard" },
    { name: t("newApplication"), href: "/new-application", icon: "description" },
    { name: t("reviewStatus"), href: "/review-status", icon: "fact_check" },
    { name: t("notifications"), href: "/notifications", icon: "notifications" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-background font-sans">
      {/* TopAppBar */}
      <header className="fixed top-0 left-0 w-full h-14 flex items-center justify-between px-6 z-50 bg-white dark:bg-gray-900 border-b border-[#E2E8F0] dark:border-gray-800">
        <div className="flex items-center gap-4">
          <button
            type="button"
            aria-label="Toggle sidebar menu"
            aria-expanded={mobileMenuOpen}
            onClick={toggleSidebar}
            className="material-symbols-outlined text-gray-600 dark:text-gray-400 hover:bg-gray-50 p-1.5 rounded-full"
          >
            menu
          </button>
          <span className="text-base font-bold text-[#002D62] dark:text-white tracking-tight">
            MyPerakuan
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Notifications Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => {
                setNotifOpen(!notifOpen);
                setSettingsOpen(false);
                setProfileOpen(false);
              }}
              className="relative material-symbols-outlined text-gray-600 dark:text-gray-400 hover:bg-gray-50 p-1.5 rounded-full transition-colors"
            >
              notifications
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 min-w-4 rounded-full bg-error px-1 text-[10px] font-mono leading-4 text-white">
                  {unreadCount}
                </span>
              )}
            </button>
            {notifOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-outline-variant rounded-xl shadow-lg z-50 py-2">
                <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2">
                  <p className="text-xs font-bold text-gray-500">{t("notifications")}</p>
                  <Link
                    className="text-[10px] font-bold text-primary hover:underline"
                    href="/notifications"
                    onClick={() => setNotifOpen(false)}
                  >
                    {t("viewAll")}
                  </Link>
                </div>
                {notifications.length > 0 ? (
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.map((notification) => (
                      <Link
                        key={notification.id}
                        className="block px-3 py-3 transition-colors hover:bg-gray-50"
                        href={
                          notification.referenceNumber
                            ? `/review-status?focus=${encodeURIComponent(notification.referenceNumber)}`
                            : "/notifications"
                        }
                        onClick={() => setNotifOpen(false)}
                      >
                        <div className="flex items-start gap-2">
                          <span
                            className={`mt-0.5 h-2 w-2 rounded-full ${
                              notification.read ? "bg-outline" : "bg-primary"
                            }`}
                          />
                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold text-on-surface">
                              {getNotificationTitle(notification, notificationT)}
                            </p>
                            <p className="mt-0.5 line-clamp-2 text-[10px] text-on-surface-variant">
                              {getNotificationMessage(notification, notificationT)}
                            </p>
                            <p className="mt-1 text-[9px] font-semibold text-outline">
                              {formatNotificationDate(notification.createdAt)}
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
                      {t("noNotifications")}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Profile Dropdown */}
          <div className="relative" ref={profileRef}>
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
                <Link 
                  href="/settings" 
                  onClick={() => setProfileOpen(false)} 
                  className="flex items-center gap-3 px-3 py-2 text-sm text-on-surface hover:bg-gray-50 rounded-lg"
                >
                  <span className="material-symbols-outlined text-sm">person</span> {t("viewProfile")}
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-error hover:bg-error-container/20 rounded-lg border-t border-gray-100 mt-1 cursor-pointer text-left"
                >
                  <span className="material-symbols-outlined text-sm">logout</span> {t("logOut")}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Sidebar and Main Content Wrapper */}
      <div className="flex flex-1 pt-14">
        {/* SideNavBar (Desktop) */}
        <aside
          className={`sticky top-14 z-40 hidden h-[calc(100vh-56px)] shrink-0 flex-col overflow-hidden bg-white py-4 transition-[width,border-color] duration-300 ease-in-out dark:bg-gray-900 md:flex ${
            desktopSidebarOpen
              ? "w-60 border-r border-[#E2E8F0] dark:border-gray-800"
              : "w-0 border-r border-transparent"
          }`}
        >
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
                  {t("citizenPortal")}
                </h2>
                <p className="text-[10px] text-gray-500 font-medium">{t("officialService")}</p>
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
                      : "text-gray-500 dark:text-gray-400 hover:text-[#FFFFFF] hover:bg-gray-50 dark:hover:bg-gray-800"
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
          <div className="px-2 border-t border-gray-100 dark:border-gray-800 pt-3">
            <button
              onClick={handleSettings}
              className="w-full flex items-center gap-3 px-4 py-2 text-gray-500 dark:text-gray-400 hover:text-[#FFFFFF] transition-all text-sm font-semibold cursor-pointer text-left"
            >
              <span className="material-symbols-outlined text-xl">settings</span>
              <span>{t("settings")}</span>
            </button>
            <a className="flex items-center gap-3 px-4 py-2 text-gray-500 dark:text-gray-400 hover:text-[#FFFFFF] transition-all text-sm font-semibold" href="#">
              <span className="material-symbols-outlined text-xl">help</span>
              <span>{t("help")}</span>
            </a>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2 text-gray-500 dark:text-gray-400 hover:text-error transition-all text-sm font-semibold cursor-pointer text-left"
            >
              <span className="material-symbols-outlined text-xl">logout</span>
              <span>{t("logOut")}</span>
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
            <aside className="fixed left-0 top-0 bottom-0 w-60 flex flex-col py-4 bg-white dark:bg-gray-900 border-r border-[#E2E8F0] dark:border-gray-800 z-50 animate-slide-in md:hidden">
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
                      {t("citizenPortal")}
                    </h2>
                    <p className="text-[10px] text-gray-500 font-medium">{t("officialService")}</p>
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
                  <span className="material-symbols-outlined text-base">add</span> {t("newForm")}
                </button>
              </div>
              <div className="px-2 border-t border-gray-100 dark:border-gray-800 pt-3">
                <a className="flex items-center gap-3 px-4 py-2 text-gray-500 dark:text-gray-400 hover:text-[#002D62] transition-all text-sm font-semibold" href="#">
                  <span className="material-symbols-outlined text-xl">help</span>
                  <span>{t("help")}</span>
                </a>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2 text-gray-500 dark:text-gray-400 hover:text-error transition-all text-sm font-semibold cursor-pointer text-left"
                >
                  <span className="material-symbols-outlined text-xl">logout</span>
                  <span>{t("logOut")}</span>
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
      <footer
        className={`py-4 px-6 flex flex-col md:flex-row justify-between items-center bg-gray-50 dark:bg-gray-950 border-t border-[#E2E8F0] dark:border-gray-800 text-xs ${
          desktopSidebarOpen ? "md:pl-60" : ""
        }`}
      >
        <div className="flex flex-col">
          <span className="text-xs font-bold text-gray-900 dark:text-white">{t("citizenPortal")}</span>
          <p className="text-[10px] text-gray-500 dark:text-gray-400">
            {t("copyright")}
          </p>
        </div>
        <div className="flex gap-5 mt-2 md:mt-0">
          <a className="text-[11px] text-gray-500 hover:text-[#002D62] dark:hover:text-blue-400 transition-colors font-medium" href="#">
            {t("privacyPolicy")}
          </a>
          <a className="text-[11px] text-gray-500 hover:text-[#002D62] dark:hover:text-blue-400 transition-colors font-medium" href="#">
            {t("termsConditions")}
          </a>
          <a className="text-[11px] text-gray-500 hover:text-[#002D62] dark:hover:text-blue-400 transition-colors font-medium" href="#">
            {t("contactUs")}
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
              <span className="text-[10px]">
                {item.name
                  .replace("Application", "Apply")
                  .replace("Review Status", "Status")}
              </span>
            </Link>
          );
        })}
      </nav>

      <AiHelpChat
        audience="applicant"
        pageContext={getApplicantAiPageContext(pathname)}
      />
    </div>
  );
}

// For notifications dropdown translation (layout.tsx uses dropdown, page.tsx uses container)
function getNotificationMessage(
  notification: NotificationHistoryItem,
  t: (key: string, values?: Record<string, string | number>) => string,
) {
  if (notification.eventType === "application_submitted") {
    return t("applicationSubmittedMessage", {
      application: notification.applicationTitle || "",
      reference: notification.referenceNumber || "",
    });
  }

  if (notification.eventType === "status_updated") {
    if (notification.message.toLowerCase().includes("approved")) {
      return t("approvedMessage", {
        application: notification.applicationTitle || "",
        reference: notification.referenceNumber || "",
      });
    }

    if (notification.message.toLowerCase().includes("rejected")) {
      return t("rejectedMessage", {
        application: notification.applicationTitle || "",
        reference: notification.referenceNumber || "",
      });
    }

    return t("statusUpdatedMessage", {
      application: notification.applicationTitle || "",
      reference: notification.referenceNumber || "",
    });
  }

  return notification.message;
}

// Same translation function but for title dropdown
function getNotificationTitle(
  notification: NotificationHistoryItem,
  t: (key: string, values?: Record<string, string | number>) => string,
) {
  if (notification.eventType === "application_submitted") {
    return t("applicationSubmittedTitle");
  }

  if (notification.eventType === "status_updated") {
    const message = notification.message.toLowerCase();

    if (message.includes("approved")) {
      return t("applicationStatusTitle", { status: t("approved") });
    }

    if (message.includes("rejected")) {
      return t("applicationStatusTitle", { status: t("rejected") });
    }

    return t("applicationStatusTitle", { status: t("updated") });
  }

  if (notification.eventType === "document_requested") {
    return t("actionRequiredTitle");
  }

  return notification.title;
}

function getApplicantAiPageContext(pathname: string) {
  if (pathname.includes("/new-application")) {
    return "Applicant New Application page. Users choose an application form and can view required documents on each application card.";
  }

  if (pathname.includes("/review-status")) {
    return "Applicant Review Status page. Users can view submitted application status, office remarks, action required notes, approvals, and rejections.";
  }

  if (pathname.includes("/notifications")) {
    return "Applicant Notifications page. Users can view in-app notification history and notification delivery preferences.";
  }

  if (pathname.includes("/settings")) {
    return "Applicant Settings page. Settings includes Profile, Security, Language, Theme, Notifications, and Support.";
  }

  if (pathname.includes("/dashboard")) {
    return "Applicant Dashboard page. Users can see recent applications and continue common portal actions.";
  }

  return "Applicant portal page. Help should focus on form choice, application status, notifications, settings, and portal navigation.";
}
