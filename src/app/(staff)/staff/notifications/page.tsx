"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import {
  getStaffNotificationKey,
  loadStaffNotificationReadKeys,
  mapStaffApplicationNotification,
  saveStaffNotificationReadKeys,
  sortStaffApplicationNotifications,
  type StaffApplicationNotification,
} from "@/lib/staffNotifications";
import { SUPERADMIN_EMAIL, type UserRole } from "@/lib/user_auth";

export default function StaffNotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<StaffApplicationNotification[]>([]);
  const [staffUid, setStaffUid] = useState("");
  const [readNotificationKeys, setReadNotificationKeys] = useState<Set<string>>(
    () => new Set(),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [scopeLabel, setScopeLabel] = useState("Assigned mukim");

  useEffect(() => {
    let unsubscribeApplications: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      unsubscribeApplications?.();
      unsubscribeApplications = null;

      if (!user) {
        setStaffUid("");
        setReadNotificationKeys(new Set());
        router.push("/login");
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

        setScopeLabel(role === "SuperAdmin" ? "All mukims" : district);

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
            setIsLoading(false);
          },
          (error) => {
            console.error("Staff notification listener failed", error);
            setIsLoading(false);
          },
        );
      } catch (error) {
        console.error("Failed to load staff notifications", error);
        setIsLoading(false);
      }
    });

    return () => {
      unsubscribeApplications?.();
      unsubscribeAuth();
    };
  }, [router]);

  const newSubmissionCount = useMemo(
    () => notifications.filter((notification) => notification.kind === "new_submission").length,
    [notifications],
  );
  const overdueCount = useMemo(
    () => notifications.filter((notification) => notification.kind === "overdue_pending").length,
    [notifications],
  );
  const unreadCount = useMemo(
    () =>
      notifications.filter(
        (notification) =>
          !readNotificationKeys.has(getStaffNotificationKey(notification)),
      ).length,
    [notifications, readNotificationKeys],
  );

  function markNotificationRead(notification: StaffApplicationNotification) {
    if (!staffUid) return;

    setReadNotificationKeys((current) => {
      const next = new Set(current);
      next.add(getStaffNotificationKey(notification));
      saveStaffNotificationReadKeys(staffUid, next);
      return next;
    });
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <header className="flex flex-col gap-3 border-b border-outline-variant pb-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-primary">
            Notifications
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-on-surface-variant">
            Only newly submitted pending applications and pending applications that are 3 days late appear here.
          </p>
          <div className="mt-2 inline-flex items-center gap-2 rounded-lg border border-outline-variant bg-white px-3 py-1.5 text-xs font-semibold text-on-surface">
            <span className="material-symbols-outlined text-[16px] text-primary">location_on</span>
            Scope: {scopeLabel}
          </div>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <SummaryCard
          icon="mark_email_unread"
          label="Unread"
          value={String(unreadCount)}
        />
        <SummaryCard
          icon="outgoing_mail"
          label="Newly Submitted"
          value={String(newSubmissionCount)}
        />
        <SummaryCard
          icon="pending_actions"
          label="3+ Days Late"
          value={String(overdueCount)}
        />
      </section>

      <section className="overflow-hidden rounded-lg border border-outline-variant bg-white">
        <div className="flex items-center justify-between border-b border-outline-variant px-4 py-3">
          <div>
            <h2 className="text-sm font-bold text-primary">Priority Notifications</h2>
            <p className="mt-0.5 text-xs text-on-surface-variant">
              Click a card to open the exact application in Approval Review.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="p-10 text-center text-sm font-medium text-secondary">
            Loading notifications...
          </div>
        ) : notifications.length > 0 ? (
          <div className="divide-y divide-outline-variant">
            {notifications.map((notification) => {
              const isRead = readNotificationKeys.has(
                getStaffNotificationKey(notification),
              );

              return (
                <Link
                  key={notification.documentId}
                  className={`flex flex-col gap-3 px-4 py-4 transition hover:bg-surface-container-low sm:flex-row sm:items-start sm:justify-between ${
                    isRead ? "bg-white" : "bg-primary/5"
                  }`}
                  href={`/staff/approval-review?focus=${encodeURIComponent(
                    notification.referenceNumber,
                  )}`}
                  onClick={() => markNotificationRead(notification)}
                >
                  <div className="flex min-w-0 gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                        isRead
                          ? "bg-surface-container-high text-on-surface-variant"
                          : "bg-amber-100 text-amber-950"
                      }`}
                    >
                    <span className="material-symbols-outlined text-[20px]">
                      {isRead ? "notifications" : "priority_high"}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-bold text-on-surface">
                        {notification.referenceNumber}
                      </h3>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                          notification.kind === "new_submission"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-amber-100 text-amber-950"
                        }`}
                      >
                        {notification.kind === "new_submission"
                          ? "New Submission"
                          : "3+ Days Late"}
                      </span>
                      {!isRead && (
                        <span className="rounded-full bg-primary px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                          New
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs leading-5 text-on-surface-variant">
                      {notification.kind === "new_submission"
                        ? `${notification.applicantName} submitted a new application.`
                        : `${notification.applicantName} has been pending for ${notification.pendingDays} days.`}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-semibold text-outline">
                      <span>{notification.applicationTitle}</span>
                      <span>{notification.district}</span>
                      <span>Submitted {formatDate(notification.submittedAt)}</span>
                    </div>
                  </div>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-primary">
                  Open application
                  <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                </span>
              </Link>
              );
            })}
          </div>
        ) : (
          <div className="flex min-h-[360px] flex-col items-center justify-center p-10 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-container-low text-outline">
              <span className="material-symbols-outlined text-3xl">
                notifications_off
              </span>
            </div>
            <h3 className="text-sm font-bold text-on-surface">
              No priority notifications
            </h3>
            <p className="mt-1 max-w-xs text-xs text-on-surface-variant">
              New submissions and applications that pass the 3-day pending threshold will appear here.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-outline-variant bg-white p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-container-low text-primary">
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wide text-outline">
            {label}
          </p>
          <p className="mt-0.5 truncate text-sm font-bold text-on-surface">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function formatDate(date: Date | null) {
  if (!date) {
    return "Pending";
  }

  return new Intl.DateTimeFormat("en-MY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
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
