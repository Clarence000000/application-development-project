"use client";

import type { Timestamp } from "firebase/firestore";

export type StaffApplicationNotificationKind = "new_submission" | "overdue_pending";

export type StaffApplicationNotification = {
  documentId: string;
  referenceNumber: string;
  applicationTitle: string;
  applicantName: string;
  district: string;
  pendingDays: number;
  submittedAt: Date | null;
  kind: StaffApplicationNotificationKind;
};

const NEW_SUBMISSION_WINDOW_MS = 24 * 60 * 60 * 1000;
const OVERDUE_PENDING_DAYS = 3;
const READ_STORAGE_PREFIX = "staffNotificationReads";

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
  const pendingDays = Math.floor(ageMs / 86_400_000);
  const isNewSubmission = ageMs >= 0 && ageMs < NEW_SUBMISSION_WINDOW_MS;
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

  if (typeof value === "string") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  return null;
}
