"use client";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
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
  smsEnabled: boolean;
  applicationSubmitted: boolean;
  statusUpdates: boolean;
  documentRequests: boolean;
};

export type EmailNotificationPayload = {
  uid: string;
  recipientEmail: string;
  recipientName?: string;
  notificationId?: string;
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
  uid: string;
  title: string;
  message: string;
  applicationId?: string;
  referenceNumber?: string;
  applicationTitle?: string;
  eventType: NotificationEventType;
  deliveryChannel: "in_app" | "email" | "sms";
  deliveryStatus: "sent" | "failed" | "disabled";
  emailStatus?: "sent" | "failed" | "disabled";
  smsStatus?: "sent" | "failed" | "disabled";
  recipient?: string;
  read: boolean;
  createdAt: Date | null;
};

export type InAppNotificationPayload = {
  uid: string;
  title: string;
  message: string;
  applicationId?: string;
  referenceNumber?: string;
  applicationTitle?: string;
  eventType: NotificationEventType;
};

export const defaultNotificationPreferences: NotificationPreferences = {
  emailEnabled: true,
  smsEnabled: false,
  applicationSubmitted: true,
  statusUpdates: true,
  documentRequests: true,
};

export async function getNotificationPreferences(uid: string) {
  const preferencesRef = doc(db, "notificationPreferences", uid);
  const preferencesSnap = await getDoc(preferencesRef);

  if (!preferencesSnap.exists()) {
    return defaultNotificationPreferences;
  }

  return normalizePreferences(preferencesSnap.data());
}

