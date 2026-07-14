"use client";

import {
  collection,
  getDocs,
  onSnapshot,
  query,
  where,
  type Firestore,
  type Timestamp,
} from "firebase/firestore";
import type { UserRole } from "@/lib/user_auth";

export type StaffApplicationNotificationKind = "new_submission" | "overdue_pending";

export type StaffApplicationNotification = {
  documentId: string;
  referenceNumber: string;
  applicationTitle: string;
  applicantName: string;
  district: string;
  pendingDays: number;
  submittedAt: Date;
  kind: StaffApplicationNotificationKind;
};

const NEW_SUBMISSION_WINDOW_MS = 24 * 60 * 60 * 1000;
const OVERDUE_PENDING_DAYS = 3;
const READ_STORAGE_PREFIX = "staffNotificationReads";
const READ_SYNC_EVENT = "staff-notification-reads-updated";
const FRESH_TIMESTAMP_SKEW_MS = 5 * 60 * 1000;
const STAFF_NOTIFICATION_STARTUP_REFRESH_MS = 1_000;

type StaffNotificationSubscriptionOptions = {
  db: Firestore;
  role: UserRole;
  district: string;
  onChange: (items: StaffApplicationNotification[]) => void;
  onError?: (error: Error) => void;
};

export function subscribeStaffApplicationNotifications({
  db,
  role,
  district,
  onChange,
  onError,
}: StaffNotificationSubscriptionOptions) {
  const applicationsQuery =
    role === "SuperAdmin"
      ? query(collection(db, "applications"))
      : query(collection(db, "applications"), where("district", "==", district));

  let isActive = true;

  const publishSnapshot = (
    docs: Array<{ id: string; data: () => Record<string, unknown> }>,
  ) => {
    const priorityItems = docs
      .map((applicationSnapshot) =>
        mapStaffApplicationNotification(
          applicationSnapshot.id,
          applicationSnapshot.data(),
        ),
      )
      .filter((item): item is StaffApplicationNotification => Boolean(item))
      .sort(sortStaffApplicationNotifications);

    onChange(priorityItems);
  };

  const refreshSnapshot = async () => {
    try {
      const snapshot = await getDocs(applicationsQuery);
      if (isActive) {
        publishSnapshot(snapshot.docs);
      }
    } catch (error) {
      if (isActive) {
        onError?.(error instanceof Error ? error : new Error(String(error)));
      }
    }
  };

  const unsubscribeSnapshot = onSnapshot(
    applicationsQuery,
    (snapshot) => publishSnapshot(snapshot.docs),
    (error) => {
      onError?.(error);
      refreshSnapshot();
    },
  );
  const startupRefreshTimer = window.setTimeout(
    refreshSnapshot,
    STAFF_NOTIFICATION_STARTUP_REFRESH_MS,
  );
  const handleVisibilityChange = () => {
    if (!document.hidden) {
      refreshSnapshot();
    }
  };

  document.addEventListener("visibilitychange", handleVisibilityChange);

  return () => {
    isActive = false;
    unsubscribeSnapshot();
    window.clearTimeout(startupRefreshTimer);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
  };
}

export function mapStaffApplicationNotification(
  documentId: string,
  application: Record<string, unknown>,
) {
  const status = readString(application.status).toLowerCase();
  if (status && status !== "pending review" && status !== "in review") {
    return null;
  }

  if (application.staffVetted === true) {
    return null;
  }

  const submittedAt = toDate(application.submittedAt);
  if (!submittedAt) {
    return null;
  }

  const ageMs = Date.now() - submittedAt.getTime();
  const normalizedAgeMs = Math.max(ageMs, 0);
  const pendingDays = Math.floor(normalizedAgeMs / 86_400_000);
  const isNewSubmission =
    ageMs >= -FRESH_TIMESTAMP_SKEW_MS && normalizedAgeMs < NEW_SUBMISSION_WINDOW_MS;
  const isOverduePending = pendingDays >= OVERDUE_PENDING_DAYS;

  if (!isNewSubmission && !isOverduePending) {
    return null;
  }

  const values = readRecord(application.values, application.formData);

  return {
    documentId,
    referenceNumber:
      readString(application.referenceNumber, application.applicationId) || documentId,
    applicationTitle:
      readString(application.formType, application.title) || "Office Application",
    applicantName: readString(values.name, application.applicantName) || "Unknown Applicant",
    district: readString(application.district) || "Unassigned District",
    pendingDays,
    submittedAt,
    kind: isOverduePending ? "overdue_pending" : "new_submission",
  } satisfies StaffApplicationNotification;
}

