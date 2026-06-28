import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  where,
  type FieldValue,
  type Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { ApplicationFormConfig, ApplicationSlug } from "@/lib/applicationForms";

export type ApplicationStatus =
  | "Draft"
  | "In Review"
  | "Action Required"
  | "Approved"
  | "Rejected";

export type ApplicationValues = Record<string, string>;

export type FirestoreApplication = {
  applicationId: string;
  referenceNumber: string;
  uid: string;
  userId: string;
  formType: string;
  formSlug: ApplicationSlug;
  type: ApplicationSlug;
  title: string;
  status: ApplicationStatus;
  district: string;
  submittedAt: Timestamp | FieldValue | null;
  updatedAt: Timestamp | FieldValue;
  values: ApplicationValues;
  declarationAccepted?: boolean;
  meta: string;
  timeline: {
    title: string;
    date: string;
    desc: string;
    done: boolean;
  }[];
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
  applicationId,
}: {
  uid: string;
  config: ApplicationFormConfig;
  values: ApplicationValues;
  applicationId?: string;
}) {
  const applicationRef = applicationId
    ? doc(db, "applications", applicationId)
    : doc(collection(db, "applications"));
  const existingSnapshot = await getDoc(applicationRef);
  const existingData = existingSnapshot.exists() ? existingSnapshot.data() : {};
  const referenceNumber =
    readString(existingData.referenceNumber) || generateReferenceNumber();
  const timelineDate = new Date().toLocaleDateString("ms-MY");
  const district = values.district;
  const application: FirestoreApplication = {
    applicationId: applicationRef.id,
    referenceNumber,
    uid,
    userId: uid,
    formType: config.title,
    formSlug: config.slug,
    type: config.slug,
    title: config.title,
    status: "In Review",
    district,
    submittedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    values,
    declarationAccepted: true,
    meta: `${district}`,
    timeline: [
      {
        title: "Draft Application",
        date: timelineDate,
        desc: "Applicant started filling in the form",
        done: true,
      },
      {
        title: "Application Submitted",
        date: timelineDate,
        desc: "Application was successfully submitted to the office",
        done: true,
      },
      {
        title: "Under Review",
        date: "In Review",
        desc: "Awaiting office verification",
        done: false,
      },
      {
        title: "Final Approval",
        date: "In Review",
        desc: "Official certificate issuance",
        done: false,
      },
    ],
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

export async function saveDraftApplicationDocument({
  uid,
  config,
  values,
  declarationAccepted,
  applicationId,
}: {
  uid: string;
  config: ApplicationFormConfig;
  values: ApplicationValues;
  declarationAccepted: boolean;
  applicationId?: string;
}) {
  const applicationRef = applicationId
    ? doc(db, "applications", applicationId)
    : doc(collection(db, "applications"));
  const result = await runTransaction(db, async (transaction) => {
    const existingSnapshot = await transaction.get(applicationRef);
    const existingData = existingSnapshot.exists() ? existingSnapshot.data() : {};
    const existingStatus = readString(existingData.status);
    const referenceNumber =
      readString(existingData.referenceNumber) || generateReferenceNumber();

    if (existingStatus && existingStatus !== "Draft") {
      return {
        applicationId: applicationRef.id,
        referenceNumber,
      };
    }

    const district = values.district;

    transaction.set(
      applicationRef,
      {
      applicationId: applicationRef.id,
      referenceNumber,
      uid,
      userId: uid,
      formType: config.title,
      formSlug: config.slug,
      type: config.slug,
      title: config.title,
      status: "Draft",
      district,
      submittedAt: null,
      updatedAt: serverTimestamp(),
      draftSavedAt: serverTimestamp(),
      values,
      declarationAccepted,
      meta: district ? `Mukim ${district}` : "None",
      serialNumber: null,
      approvedAt: null,
      approvedBy: null,
      approvedByUid: null,
      officeComment: null,
      rejectedAt: null,
      rejectionReason: null,
      },
      { merge: true },
    );

    return {
      applicationId: applicationRef.id,
      referenceNumber,
    };
  });

  return result;
}

export async function getLatestDraftApplication({
  uid,
  config,
}: {
  uid: string;
  config: ApplicationFormConfig;
}) {
  const querySnapshot = await getDocs(
    query(
      collection(db, "applications"),
      where("userId", "==", uid),
      where("formSlug", "==", config.slug),
      where("status", "==", "Draft"),
    ),
  );

  const drafts = querySnapshot.docs
    .map((snapshot) => {
      const data = snapshot.data();
      const updatedAt = toDate(data.updatedAt) || toDate(data.draftSavedAt);

      return {
        applicationId: snapshot.id,
        values: readApplicationValues(data.values),
        declarationAccepted: data.declarationAccepted === true,
        updatedAt,
      };
    })
    .sort((left, right) => {
      return (right.updatedAt?.getTime() || 0) - (left.updatedAt?.getTime() || 0);
    });

  return drafts[0] || null;
}

export async function deleteDraftApplicationDocument(applicationId: string) {
  await deleteDoc(doc(db, "applications", applicationId));
}

export function generateReferenceNumber(date = new Date()) {
  const year = date.getFullYear();
  const randomCode = Array.from(crypto.getRandomValues(new Uint8Array(3)))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();

  return `APP-${year}-${randomCode}`;
}

function readApplicationValues(value: unknown): ApplicationValues {
  if (!value || typeof value !== "object") {
    return {};
  }

  return Object.entries(value as Record<string, unknown>).reduce<ApplicationValues>(
    (values, [key, fieldValue]) => {
      values[key] = typeof fieldValue === "string" ? fieldValue : "";
      return values;
    },
    {},
  );
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
