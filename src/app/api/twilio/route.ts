import { NextResponse } from "next/server";
import twilio from "twilio";
import { db } from "@/lib/firebase"; // Adjust path to point to your firebase config file
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";

// Initialize Twilio client using your secure env variables
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const apiKeySid = process.env.TWILIO_API_SID;
const apiKeySecret = process.env.TWILIO_API_SECRET;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

// Helper function to format Malaysian phone numbers to E.164 format for Twilio (e.g. "012-345 6789" -> "+60123456789")
function formatToE164(phone: string): string {
  let cleaned = phone.replace(/\D/g, ""); // Remove dashes, spaces
  if (cleaned.startsWith("0")) {
    cleaned = "60" + cleaned.substring(1);
  }
  if (!cleaned.startsWith("+")) {
    cleaned = "+" + cleaned;
  }
  return cleaned;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
      applicantName,
      formName,
      phoneNumber,
      status,
      uid,
      notificationId: existingNotificationId,
    } = body;

    // Validate request inputs
    if (!id || !applicantName || !formName || !phoneNumber || !status || !uid) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const preferences = await getSmsPreferences(uid);
    if (!preferences.smsEnabled || !preferences.statusUpdates) {
      await updateSmsDeliveryStatus(existingNotificationId, "disabled", phoneNumber);
      return NextResponse.json({
        success: true,
        deliveryStatus: "disabled",
      });
    }

    // Generate a secure unique identifier natively without the 'uuid' package
    const generatedNotificationId = crypto.randomUUID();
    const formattedPhone = formatToE164(phoneNumber);

    // Build the precise text layout you requested
    const smsMessage = `Assalamualaikum/Salam Sejahtera ${applicantName},\n\nApplication is ${status}\n\nYour Borang ${formName} application (${id}) has been updated to ${status}.`;

    let deliveryStatus: "sent" | "failed" = "sent";

    try {
      if (!accountSid || !apiKeySid || !apiKeySecret || !twilioPhoneNumber) {
        throw new Error("Twilio SMS is not configured.");
      }

      const twilioClient = twilio(apiKeySid, apiKeySecret, { accountSid });

      // Dispatch the SMS payload via Twilio Gateway
      await twilioClient.messages.create({
        body: smsMessage,
        from: twilioPhoneNumber,
        to: formattedPhone, // Remember: For Trial accounts, this number MUST be verified in the Twilio Console
      });
      deliveryStatus = "sent";
    } catch (twilioError) {
      console.error("Twilio Gateway failure:", twilioError);
      deliveryStatus = "failed";
    }

    if (existingNotificationId) {
      await updateSmsDeliveryStatus(existingNotificationId, deliveryStatus, formattedPhone);
      return NextResponse.json({
        success: deliveryStatus === "sent",
        deliveryStatus,
        notificationId: existingNotificationId,
      });
    }

    // Save the transactional log directly into your "notifications" collection using modular Firestore syntax
    await setDoc(doc(db, "notifications", generatedNotificationId), {
      notificationId: generatedNotificationId,
      applicationId: id,
      uid,
      title: `Application ${status}`,
      message: smsMessage,
      eventType: "status_updated",
      deliveryChannel: "sms",
      deliveryStatus: deliveryStatus,
      read: false,
      referenceNumber: id,
      applicationTitle: formName,
      recipient: formattedPhone,
      createdAt: new Date(), // Saves automatically as a Firestore Timestamp
    });

    return NextResponse.json({
      success: deliveryStatus === "sent",
      notificationId: generatedNotificationId,
    });
  } catch (error) {
    console.error("Internal API route error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Internal SMS notification error",
      },
      { status: 500 },
    );
  }
}

async function updateSmsDeliveryStatus(
  notificationId: unknown,
  deliveryStatus: "sent" | "failed" | "disabled",
  recipient: unknown,
) {
  if (typeof notificationId !== "string" || !notificationId.trim()) {
    return;
  }

  await updateDoc(doc(db, "notifications", notificationId), {
    smsStatus: deliveryStatus,
    smsRecipient: typeof recipient === "string" ? formatToE164(recipient) : null,
    updatedAt: serverTimestamp(),
  });
}

async function getSmsPreferences(uid: string) {
  const preferencesSnap = await getDoc(doc(db, "notificationPreferences", uid));

  if (!preferencesSnap.exists()) {
    return {
      smsEnabled: false,
      statusUpdates: true,
    };
  }

  const data = preferencesSnap.data();

  return {
    smsEnabled: typeof data.smsEnabled === "boolean" ? data.smsEnabled : false,
    statusUpdates:
      typeof data.statusUpdates === "boolean" ? data.statusUpdates : true,
  };
}
