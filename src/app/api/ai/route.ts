import { NextRequest, NextResponse } from "next/server";
import { buildAiPrompt, type AiTask } from "@/lib/aiPrompts";

export const runtime = "nodejs";

type GeminiResponse = {
  candidates?: {
    content?: {
      parts?: { text?: string }[];
    };
  }[];
  error?: {
    message?: string;
  };
};

const allowedTasks: AiTask[] = [
  "staff_summary",
  "missing_documents",
  "draft_remark",
  "chatbot",
];
const rateLimitWindowMs = Number(process.env.AI_RATE_LIMIT_WINDOW_MS || 600000);
const rateLimitMaxRequests = Number(process.env.AI_RATE_LIMIT_MAX || 12);
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  const rateLimit = checkRateLimit(getClientKey(request));

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: `AI usage limit reached. Please try again in ${Math.ceil(
          rateLimit.retryAfterMs / 60000,
        )} minute(s).`,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(rateLimit.retryAfterMs / 1000)),
          "X-RateLimit-Limit": String(rateLimitMaxRequests),
          "X-RateLimit-Remaining": "0",
        },
      },
    );
  }

  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "AI is not configured. Add GEMINI_API_KEY to .env.local and restart the dev server.",
      },
      { status: 503 },
    );
  }

  let body: Record<string, unknown>;

  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const task = readTask(body.task);

  if (!task) {
    return NextResponse.json({ error: "Invalid AI task." }, { status: 400 });
  }

  const prompt = buildAiPrompt({
    task,
    application: readRecord(body.application),
    message: readString(body.message),
    conversation: readConversation(body.conversation),
    currentRemarks: readString(body.currentRemarks),
    targetStatus: readString(body.targetStatus),
    audience: readString(body.audience),
    pageContext: readString(body.pageContext),
  });

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: task === "chatbot" ? 0.4 : 0.2,
            maxOutputTokens: 700,
          },
        }),
      },
    );

    const data = (await response.json().catch(() => ({}))) as GeminiResponse;

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            data.error?.message ||
            "AI request failed. Check your Gemini API key and model name.",
        },
        { status: response.status },
      );
    }

    const text = data.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("")
      .trim();

    if (!text) {
      return NextResponse.json(
        { error: "AI returned an empty response." },
        { status: 502 },
      );
    }

    return NextResponse.json(
      { ok: true, task, text },
      {
        headers: {
          "X-RateLimit-Limit": String(rateLimitMaxRequests),
          "X-RateLimit-Remaining": String(rateLimit.remaining),
        },
      },
    );
  } catch (error) {
    console.error("AI request failed", error);
    return NextResponse.json(
      { error: "AI service could not be reached." },
      { status: 502 },
    );
  }
}

function getClientKey(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "local"
  );
}

function checkRateLimit(key: string) {
  const now = Date.now();
  const current = rateLimitStore.get(key);

  if (!current || current.resetAt <= now) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + rateLimitWindowMs,
    });

    return {
      allowed: true,
      remaining: Math.max(rateLimitMaxRequests - 1, 0),
      retryAfterMs: 0,
    };
  }

  if (current.count >= rateLimitMaxRequests) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: current.resetAt - now,
    };
  }

  current.count += 1;
  rateLimitStore.set(key, current);

  return {
    allowed: true,
    remaining: Math.max(rateLimitMaxRequests - current.count, 0),
    retryAfterMs: 0,
  };
}

function readTask(value: unknown): AiTask | null {
  return typeof value === "string" && allowedTasks.includes(value as AiTask)
    ? (value as AiTask)
    : null;
}

function readRecord(value: unknown) {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : undefined;
}

function readConversation(value: unknown) {
  if (!Array.isArray(value)) {
    return undefined;
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const record = item as Record<string, unknown>;
      const role = record.role === "assistant" ? "assistant" : "user";
      const text = readString(record.text).slice(0, 1000);

      return text ? { role, text } : null;
    })
    .filter((item): item is { role: "assistant" | "user"; text: string } =>
      Boolean(item),
    )
    .slice(-8);
}

function readString(value: unknown) {
  return typeof value === "string" ? value : "";
}
