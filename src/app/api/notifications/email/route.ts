import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebaseAdmin";
import type {
  EmailNotificationPayload,
  NotificationEventType,
  NotificationPreferences,
} from "@/lib/notifications";

export const runtime = "nodejs";

type DeliveryStatus = "sent" | "failed";
const adminDb = getAdminDb();

const defaultPreferences: NotificationPreferences = {
  emailEnabled: true,
  smsEnabled: false,
  applicationSubmitted: true,
  statusUpdates: true,
  documentRequests: true,
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

  const preferences = await getPreferences(payload.uid);
  const emailAllowed = isEmailAllowed(preferences, payload.eventType);
  const copy = buildNotificationCopy(payload, request.nextUrl.origin);

  if (!emailAllowed) {
    await updateEmailDeliveryStatus(payload, "disabled");
    return NextResponse.json({
      ok: true,
      deliveryStatus: "disabled",
    });
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
      { error: getSmtpErrorMessage(error) },
      { status: 502 },
    );
  }
}

function getSmtpErrorMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return "Email notification could not be sent.";
  }

  const maybeSmtpError = error as Error & {
    code?: string;
    command?: string;
    responseCode?: number;
  };

  if (maybeSmtpError.code === "EAUTH" || maybeSmtpError.responseCode === 535) {
    return "SMTP authentication failed. For Gmail, use a Google App Password, not your normal Gmail password.";
  }

  if (maybeSmtpError.code === "ECONNECTION") {
    return "SMTP connection failed. Check NODEMAILER_SMTP_HOST, NODEMAILER_SMTP_PORT, and network access.";
  }

  if (maybeSmtpError.code === "ETIMEDOUT") {
    return "SMTP connection timed out. Check the SMTP host, port, and network connection.";
  }

  if (maybeSmtpError.command === "RCPT TO") {
    return "SMTP rejected the recipient address. Check the applicant email address.";
  }

  if (maybeSmtpError.command === "MAIL FROM") {
    return "SMTP rejected the sender address. Set NODEMAILER_SMTP_FROM to the same email as NODEMAILER_SMTP_USER.";
  }

  return "Email notification could not be sent. Check the SMTP configuration and sender account settings.";
}

async function getPreferences(uid: string) {
  const preferencesSnap = await adminDb
    .collection("notificationPreferences")
    .doc(uid)
    .get();

  if (!preferencesSnap.exists) {
    return defaultPreferences;
  }

  const data = preferencesSnap.data() ?? {};

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
    smsEnabled:
      typeof data.smsEnabled === "boolean"
        ? data.smsEnabled
        : defaultPreferences.smsEnabled,
    documentRequests:
      typeof data.documentRequests === "boolean"
        ? data.documentRequests
        : defaultPreferences.documentRequests,
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

  if (eventType === "document_requested") {
    return preferences.documentRequests;
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
    "Certificate Portal <no-reply@certificate.local>"
  );
}

async function createHistoryRecord(
  payload: EmailNotificationPayload,
  copy: ReturnType<typeof buildNotificationCopy>,
  deliveryStatus: DeliveryStatus,
) {
  if (payload.notificationId) {
    await updateEmailDeliveryStatus(payload, deliveryStatus);
    return;
  }

  await adminDb.collection("notifications").add({
    uid: payload.uid,
    title: copy.title,
    message: copy.summary,
    applicationId: payload.applicationId || null,
    referenceNumber: payload.referenceNumber || null,
    applicationTitle: payload.applicationTitle,
    eventType: payload.eventType,
    deliveryChannel: "email",
    deliveryStatus,
    read: false,
    recipient: payload.recipientEmail,
    createdAt: FieldValue.serverTimestamp(),
  });
}

