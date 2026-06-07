import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type {
  EmailNotificationPayload,
  NotificationEventType,
  NotificationPreferences,
} from "@/lib/notifications";

export const runtime = "nodejs";

type DeliveryStatus = "sent" | "preview" | "skipped" | "failed";

const defaultPreferences: NotificationPreferences = {
  emailEnabled: true,
  applicationSubmitted: true,
  statusUpdates: true,
};

export async function POST(request: NextRequest) {
  let payload: EmailNotificationPayload;

  try {
    payload = normalizePayload(await request.json());
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid payload." },
      { status: 400 },
    );
  }

  const preferences = await getPreferences(payload.userId);
  const emailAllowed = isEmailAllowed(preferences, payload.eventType);
  const copy = buildNotificationCopy(payload, request.nextUrl.origin);

  if (!emailAllowed) {
    await createHistoryRecord(payload, copy, "skipped");
    return NextResponse.json({ ok: true, deliveryStatus: "skipped" });
  }

  try {
    const { transporter, deliveryStatus } = createTransporter();

    await transporter.sendMail({
      from: getMailFromAddress(),
      to: payload.recipientEmail,
      subject: copy.subject,
      text: copy.text,
      html: copy.html,
    });

    await createHistoryRecord(payload, copy, deliveryStatus);
    return NextResponse.json({ ok: true, deliveryStatus });
  } catch (error) {
    console.error("Failed to send notification email", error);
    await createHistoryRecord(payload, copy, "failed");

    return NextResponse.json(
      { error: "Email notification could not be sent." },
      { status: 502 },
    );
  }
}

async function getPreferences(userId: string) {
  const preferencesSnap = await getDoc(doc(db, "notificationPreferences", userId));

  if (!preferencesSnap.exists()) {
    return defaultPreferences;
  }

  const data = preferencesSnap.data();

  return {
    emailEnabled:
      typeof data.emailEnabled === "boolean"
        ? data.emailEnabled
        : defaultPreferences.emailEnabled,
    applicationSubmitted:
      typeof data.applicationSubmitted === "boolean"
        ? data.applicationSubmitted
        : defaultPreferences.applicationSubmitted,
    statusUpdates:
      typeof data.statusUpdates === "boolean"
        ? data.statusUpdates
        : defaultPreferences.statusUpdates,
  };
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

  return preferences.statusUpdates;
}

function createTransporter() {
  const host = process.env.NODEMAILER_SMTP_HOST;
  const user = process.env.NODEMAILER_SMTP_USER;
  const pass = process.env.NODEMAILER_SMTP_PASS;
  const port = Number(process.env.NODEMAILER_SMTP_PORT || 587);
  const secure =
    (process.env.NODEMAILER_SMTP_SECURE || "").toLowerCase() === "true";

  if (!host || !user || !pass) {
    throw new Error(
      "Nodemailer SMTP is not configured. Set NODEMAILER_SMTP_HOST, NODEMAILER_SMTP_USER, and NODEMAILER_SMTP_PASS.",
    );
  }

  return {
    transporter: nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    }),
    deliveryStatus: "sent" as const,
  };
}

function getMailFromAddress() {
  return (
    process.env.NODEMAILER_SMTP_FROM ||
    process.env.NODEMAILER_SMTP_USER ||
    "Pejabat Penghulu <no-reply@penghulu.local>"
  );
}

async function createHistoryRecord(
  payload: EmailNotificationPayload,
  copy: ReturnType<typeof buildNotificationCopy>,
  deliveryStatus: DeliveryStatus,
) {
  await addDoc(collection(db, "notifications"), {
    userId: payload.userId,
    title: copy.title,
    message: copy.summary,
    applicationId: payload.applicationId || null,
    referenceNumber: payload.referenceNumber || null,
    applicationTitle: payload.applicationTitle,
    eventType: payload.eventType,
    deliveryChannel: "email",
    deliveryStatus,
    read: false,
    emailTo: payload.recipientEmail,
    createdAt: serverTimestamp(),
  });
}

function normalizePayload(data: Record<string, unknown>): EmailNotificationPayload {
  const userId = readString(data.userId);
  const recipientEmail = readString(data.recipientEmail);
  const applicationTitle = readString(data.applicationTitle);
  const eventType = readEventType(data.eventType);

  if (!userId) {
    throw new Error("User ID is required.");
  }

  if (!recipientEmail || !recipientEmail.includes("@")) {
    throw new Error("A valid recipient email is required.");
  }

  if (!applicationTitle) {
    throw new Error("Application title is required.");
  }

  return {
    userId,
    recipientEmail,
    applicationTitle,
    eventType,
    recipientName: readString(data.recipientName) || undefined,
    applicationId: readString(data.applicationId) || undefined,
    referenceNumber: readString(data.referenceNumber) || undefined,
    status: readString(data.status) || undefined,
    message: readString(data.message) || undefined,
    actionUrl: readString(data.actionUrl) || undefined,
  };
}

