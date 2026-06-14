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

export type ApplicationStatus =
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
  mukim: string;
  submittedAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
  values: ApplicationValues;
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
}: {
  uid: string;
  config: ApplicationFormConfig;
  values: ApplicationValues;
}) {
  const applicationRef = doc(collection(db, "applications"));
  const referenceNumber = generateReferenceNumber();
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
    mukim: district,
    submittedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    values,
    meta: `Pejabat Penghulu ${district}`,
    timeline: [
      {
        title: "Permohonan Draf",
        date: timelineDate,
        desc: "Pemohon mula mengisi borang",
        done: true,
      },
      {
        title: "Permohonan Dihantar",
        date: timelineDate,
        desc: "Permohonan berjaya dihantar ke Pejabat Penghulu",
        done: true,
      },
      {
        title: "Dalam Semakan",
        date: "In Review",
        desc: "Menunggu pengesahan daripada Penghulu",
        done: false,
      },
      {
        title: "Kelulusan Akhir",
        date: "In Review",
        desc: "Pengeluaran sijil rasmi",
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

export function generateReferenceNumber(date = new Date()) {
  const year = date.getFullYear();
  const randomCode = Array.from(crypto.getRandomValues(new Uint8Array(3)))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();

  return `APP-${year}-${randomCode}`;
}
