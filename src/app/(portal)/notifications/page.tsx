"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  defaultNotificationPreferences,
  deleteNotificationHistory,
  formatNotificationDate,
  getNotificationHistory,
  getNotificationPreferences,
  markNotificationsAsRead,
  saveNotificationPreferences,
  type NotificationHistoryItem,
  type NotificationPreferences,
} from "@/lib/notifications";

export default function NotificationsPage() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    defaultNotificationPreferences,
  );
  const [history, setHistory] = useState<NotificationHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      setUserId(user.uid);

      try {
        const [loadedPreferences, loadedHistory] = await Promise.all([
          getNotificationPreferences(user.uid),
          getNotificationHistory(user.uid),
        ]);

        setPreferences(loadedPreferences);
        setHistory(loadedHistory);
      } catch (error) {
        console.error("Failed to load notifications", error);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const unreadCount = useMemo(
    () => history.filter((notification) => !notification.read).length,
    [history],
  );

  async function updatePreference(
    key: keyof NotificationPreferences,
    value: boolean,
  ) {
    if (!userId) return;

    const nextPreferences = {
      ...preferences,
      [key]: value,
    };

    setPreferences(nextPreferences);
    setIsSaving(true);

    try {
      await saveNotificationPreferences(userId, nextPreferences);
      showToast("Notification preferences saved.");
    } catch (error) {
      console.error("Failed to save notification preferences", error);
      setPreferences(preferences);
      showToast("Preferences could not be saved.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleMarkAllRead() {
    if (history.length === 0) return;

    try {
      await markNotificationsAsRead(history);
      setHistory((current) =>
        current.map((notification) => ({ ...notification, read: true })),
      );
      showToast("Notification history marked as read.");
    } catch (error) {
      console.error("Failed to mark notifications as read", error);
      showToast("Notifications could not be updated.");
    }
  }

  async function handleClearAll() {
    if (history.length === 0) return;

    try {
      await deleteNotificationHistory(history);
      setHistory([]);
      showToast("Notification history cleared.");
    } catch (error) {
      console.error("Failed to clear notification history", error);
      showToast("Notification history could not be cleared.");
    }
  }

  function showToast(message: string) {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(""), 2600);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-col gap-3 border-b border-outline-variant pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-primary md:text-3xl">
            Email Notifications
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-on-surface-variant">
            Manage email alerts and review notification history for your submitted applications.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-outline-variant bg-white px-3 py-2 text-xs font-bold text-on-surface">
          <span className="material-symbols-outlined text-[17px] text-primary">
            mark_email_unread
          </span>
          {unreadCount} unread
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="rounded-lg border border-outline-variant bg-white p-4">
          <div className="flex items-start justify-between gap-3 border-b border-outline-variant pb-3">
            <div>
              <h2 className="text-sm font-bold text-primary">
                Notification Preferences
              </h2>
              <p className="mt-1 text-xs leading-5 text-on-surface-variant">
                Control which email alerts the system sends to your registered account.
              </p>
            </div>
            {isSaving && (
              <span className="rounded-full bg-secondary-container px-2 py-1 text-[10px] font-bold text-on-secondary-container">
                Saving
              </span>
            )}
          </div>

          <div className="mt-4 space-y-3">
            <PreferenceToggle
              checked={preferences.emailEnabled}
              description="Master switch for all email alerts."
              icon="mail"
              label="Email alerts"
              onChange={(checked) => updatePreference("emailEnabled", checked)}
            />
            <PreferenceToggle
              checked={preferences.smsEnabled}
              description="Reserved for SMS alerts when the SMS channel is enabled."
              icon="sms"
              label="SMS alerts"
              onChange={(checked) => updatePreference("smsEnabled", checked)}
            />
            <PreferenceToggle
              checked={preferences.applicationSubmitted}
              description="Receive an email when a new application is recorded."
              disabled={!preferences.emailEnabled && !preferences.smsEnabled}
              icon="outgoing_mail"
              label="Application submitted"
              onChange={(checked) =>
                updatePreference("applicationSubmitted", checked)
              }
            />
            <PreferenceToggle
              checked={preferences.statusUpdates}
              description="Receive updates for approval, rejection, or document requests."
              disabled={!preferences.emailEnabled && !preferences.smsEnabled}
              icon="published_with_changes"
              label="Status updates"
              onChange={(checked) => updatePreference("statusUpdates", checked)}
            />
            <PreferenceToggle
              checked={preferences.documentRequests}
              description="Receive alerts when staff request additional documents."
              disabled={!preferences.emailEnabled && !preferences.smsEnabled}
              icon="upload_file"
              label="Document requests"
              onChange={(checked) =>
                updatePreference("documentRequests", checked)
              }
            />
          </div>
        </aside>

        <section className="flex max-h-[calc(100vh-220px)] min-h-[520px] flex-col overflow-hidden rounded-lg border border-outline-variant bg-white">
          <div className="flex flex-col gap-3 border-b border-outline-variant px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-bold text-primary">
                Notification History
              </h2>
              <p className="mt-0.5 text-xs text-on-surface-variant">
                {history.length} email notification record(s)
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-error bg-white px-3 py-2 text-xs font-bold text-error transition hover:bg-error-container/30 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={history.length === 0}
                onClick={handleClearAll}
              >
                <span className="material-symbols-outlined text-[16px]">
                  delete_sweep
                </span>
                Clear all
              </button>
              <button
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-outline bg-white px-3 py-2 text-xs font-bold text-primary transition hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-50"
                disabled={unreadCount === 0}
                onClick={handleMarkAllRead}
              >
                <span className="material-symbols-outlined text-[16px]">
                  done_all
                </span>
                Mark all read
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-10 text-center text-sm font-medium text-secondary">
                Loading notification history...
              </div>
            ) : history.length > 0 ? (
              <div className="divide-y divide-outline-variant">
                {history.map((notification) => (
                  <NotificationHistoryRow
                    key={notification.id}
                    notification={notification}
                  />
                ))}
              </div>
            ) : (
              <div className="p-10 text-center">
                <span className="material-symbols-outlined text-4xl text-outline">
                  notifications_off
                </span>
                <h3 className="mt-2 text-sm font-bold text-on-surface">
                  No notifications yet
                </h3>
                <p className="mt-1 text-xs text-on-surface-variant">
                  Email alerts will appear here after an application event is triggered.
                </p>
              </div>
            )}
          </div>
        </section>
      </section>

      {toastMessage && (
        <div className="fixed bottom-20 right-6 z-50 flex items-center gap-2 rounded-lg bg-inverse-surface px-4 py-3 text-xs font-semibold text-inverse-on-surface shadow-lg">
          <span className="material-symbols-outlined text-sm text-green-400">
            check_circle
          </span>
          {toastMessage}
        </div>
      )}
    </div>
  );
}