async function updateEmailDeliveryStatus(
  payload: EmailNotificationPayload,
  deliveryStatus: DeliveryStatus | "disabled",
) {
  if (!payload.notificationId) {
    return;
  }

  await adminDb.collection("notifications").doc(payload.notificationId).set({
    emailStatus: deliveryStatus,
    emailRecipient: payload.recipientEmail,
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
}

function normalizePayload(data: Record<string, unknown>): EmailNotificationPayload {
  const uid = readString(data.uid) || readString(data.userId);
  const recipientEmail = readString(data.recipientEmail);
  const applicationTitle = readString(data.applicationTitle);
  const eventType = readEventType(data.eventType);

  if (!uid) {
    throw new Error("User ID is required.");
  }

  if (!recipientEmail || !recipientEmail.includes("@")) {
    throw new Error("A valid recipient email is required.");
  }

  if (!applicationTitle) {
    throw new Error("Application title is required.");
  }

  return {
    uid,
    recipientEmail,
    applicationTitle,
    eventType,
    recipientName: readString(data.recipientName) || undefined,
    notificationId: readString(data.notificationId) || undefined,
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
    ? `Hello ${payload.recipientName},`
    : "Hello,";

  if (payload.eventType === "application_submitted") {
    const title = "Application Submitted";
    const summary = `We have received your ${payload.applicationTitle} application (${reference}) and is now in review.`;

    return {
      title,
      summary,
      subject: `[Certificate Portal] Application received - ${reference}`,
      text: `${greeting}\n\n${summary}\n\nYou can review the latest status here: ${actionUrl}\n\nCertificate Portal`,
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
      subject: `[Certificate Portal] Action required - ${reference}`,
      text: `${greeting}\n\n${summary}\n\nPlease review your application here: ${actionUrl}\n\nCertificate Portal`,
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
  const summary = payload.message || buildStatusSummary(payload, reference);

  return {
    title,
    summary,
    subject: `[Certificate Portal] Status updated - ${reference}`,
    text: `${greeting}\n\n${summary}\n\nYou can review the latest status here: ${actionUrl}\n\nCertificate Portal`,
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

function buildStatusSummary(
  payload: EmailNotificationPayload,
  reference: string,
) {
  if (payload.status === "Approved") {
    return `Your ${payload.applicationTitle} application (${reference}) has been approved. You may view the latest status and download the approved document when it is available.`;
  }

  if (payload.status === "Rejected") {
    return `Your ${payload.applicationTitle} application (${reference}) has been rejected. Please review the reason provided by the office.`;
  }

  return `Your ${payload.applicationTitle} application (${reference}) has a new update.`;
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
      ${renderStructuredMessage(summary)}
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
        This is an automated notification from the Certificate Portal.
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

function renderStructuredMessage(value: string) {
  const lines = value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return "";
  }

  const htmlParts: string[] = [];
  let listItems: string[] = [];
  let listType: "ul" | "ol" | null = null;

  function flushList() {
    if (!listType || listItems.length === 0) {
      return;
    }

    htmlParts.push(
      `<${listType} style="margin: 8px 0 16px 22px; padding: 0;">${listItems.join("")}</${listType}>`,
    );
    listItems = [];
    listType = null;
  }

  for (const line of lines) {
    if (/^-{3,}$/.test(line) || isMarkdownTableSeparator(line)) {
      flushList();
      htmlParts.push(`<hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 16px 0;" />`);
      continue;
    }

    if (isMarkdownTableRow(line)) {
      flushList();
      htmlParts.push(
        `<p style="margin: 0 0 8px;">${parseMarkdownTableRow(line)
          .map((cell) => escapeHtml(stripMarkdown(cell)))
          .join(" · ")}</p>`,
      );
      continue;
    }

    const headingMatch = line.match(/^#{1,6}\s+(.+)$/);
    if (headingMatch) {
      flushList();
      htmlParts.push(
        `<h3 style="color: #002d62; font-size: 16px; margin: 18px 0 8px;">${escapeHtml(stripMarkdown(headingMatch[1]))}</h3>`,
      );
      continue;
    }

    const bulletMatch = line.match(/^[-*]\s+(.+)$/);
    if (bulletMatch) {
      if (listType !== "ul") {
        flushList();
        listType = "ul";
      }
      listItems.push(`<li style="margin: 0 0 6px;">${escapeHtml(stripMarkdown(bulletMatch[1]))}</li>`);
      continue;
    }

    const numberedMatch = line.match(/^\d+\.\s+(.+)$/);
    if (numberedMatch) {
      if (listType !== "ol") {
        flushList();
        listType = "ol";
      }
      listItems.push(`<li style="margin: 0 0 6px;">${escapeHtml(stripMarkdown(numberedMatch[1]))}</li>`);
      continue;
    }

    flushList();
    htmlParts.push(`<p style="margin: 0 0 12px;">${escapeHtml(stripMarkdown(line))}</p>`);
  }

  flushList();

  return htmlParts.join("");
}

function stripMarkdown(value: string) {
  return value
    .replace(/^#{1,6}\s+/, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/`([^`]+)`/g, "$1");
}

function isMarkdownTableRow(line: string) {
  return line.includes("|") && parseMarkdownTableRow(line).length > 1;
}

function isMarkdownTableSeparator(line: string) {
  return /^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?$/.test(line);
}

function parseMarkdownTableRow(line: string) {
  return line
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim())
    .filter(Boolean);
}