function buildNotificationCopy(
  payload: EmailNotificationPayload,
  origin: string,
) {
  const reference = payload.referenceNumber || payload.applicationId || "N/A";
  const actionUrl = toAbsoluteUrl(
    payload.actionUrl ||
      `/review-status?focus=${encodeURIComponent(payload.referenceNumber || "")}`,
    origin,
  );
  const greeting = payload.recipientName
    ? `Assalamualaikum/Salam sejahtera ${payload.recipientName},`
    : "Assalamualaikum/Salam sejahtera,";

  if (payload.eventType === "application_submitted") {
    const title = "Application Submitted";
    const summary = `Your ${payload.applicationTitle} application (${reference}) has been received and is now in review.`;

    return {
      title,
      summary,
      subject: `[Penghulu Portal] Application received - ${reference}`,
      text: `${greeting}\n\n${summary}\n\nYou can review the latest status here: ${actionUrl}\n\nPejabat Penghulu Mukim Ayer Hitam`,
      html: emailTemplate({
        greeting,
        title,
        summary,
        applicationTitle: payload.applicationTitle,
        reference,
        actionUrl,
      }),
    };
  }

  if (payload.eventType === "document_requested") {
    const title = "Action Required";
    const summary =
      payload.message ||
      `Additional documents are required for ${payload.applicationTitle} (${reference}).`;

    return {
      title,
      summary,
      subject: `[Penghulu Portal] Action required - ${reference}`,
      text: `${greeting}\n\n${summary}\n\nPlease review your application here: ${actionUrl}\n\nPejabat Penghulu Mukim Ayer Hitam`,
      html: emailTemplate({
        greeting,
        title,
        summary,
        applicationTitle: payload.applicationTitle,
        reference,
        actionUrl,
      }),
    };
  }

  const status = payload.status || "Updated";
  const title = `Application ${status}`;
  const summary =
    payload.message ||
    `Your ${payload.applicationTitle} application (${reference}) status has been updated to ${status}.`;

  return {
    title,
    summary,
    subject: `[Penghulu Portal] Status updated - ${reference}`,
    text: `${greeting}\n\n${summary}\n\nYou can review the latest status here: ${actionUrl}\n\nPejabat Penghulu Mukim Ayer Hitam`,
    html: emailTemplate({
      greeting,
      title,
      summary,
      applicationTitle: payload.applicationTitle,
      reference,
      actionUrl,
    }),
  };
}

function emailTemplate({
  greeting,
  title,
  summary,
  applicationTitle,
  reference,
  actionUrl,
}: {
  greeting: string;
  title: string;
  summary: string;
  applicationTitle: string;
  reference: string;
  actionUrl: string;
}) {
  return `
    <div style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.6;">
      <p>${escapeHtml(greeting)}</p>
      <h2 style="color: #002d62; margin-bottom: 8px;">${escapeHtml(title)}</h2>
      <p>${escapeHtml(summary)}</p>
      <table style="border-collapse: collapse; margin: 16px 0; width: 100%; max-width: 520px;">
        <tr>
          <td style="border: 1px solid #e5e7eb; padding: 10px; font-weight: 700;">Application</td>
          <td style="border: 1px solid #e5e7eb; padding: 10px;">${escapeHtml(applicationTitle)}</td>
        </tr>
        <tr>
          <td style="border: 1px solid #e5e7eb; padding: 10px; font-weight: 700;">Reference No.</td>
          <td style="border: 1px solid #e5e7eb; padding: 10px;">${escapeHtml(reference)}</td>
        </tr>
      </table>
      <p>
        <a href="${escapeHtml(actionUrl)}" style="display: inline-block; background: #002d62; color: #ffffff; padding: 10px 14px; text-decoration: none; border-radius: 6px; font-weight: 700;">
          View Application Status
        </a>
      </p>
      <p style="font-size: 12px; color: #6b7280; margin-top: 24px;">
        This is an automated notification from Pejabat Penghulu Mukim Ayer Hitam.
      </p>
    </div>
  `;
}

function toAbsoluteUrl(value: string, origin: string) {
  if (!value) {
    return `${origin}/review-status`;
  }

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  return `${origin}${value.startsWith("/") ? value : `/${value}`}`;
}

function readEventType(value: unknown): NotificationEventType {
  if (
    value === "application_submitted" ||
    value === "status_updated" ||
    value === "document_requested"
  ) {
    return value;
  }

  throw new Error("A valid notification event type is required.");
}

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