export async function saveNotificationPreferences(
  uid: string,
  preferences: NotificationPreferences,
) {
  await setDoc(
    doc(db, "notificationPreferences", uid),
    {
      uid,
      ...preferences,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function triggerEmailNotification(
  payload: EmailNotificationPayload,
) {
  try {
    const preferences = await getNotificationPreferences(payload.uid);

    if (!isEmailAllowed(preferences, payload.eventType)) {
      if (payload.notificationId) {
        await updateNotificationChannelStatus(
          payload.notificationId,
          "email",
          "disabled",
          payload.recipientEmail,
        );
      }

      return {
        ok: true,
        deliveryStatus: "disabled" as const,
      };
    }
  } catch (error) {
    console.warn("Could not precheck email notification preferences", error);
  }

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
    deliveryStatus: "sent" | "failed" | "disabled";
  }>;
}

function isEmailAllowed(
  preferences: NotificationPreferences,
  eventType: NotificationEventType,
) {
  if (!preferences.emailEnabled) {
    return false;
  }

  if (eventType === "application_submitted") {
    return preferences.applicationSubmitted;
  }

  if (eventType === "document_requested") {
    return preferences.documentRequests;
  }

  return preferences.statusUpdates;
}

export async function createInAppNotification(
  payload: InAppNotificationPayload,
) {
  const notificationRef = await addDoc(collection(db, "notifications"), {
    uid: payload.uid,
    title: payload.title,
    message: payload.message,
    applicationId: payload.applicationId || null,
    referenceNumber: payload.referenceNumber || null,
    applicationTitle: payload.applicationTitle || null,
    eventType: payload.eventType,
    deliveryChannel: "in_app",
    deliveryStatus: "sent",
    read: false,
    createdAt: serverTimestamp(),
  });

  return notificationRef.id;
}

export async function updateNotificationChannelStatus(
  notificationId: string,
  channel: "email" | "sms",
  status: "sent" | "failed" | "disabled",
  recipient?: string,
) {
  const statusField = channel === "email" ? "emailStatus" : "smsStatus";
  const recipientField = channel === "email" ? "emailRecipient" : "smsRecipient";

  await updateDoc(doc(db, "notifications", notificationId), {
    [statusField]: status,
    [recipientField]: recipient || null,
    updatedAt: serverTimestamp(),
  });
}

export async function getNotificationHistory(uid: string) {
  const currentSchemaSnap = await getDocs(
    query(collection(db, "notifications"), where("uid", "==", uid)),
  );
  const legacySchemaSnap = await getDocs(
    query(collection(db, "notifications"), where("userId", "==", uid)),
  );
  const snapshotsById = new Map(
    [...currentSchemaSnap.docs, ...legacySchemaSnap.docs].map((snapshot) => [
      snapshot.id,
      snapshot,
    ]),
  );

  return Array.from(snapshotsById.values())
    .map((snapshot) => mapNotificationHistoryItem(snapshot.id, snapshot.data()))
    .sort((left, right) => {
      const leftTime = left.createdAt?.getTime() || 0;
      const rightTime = right.createdAt?.getTime() || 0;
      return rightTime - leftTime;
    });
}

export function subscribeNotificationHistory(
  uid: string,
  onChange: (items: NotificationHistoryItem[]) => void,
  onError?: (error: Error) => void,
) {
  const currentSchemaQuery = query(
    collection(db, "notifications"),
    where("uid", "==", uid),
  );

  return onSnapshot(
    currentSchemaQuery,
    (snapshot) => {
      const items = snapshot.docs
        .map((docSnapshot) =>
          mapNotificationHistoryItem(docSnapshot.id, docSnapshot.data()),
        )
        .sort((left, right) => {
          const leftTime = left.createdAt?.getTime() || 0;
          const rightTime = right.createdAt?.getTime() || 0;
          return rightTime - leftTime;
        });

      onChange(items);
    },
    onError,
  );
}

export async function markNotificationsAsRead(items: NotificationHistoryItem[]) {
  await Promise.all(
    items
      .filter((item) => !item.read)
      .map((item) => updateDoc(doc(db, "notifications", item.id), { read: true })),
  );
}

export async function deleteNotificationHistory(items: NotificationHistoryItem[]) {
  await Promise.all(
    items.map((item) => deleteDoc(doc(db, "notifications", item.id))),
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
    smsEnabled:
      typeof data.smsEnabled === "boolean"
        ? data.smsEnabled
        : defaultNotificationPreferences.smsEnabled,
    applicationSubmitted:
      typeof data.applicationSubmitted === "boolean"
        ? data.applicationSubmitted
        : defaultNotificationPreferences.applicationSubmitted,
    statusUpdates:
      typeof data.statusUpdates === "boolean"
        ? data.statusUpdates
        : defaultNotificationPreferences.statusUpdates,
    documentRequests:
      typeof data.documentRequests === "boolean"
        ? data.documentRequests
        : defaultNotificationPreferences.documentRequests,
  };
}

function mapNotificationHistoryItem(
  id: string,
  data: Record<string, unknown>,
): NotificationHistoryItem {
  return {
    id,
    uid: readString(data.uid) || readString(data.userId),
    title: readString(data.title) || "Notification",
    message: readString(data.message),
    applicationId: readString(data.applicationId) || undefined,
    referenceNumber: readString(data.referenceNumber) || undefined,
    applicationTitle: readString(data.applicationTitle) || undefined,
    eventType: readEventType(data.eventType),
    deliveryChannel: readDeliveryChannel(data.deliveryChannel),
    deliveryStatus: readDeliveryStatus(data.deliveryStatus),
    emailStatus: readOptionalDeliveryStatus(data.emailStatus),
    smsStatus: readOptionalDeliveryStatus(data.smsStatus),
    recipient: readString(data.recipient) || readString(data.emailTo) || undefined,
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

function readDeliveryChannel(value: unknown): NotificationHistoryItem["deliveryChannel"] {
  if (value === "in_app" || value === "email" || value === "sms") {
    return value;
  }

  return "in_app";
}

function readDeliveryStatus(value: unknown): NotificationHistoryItem["deliveryStatus"] {
  if (value === "sent" || value === "failed" || value === "disabled") {
    return value;
  }

  return "sent";
}

function readOptionalDeliveryStatus(value: unknown) {
  if (value === "sent" || value === "failed" || value === "disabled") {
    return value;
  }

  return undefined;
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
