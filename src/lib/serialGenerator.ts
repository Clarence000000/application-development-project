import { createHmac } from "crypto";

interface SerialGeneratorOptions {
  prefix?: string;
}

// Secret key locked on your Next.js server environment (.env.local)
const SECRET_VERIFICATION_KEY = process.env.DOC_SIGNING_KEY || "super-secret-project-key";

/**
 * Generates an un-fakeable serial number with an embedded cryptographic signature.
 * Format: PREFIX/YEAR/PADDING_COUNTER-SIGNATURE
 * Example: PKG/2026/0042-B7A9X2
 * 
 * @param lastIncrementalId - The highest incremental number currently in your database tracking
 * @param icNumber - The user's icNumber from Firestore to tie the signature to their identity
 * @param options - Optional overrides like a custom application prefix
 */
export function generateSecureApplicationSerial(
  lastIncrementalId: number,
  icNumber: string,
  options: SerialGeneratorOptions = {}
): string {
  const prefix = options.prefix || "PKG";
  const currentYear = new Date().getFullYear(); // Resolves automatically to 2026
  
  // Calculate the sequential counter position
  const nextId = lastIncrementalId + 1;
  const paddedCounter = String(nextId).padStart(4, "0");
  
  // 1. Build the visible text Base Serial (Prefix, Year, and Counter)
  const baseSerial = `${prefix}/${currentYear}/${paddedCounter}`;

  // 2. Generate a 6-character unique cryptographic signature tied to the key and identity
  const signature = createHmac("sha256", SECRET_VERIFICATION_KEY)
    .update(`${baseSerial}-${icNumber}`)
    .digest("hex")
    .substring(0, 6)
    .toUpperCase();

  // 3. Output the final concatenated string
  return `${baseSerial}-${signature}`;
}

/**
 * Validates if a document serial number matches the applicant data and has not been altered
 */
export function verifyDocumentAuthenticity(printedSerial: string, actualIcNumber: string): boolean {
  try {
    // Split the printed serial number string from its signature suffix
    const parts = printedSerial.split("-");
    if (parts.length < 2) return false;

    const signatureToVerify = parts.pop(); // Grabs the signature chunk (e.g., "B7A9X2")
    const baseSerial = parts.join("-");    // Reconstructs the base text (e.g., "PKG/2026/0042")

    // Recalculate what the signature should be using our private backend environment key
    const expectedSignature = createHmac("sha256", SECRET_VERIFICATION_KEY)
      .update(`${baseSerial}-${actualIcNumber}`)
      .digest("hex")
      .substring(0, 6)
      .toUpperCase();

    // Verification passes only if the recalculated signature matches perfectly
    return signatureToVerify === expectedSignature;
  } catch {
    return false;
  }
}