export function sortStaffApplicationNotifications(
  left: StaffApplicationNotification,
  right: StaffApplicationNotification,
) {
  if (left.kind !== right.kind) {
    return left.kind === "overdue_pending" ? -1 : 1;
  }

  if (left.kind === "overdue_pending" && right.kind === "overdue_pending") {
    if (right.pendingDays !== left.pendingDays) {
      return right.pendingDays - left.pendingDays;
    }

    return (left.submittedAt?.getTime() || 0) - (right.submittedAt?.getTime() || 0);
  }

  return (right.submittedAt?.getTime() || 0) - (left.submittedAt?.getTime() || 0);
}

export function getStaffNotificationKey(
  notification: StaffApplicationNotification,
) {
  return `${notification.kind}:${notification.documentId}`;
}

export function loadStaffNotificationReadKeys(staffUid: string) {
  if (!staffUid || typeof window === "undefined") {
    return new Set<string>();
  }

  try {
    const rawValue = window.localStorage.getItem(getReadStorageKey(staffUid));
    const parsedValue = rawValue ? JSON.parse(rawValue) : [];

    return new Set(
      Array.isArray(parsedValue)
        ? parsedValue.filter((value): value is string => typeof value === "string")
        : [],
    );
  } catch {
    return new Set<string>();
  }
}

export function saveStaffNotificationReadKeys(
  staffUid: string,
  readKeys: Set<string>,
) {
  if (!staffUid || typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    getReadStorageKey(staffUid),
    JSON.stringify(Array.from(readKeys)),
  );
  window.setTimeout(() => {
    window.dispatchEvent(
      new CustomEvent(READ_SYNC_EVENT, {
        detail: { staffUid },
      }),
    );
  }, 0);
}

export function subscribeStaffNotificationReadKeys(
  staffUid: string,
  onChange: (readKeys: Set<string>) => void,
) {
  if (!staffUid || typeof window === "undefined") {
    return () => {};
  }

  const refreshReadKeys = () => {
    onChange(loadStaffNotificationReadKeys(staffUid));
  };
  const handleStorage = (event: StorageEvent) => {
    if (event.key === getReadStorageKey(staffUid)) {
      refreshReadKeys();
    }
  };
  const handleLocalSync = (event: Event) => {
    const detail = (event as CustomEvent<{ staffUid?: string }>).detail;
    if (detail?.staffUid === staffUid) {
      refreshReadKeys();
    }
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(READ_SYNC_EVENT, handleLocalSync);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(READ_SYNC_EVENT, handleLocalSync);
  };
}

function getReadStorageKey(staffUid: string) {
  return `${READ_STORAGE_PREFIX}:${staffUid}`;
}

function readRecord(...values: unknown[]) {
  const found = values.find((value) => value && typeof value === "object");
  return found ? (found as Record<string, unknown>) : {};
}

function readString(...values: unknown[]) {
  const found = values.find(
    (value) => typeof value === "string" && value.trim(),
  );

  return typeof found === "string" ? found.trim() : "";
}

function toDate(value: unknown) {
  if (value && typeof value === "object" && "toDate" in value) {
    return (value as Timestamp).toDate();
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (value && typeof value === "object" && "seconds" in value) {
    const seconds = (value as { seconds?: unknown }).seconds;
    if (typeof seconds === "number") {
      return new Date(seconds * 1000);
    }
  }

  if (typeof value === "string") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  return null;
}
