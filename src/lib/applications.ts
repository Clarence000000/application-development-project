import {
  collection,
  doc,
  serverTimestamp,
  setDoc,
  type FieldValue,
  type Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { ApplicationFormConfig, ApplicationSlug } from "@/lib/applicationForms";

export type ApplicationStatus = "Pending" | "In Review" | "Approved" | "Rejected";

export type ApplicationValues = Record<string, string>;

export type FirestoreApplication = {
  applicationId: string;
  referenceNumber: string;
  uid: string;
  formType: string;
  formSlug: ApplicationSlug;
  status: ApplicationStatus;
  submittedAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
  values: ApplicationValues;
  serialNumber: string | null;
  approvedAt: Timestamp | FieldValue | null;
  approvedBy: string | null;
  approvedByUid: string | null;
  officeComment: string | null;
  rejectedAt: Timestamp | FieldValue | null;
  rejectionReason: string | null;
};

export async function createApplicationDocument({
  uid,
  config,
  values,
}: {
  uid: string;
  config: ApplicationFormConfig;
  values: ApplicationValues;
}) {
  const applicationRef = doc(collection(db, "applications"));
  const referenceNumber = generateReferenceNumber();
  const application: FirestoreApplication = {
    applicationId: applicationRef.id,
    referenceNumber,
    uid,
    formType: config.title,
    formSlug: config.slug,
    status: "Pending",
    submittedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    values,
    serialNumber: null,
    approvedAt: null,
    approvedBy: null,
    approvedByUid: null,
    officeComment: null,
    rejectedAt: null,
    rejectionReason: null,
  };

  await setDoc(applicationRef, application);
  return {
    applicationId: applicationRef.id,
    referenceNumber,
  };
}

export function generateReferenceNumber(date = new Date()) {
  const year = date.getFullYear();
  const randomCode = Array.from(crypto.getRandomValues(new Uint8Array(3)))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();

  return `GC-${year}-${randomCode}`;
}
