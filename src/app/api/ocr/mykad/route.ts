import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

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
      {
        error: "No readable text was detected. Please upload a clearer MyKad image.",
      },
      { status: 422 }
    );
  }

  return NextResponse.json({
    rawText,
    detected: true,
  });
}
