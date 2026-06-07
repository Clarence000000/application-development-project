"use client";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export type NotificationEventType =
  | "application_submitted"
  | "status_updated"
  | "document_requested";

export type NotificationPreferences = {
  emailEnabled: boolean;
  applicationSubmitted: boolean;
  statusUpdates: boolean;
};

export type EmailNotificationPayload = {
  userId: string;
  recipientEmail: string;
  recipientName?: string;
  applicationId?: string;
  referenceNumber?: string;
  applicationTitle: string;
  eventType: NotificationEventType;
  status?: string;
  message?: string;
  actionUrl?: string;
};

export type NotificationHistoryItem = {
  id: string;
  userId: string;
  title: string;
  message: string;
  applicationId?: string;
  referenceNumber?: string;
  applicationTitle?: string;
  eventType: NotificationEventType;
  deliveryChannel: "email";
  deliveryStatus: "sent" | "preview" | "skipped" | "failed";
  read: boolean;
  createdAt: Date | null;
};

export const defaultNotificationPreferences: NotificationPreferences = {
  emailEnabled: true,
  applicationSubmitted: true,
  statusUpdates: true,
};

export async function getNotificationPreferences(userId: string) {
  const preferencesRef = doc(db, "notificationPreferences", userId);
  const preferencesSnap = await getDoc(preferencesRef);

  if (!preferencesSnap.exists()) {
    return defaultNotificationPreferences;
  }

  return normalizePreferences(preferencesSnap.data());
}

export async function saveNotificationPreferences(
  userId: string,
  preferences: NotificationPreferences,
) {
  await setDoc(
    doc(db, "notificationPreferences", userId),
    {
      ...preferences,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function triggerEmailNotification(
  payload: EmailNotificationPayload,
) {
  const response = await fetch("/api/notifications/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error || "Email notification failed.");
  }

  return response.json() as Promise<{
    ok: boolean;
    deliveryStatus: NotificationHistoryItem["deliveryStatus"];
  }>;
}

export async function getNotificationHistory(userId: string) {
  const historySnap = await getDocs(
    query(collection(db, "notifications"), where("userId", "==", userId)),
  );

  return historySnap.docs
    .map((snapshot) => mapNotificationHistoryItem(snapshot.id, snapshot.data()))
    .sort((left, right) => {
      const leftTime = left.createdAt?.getTime() || 0;
      const rightTime = right.createdAt?.getTime() || 0;
      return rightTime - leftTime;
    });
}

export async function markNotificationsAsRead(items: NotificationHistoryItem[]) {
  await Promise.all(
    items
      .filter((item) => !item.read)
      .map((item) => updateDoc(doc(db, "notifications", item.id), { read: true })),
  );
}

export function formatNotificationDate(date: Date | null) {
  if (!date) {
    return "Just now";
  }

  return new Intl.DateTimeFormat("en-MY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function normalizePreferences(data: Record<string, unknown>) {
  return {
    emailEnabled:
      typeof data.emailEnabled === "boolean"
        ? data.emailEnabled
        : defaultNotificationPreferences.emailEnabled,
    applicationSubmitted:
      typeof data.applicationSubmitted === "boolean"
        ? data.applicationSubmitted
        : defaultNotificationPreferences.applicationSubmitted,
    statusUpdates:
      typeof data.statusUpdates === "boolean"
        ? data.statusUpdates
        : defaultNotificationPreferences.statusUpdates,
  };
}

function mapNotificationHistoryItem(
  id: string,
  data: Record<string, unknown>,
): NotificationHistoryItem {
  return {
    id,
    userId: readString(data.userId),
    title: readString(data.title) || "Notification",
    message: readString(data.message),
    applicationId: readString(data.applicationId) || undefined,
    referenceNumber: readString(data.referenceNumber) || undefined,
    applicationTitle: readString(data.applicationTitle) || undefined,
    eventType: readEventType(data.eventType),
    deliveryChannel: "email",
    deliveryStatus: readDeliveryStatus(data.deliveryStatus),
    read: typeof data.read === "boolean" ? data.read : false,
    createdAt: toDate(data.createdAt),
  };
}

function readEventType(value: unknown): NotificationEventType {
  if (
    value === "application_submitted" ||
    value === "status_updated" ||
    value === "document_requested"
  ) {
    return value;
  }

  return "status_updated";
}

function readDeliveryStatus(value: unknown): NotificationHistoryItem["deliveryStatus"] {
  if (
    value === "sent" ||
    value === "preview" ||
    value === "skipped" ||
    value === "failed"
  ) {
    return value;
  }

  return "sent";
}

function readString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function toDate(value: unknown) {
  if (value && typeof value === "object" && "toDate" in value) {
    return (value as Timestamp).toDate();
  }

  if (typeof value === "string") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  return null;
}
