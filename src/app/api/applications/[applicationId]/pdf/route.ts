import { NextResponse } from "next/server";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { generateSerialNumber } from "@/lib/applications";
import {
  generateApplicationCertificatePdf,
  type CertificateApplicant,
  type CertificateFormType,
  type CertificatePdfData,
} from "@/lib/pdf/applicationCertificatePdf";

type RouteContext = {
  params: Promise<{
    applicationId: string;
  }>;
};

export const runtime = "nodejs";

export async function GET(_request: Request, context: RouteContext) {
  const { applicationId } = await context.params;
  const certificateData = await findApprovedCertificateData(applicationId);

  if (!certificateData) {
    return NextResponse.json(
      { error: "PDF hanya tersedia untuk permohonan yang telah diluluskan." },
      { status: 404 },
    );
  }

  const pdfBytes = await generateApplicationCertificatePdf(certificateData);
  const filename = `${certificateData.formType}-certificate-${applicationId}.pdf`;

  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

async function findApprovedCertificateData(applicationId: string) {
  return findApprovedCertificateDataFromFirestore(applicationId);
}

async function findApprovedCertificateDataFromFirestore(
  applicationId: string,
): Promise<CertificatePdfData | null> {
  try {
    const applicationSnapshot = await getDoc(
      doc(db, "applications", applicationId),
    );
    if (!applicationSnapshot.exists()) {
      return null;
    }

    const application = applicationSnapshot.data();
    if (String(application.status || "").toLowerCase() !== "approved") {
      return null;
    }

    const uid = String(application.uid || "");
    const userSnapshot = uid ? await getDoc(doc(db, "users", uid)) : null;
    const user = userSnapshot?.exists() ? userSnapshot.data() : {};
    const values = (application.values || application.formData || {}) as Record<
      string,
      unknown
    >;
    const formType = normalizeFormType(
      application.formType || application.type,
    );

    if (!formType) {
      return null;
    }

    const approvedAt = toIsoDate(
      application.approvedAt ||
        application.updatedAt ||
        new Date().toISOString(),
    );
    const serialNumber = await getOrCreateSerialNumber(
      applicationId,
      application.serialNumber,
      approvedAt,
    );

    return {
      applicationId,
      referenceNumber: read(application.referenceNumber) || applicationId,
      formType,
      submittedAt: toIsoDate(
        application.submittedAt ||
          application.createdAt ||
          new Date().toISOString(),
      ),
      serialNumber,
      applicant: mapApplicant(values, user),
      approval: {
        approvedBy: String(
          application.approvedBy || application.penghuluName || "Penghulu",
        ),
        approvedAt,
        officeComment: String(
          application.officeComment ||
            application.approvalComment ||
            "Permohonan telah disemak dan diluluskan oleh pihak Pejabat Penghulu.",
        ),
      },
    };
  } catch (error) {
    console.error("Unable to load approved application from Firestore", error);
    return null;
  }
}

async function getOrCreateSerialNumber(
  applicationId: string,
  currentSerialNumber: unknown,
  approvedAt: string,
) {
  const existingSerialNumber = read(currentSerialNumber);
  if (existingSerialNumber) {
    return existingSerialNumber;
  }

  const serialNumber = generateSerialNumber(new Date(approvedAt));
  await updateDoc(doc(db, "applications", applicationId), { serialNumber });
  return serialNumber;
}

function mapApplicant(
  values: Record<string, unknown>,
  user: Record<string, unknown>,
): CertificateApplicant {
  return {
    name: read(values.name, user.name),
    idNumber: read(values.idNumber, user.icNumber),
    citizenship: read(values.citizenship, user.citizenship),
    icAddress: read(values.icAddress, user.addressIC),
    residentialAddress: read(values.residentialAddress, user.addressCurrent),
    residentialStatus: read(values.residentialStatus),
    otherResidentialStatus: read(values.otherResidentialStatus),
    durationYears: read(values.durationYears),
    durationMonths: read(values.durationMonths),
    durationDays: read(values.durationDays),
    maritalStatus: read(values.maritalStatus, user.maritalStatus),
    referenceNumber: read(values.referenceNumber),
    occupation: read(values.occupation, user.occupation),
    income: read(values.income, user.monthlyIncome),
    purpose: read(values.purpose),
    phoneNumber: read(values.phoneNumber, user.phoneNumber),
    caseType: read(values.caseType),
    incidentDate: read(values.incidentDate),
    fineAmount: read(values.fineAmount),
    incidentDetails: read(values.incidentDetails),
    appealReason: read(values.appealReason),
  };
}

function normalizeFormType(value: unknown): CertificateFormType | null {
  const normalized = String(value || "").toLowerCase();
  if (
    normalized.includes("residential") ||
    normalized.includes("bermastautin")
  ) {
    return "residential";
  }
  if (normalized.includes("income") || normalized.includes("pendapatan")) {
    return "income";
  }
  if (
    normalized.includes("ic") ||
    normalized.includes("rayuan") ||
    normalized.includes("denda")
  ) {
    return "ic-appeal";
  }
  return null;
}

function read(...values: unknown[]) {
  const found = values.find(
    (value) => value !== undefined && value !== null && String(value).trim(),
  );
  return found === undefined ? "" : String(found);
}

function toIsoDate(value: unknown) {
  if (
    typeof value === "object" &&
    value &&
    "toDate" in value &&
    typeof value.toDate === "function"
  ) {
    return value.toDate().toISOString();
  }
  return String(value || new Date().toISOString());
}