function PreferenceToggle({
  checked,
  description,
  disabled = false,
  icon,
  label,
  onChange,
}: {
  checked: boolean;
  description: string;
  disabled?: boolean;
  icon: string;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      className={`flex items-start gap-3 rounded-lg border border-outline-variant bg-surface-container-lowest p-3 transition ${
        disabled ? "opacity-55" : "hover:border-primary"
      }`}
    >
      <span className="material-symbols-outlined mt-0.5 text-[19px] text-primary">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-on-surface">{label}</span>
        <span className="mt-0.5 block text-xs leading-5 text-on-surface-variant">
          {description}
        </span>
      </span>
      <input
        checked={checked}
        className="mt-1 h-4 w-4 accent-primary"
        disabled={disabled}
        type="checkbox"
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}

function NotificationHistoryRow({
  notification,
}: {
  notification: NotificationHistoryItem;
}) {
  const statusStyle = {
    sent: "bg-green-100 text-green-800",
    preview: "bg-blue-100 text-blue-800",
    skipped: "bg-surface-container-high text-on-surface-variant",
    failed: "bg-error-container text-on-error-container",
  }[notification.deliveryStatus];

  return (
    <div className="flex flex-col gap-3 px-4 py-4 transition hover:bg-surface-container-low sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
            notification.read
              ? "bg-surface-container-high text-on-surface-variant"
              : "bg-primary text-white"
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">
            {notification.read ? "mail" : "mark_email_unread"}
          </span>
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-bold text-on-surface">
              {notification.title}
            </h3>
            {!notification.read && (
              <span className="rounded-full bg-primary px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                New
              </span>
            )}
          </div>
          <p className="mt-1 text-xs leading-5 text-on-surface-variant">
            {notification.message}
          </p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-semibold text-outline">
            <span>{formatNotificationDate(notification.createdAt)}</span>
            {notification.referenceNumber && (
              <span>Ref: {notification.referenceNumber}</span>
            )}
            {notification.applicationTitle && (
              <span>{notification.applicationTitle}</span>
            )}
          </div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-end">
        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${statusStyle}`}
        >
          {notification.deliveryStatus}
        </span>
        {notification.referenceNumber && (
          <Link
            className="text-xs font-bold text-primary hover:underline"
            href={`/review-status?focus=${encodeURIComponent(notification.referenceNumber)}`}
          >
            View status
          </Link>
        )}
      </div>
    </div>
  );
}
