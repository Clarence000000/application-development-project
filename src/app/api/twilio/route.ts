import { NextResponse } from "next/server";
import twilio from "twilio";
import { db } from "@/lib/firebase"; // Adjust path to point to your firebase config file
import { doc, setDoc } from "firebase/firestore";

// Initialize Twilio client using your secure env variables
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const apiKeySid = process.env.TWILIO_API_SID;
const apiKeySecret = process.env.TWILIO_API_SECRET;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

const twilioClient = twilio(apiKeySid, apiKeySecret, { accountSid });

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
    const { id, applicantName, formName, phoneNumber, status, uid } = body;

    // Validate request inputs
    if (!id || !applicantName || !formName || !phoneNumber || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Generate a secure unique identifier natively without the 'uuid' package
    const notificationId = crypto.randomUUID();
    const formattedPhone = formatToE164(phoneNumber);

    // Build the precise text layout you requested
    const smsMessage = `Assalamualaikum/Salam Sejahtera ${applicantName},\n\nApplication is ${status}\n\nYour Borang ${formName} application (${id}) has been updated to ${status}.`;

    let deliveryStatus: "sent" | "failed" = "sent";

    try {
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

    // Save the transactional log directly into your "notifications" collection using modular Firestore syntax
    await setDoc(doc(db, "notifications", notificationId), {
      notificationId: notificationId,
      applicationId: id,
      uid: uid || "SYSTEM_GENERATED", 
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

    return NextResponse.json({ success: deliveryStatus === "sent", notificationId });
  } catch (error: any) {
    console.error("Internal API route error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}