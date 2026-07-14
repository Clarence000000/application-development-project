import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const OCR_BRAND_OR_PREFIX_NOISE = new Set([
  "MYKAD",
  "MYKID",
  "MYLA",
  "MYLI",
  "MYKA",
  "CARS",
]);

function normalizeAlphaText(value: string) {
  return value.toUpperCase().replace(/[^A-Z]/g, "");
}

function isOcrBrandOrPrefixNoise(line: string) {
  const normalized = normalizeAlphaText(line);

  return (
    OCR_BRAND_OR_PREFIX_NOISE.has(normalized) ||
    normalized.includes("MYKAD") ||
    normalized.includes("MALAYSIA") ||
    normalized.includes("KADPENGENALAN")
  );
}

function isLikelyNameLine(line: string) {
  const words = line
    .toUpperCase()
    .split(/\s+/)
    .map((word) => word.replace(/[^A-Z@'/-]/g, ""))
    .filter(Boolean);

  if (words.length === 0) {
    return false;
  }

  return words.some((word) => word.length > 4) || words.length > 1;
}

export async function POST(request: Request) {
  const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        error: "OCR service is not configured. Please continue by filling the form manually.",
      },
      { status: 503 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("image");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "MyKad image is required." }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Please upload a valid image file." }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "Image size must not exceed 5MB." }, { status: 400 });
  }

  const imageContent = Buffer.from(await file.arrayBuffer()).toString("base64");
  const visionResponse = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requests: [
          {
            image: {
              content: imageContent,
            },
            features: [
              {
                type: "DOCUMENT_TEXT_DETECTION",
                maxResults: 1,
              },
            ],
            imageContext: {
              languageHints: ["ms", "en"],
            },
          },
        ],
      }),
    }
  );

  if (!visionResponse.ok) {
    return NextResponse.json(
      {
        error: "Unable to scan the MyKad image at the moment. Please try again or enter the details manually.",
      },
      { status: 502 }
    );
  }

  const result = await visionResponse.json();
  const rawText = result.responses?.[0]?.fullTextAnnotation?.text ?? "";

  if (!rawText.trim()) {
    return NextResponse.json(
      { error: "No readable text was detected. Please upload a clearer MyKad image." },
      { status: 422 }
    );
  }

  // ==========================================
  // REAL PARSING LAYER (Watermark-Resistant)
  // ==========================================
  const textUpper = rawText.toUpperCase();
  const rawLines = rawText.split("\n").map((line: string) => line.trim()).filter(Boolean);

  // 1. Extract & Format IC Number
  const icMatch = rawText.match(/\d{6}-\d{2}-\d{4}/) || rawText.match(/\d{12}/);
  let extractedIc = icMatch ? icMatch[0] : "";
  if (extractedIc && !extractedIc.includes("-")) {
    extractedIc = `${extractedIc.slice(0, 6)}-${extractedIc.slice(6, 8)}-${extractedIc.slice(8)}`;
  }

  // Filter out system text, card branding text, and noisy background microprint watermarks
  const cleanLines = rawLines.filter((line: string) => {
    const l = line.toUpperCase();
    return (
      !l.includes("KAD PENGENALAN") && 
      !l.includes("MALAYSIA") && 
      !l.includes("IDENTITY CARD") && 
      !isOcrBrandOrPrefixNoise(l) &&
      !l.match(/\d{6}-\d{2}-\d{4}/) &&
      // Filter out typical broken fragments of the holographic background text
      !l.includes("LAKERAJAAN") && 
      !l.includes("AANMA") && 
      !l.includes("AYSARERA") &&
      !l.includes("AJAANMALA")
    );
  });

  // 2. Extract Full Name & Address cleanly via Anchors
  let extractedName = "";
  let addressLines: string[] = [];
  
  // Find where the address details start by searching for typical Malaysian address starters
  const addressStartIndex = cleanLines.findIndex((line: string) => {
    const l = line.toUpperCase();
    return l.startsWith("NO") || l.startsWith("LOT") || l.match(/^\d+/) || l.includes("JALAN") || l.includes("KAMPUNG");
  });

  if (addressStartIndex !== -1) {
    // Everything before the address starts must be the name!
    const namePool = cleanLines
      .slice(0, addressStartIndex)
      .filter((line: string) => !isOcrBrandOrPrefixNoise(line))
      .filter(isLikelyNameLine);
    extractedName = namePool.join(" ").toUpperCase();

    // Grab lines starting from the address identifier down to the footers
    for (let i = addressStartIndex; i < cleanLines.length; i++) {
      const upperLine = cleanLines[i].toUpperCase();
      
      if (
        upperLine.includes("WARGANEGARA") || 
        upperLine.includes("LELAKI") || 
        upperLine.includes("PEREMPUAN") ||
        upperLine.includes("ISLAM")
      ) {
        break;
      }
      
      // Split line into individual words to inspect and remove integrated watermark noise chunks
      const words = cleanLines[i].split(/\s+/);
      const cleanWords = words.filter((word: string) => {
        const w = word.toUpperCase().replace(/[^A-Z]/g, ""); // isolate alphabets to check
        
        // If a word contains broken, repeated chunks of "KERAJAAN" or "MALAYSIA", reject it
        const isWatermarkNoise = 
          w.includes("KERAJ") || 
          w.includes("RAJAAN") || 
          w.includes("AYSI") || 
          w.includes("MALA") || 
          w.includes("ANMAL") ||
          w.includes("AANNA") ||
          w.includes("AKERA");
          
        return !isWatermarkNoise;
      });

      if (cleanWords.length > 0) {
        addressLines.push(cleanWords.join(" "));
      }
    }
  } else {
    // Fallback if address layout is completely unusual
    extractedName = cleanLines.length > 0 ? cleanLines[0].toUpperCase() : "";
    addressLines = cleanLines.slice(1);
  }

  // Post-processing string cleanups
  extractedName = extractedName.replace(/IDENTIT|CARD|WARGANEGARA|LELAKI|PEREMPUAN/g, "").trim();
  
  const extractedAddress = addressLines.join(", ")
    .replace(/,\s*,/g, ",") // Remove accidental double commas
    .replace(/,?\s*(WARGANEGARA|LELAKI|PEREMPUAN|ISLAM).*$/i, "")
    .trim();

  // 3. Derive Gender (Prioritizes explicit keywords, uses IC fallback)
  let derivedGender = "";
  if (textUpper.includes("LELAKI")) {
    derivedGender = "Male";
  } else if (textUpper.includes("PEREMPUAN")) {
    derivedGender = "Female";
  } else {
    const isEven = extractedIc ? parseInt(extractedIc.slice(-1)) % 2 === 0 : false;
    derivedGender = extractedIc ? (isEven ? "Female" : "Male") : "";
  }

  // 4. Derive Religion and Citizenship
  const derivedReligion = textUpper.includes("ISLAM") ? "Islam" : "Others";
  const derivedCitizenship = textUpper.includes("WARGANEGARA") ? "Citizen" : "Non-citizen";

  return NextResponse.json({
    success: true,
    name: extractedName || "NAME NOT FOUND - PLEASE ENTER MANUALLY",
    icNumber: extractedIc || "IC NOT FOUND",
    addressIC: extractedAddress || "ADDRESS NOT FOUND",
    gender: derivedGender,
    religion: derivedReligion,
    citizenship: derivedCitizenship,
    rawText: rawText 
  }, { status: 200 });
}
