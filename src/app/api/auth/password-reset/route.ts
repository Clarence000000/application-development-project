import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { getAdminAuth } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const { email } = (await request.json()) as { email?: unknown };
  const recipientEmail = typeof email === "string" ? email.trim() : "";

  if (!recipientEmail || !recipientEmail.includes("@")) {
    return NextResponse.json(
      { error: "A valid email address is required." },
      { status: 400 },
    );
  }

  try {
    const generatedLink = await getAdminAuth().generatePasswordResetLink(
      recipientEmail,
    );
    const resetLink = buildLocalResetLink(generatedLink, request.nextUrl.origin);
    const { transporter } = createTransporter();

    await transporter.sendMail({
      from: getMailFromAddress(),
      to: recipientEmail,
      subject: "Reset your certificate portal password",
      text: buildTextEmail(resetLink),
      html: buildHtmlEmail(resetLink),
    });

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    console.error("Failed to send custom password reset email", error);

    return NextResponse.json(
      { error: getPasswordResetErrorMessage(error) },
      { status: 502 },
    );
  }
}

function buildLocalResetLink(generatedLink: string, origin: string) {
  const url = new URL(generatedLink);
  const mode = url.searchParams.get("mode") || "resetPassword";
  const oobCode = url.searchParams.get("oobCode");

  if (!oobCode) {
    throw new Error("Firebase reset link did not include an action code.");
  }

  return `${origin}/reset-password?mode=${encodeURIComponent(
    mode,
  )}&oobCode=${encodeURIComponent(oobCode)}`;
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
  };
}

function getMailFromAddress() {
  return (
    process.env.NODEMAILER_SMTP_FROM ||
    process.env.NODEMAILER_SMTP_USER ||
    "Certificate Portal <no-reply@certificate.local>"
  );
}

function buildTextEmail(resetLink: string) {
  return `Hello,

We received a request to reset your certificate portal password.

Reset your password here:
${resetLink}

If you did not request this, you can safely ignore this email.

Certificate Portal`;
}

function buildHtmlEmail(resetLink: string) {
  return `
    <div style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.6;">
      <p>Hello,</p>
      <h2 style="color: #002d62; margin-bottom: 8px;">Reset your password</h2>
      <p>We received a request to reset your certificate portal password.</p>
      <p>
        <a href="${escapeHtml(resetLink)}" style="display: inline-block; background: #002d62; color: #ffffff; padding: 10px 14px; text-decoration: none; border-radius: 6px; font-weight: 700;">
          Reset Password
        </a>
      </p>
      <p>If you did not request this, you can safely ignore this email.</p>
      <p style="font-size: 12px; color: #6b7280; margin-top: 24px;">
        This is an automated email from Certificate Portal.
      </p>
    </div>
  `;
}

function getPasswordResetErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "code" in error) {
    const code = String((error as { code?: unknown }).code || "");

    if (code === "auth/user-not-found") {
      return "No account exists with this email address.";
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Failed to send password reset email.";
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
