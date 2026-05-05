export const dynamic = "force-dynamic";

import { getRequiredSession } from "@/lib/auth";
import { NextResponse } from "next/server";


import Anthropic from "@anthropic-ai/sdk";
import { ALLERGENS } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Extracted dish shape returned to the client
// ---------------------------------------------------------------------------

export interface ExtractedDish {
  name: string;
  description: string;
  price: number;
  category: string;        // raw string from menu — UI maps to existing category
  allergens: string[];     // subset of ALLERGENS constant
  spiceLevel: number;      // 0-5
  isVeg: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  prepTime: number;        // minutes
}

// ---------------------------------------------------------------------------
// POST /api/menu/parse
// Two modes:
//   application/json  → { text: string }  — paste path (no file parsing)
//   multipart/form-data → file field (.pdf, .docx, .txt) — file upload path
// Returns { dishes: ExtractedDish[] }
// ---------------------------------------------------------------------------

export async function POST(req: Request) {
  try {
    // ── Auth ────────────────────────────────────────────────────────────────
    const session = await getRequiredSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { restaurantId } = session.user;
    if (!restaurantId) return NextResponse.json({ error: "No restaurant" }, { status: 403 });

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const allergenList = ALLERGENS.join(", ");
    type MessageContent = Anthropic.Messages.MessageParam["content"];
    let content: MessageContent;

    const contentType = req.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      // ── Text paste path — simplest, most reliable ────────────────────────
      const body = await req.json() as { text?: string };
      if (!body.text?.trim()) {
        return NextResponse.json({ error: "No text provided" }, { status: 400 });
      }
      content = `${buildPrompt(allergenList)}\n\nMENU TEXT:\n${body.text}`;

    } else {
      // ── File upload path ─────────────────────────────────────────────────
      const form = await req.formData();
      const file = form.get("file") as File | null;
      if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

      if (file.size > 4 * 1024 * 1024) {
        return NextResponse.json({ error: "File is too large (max 4 MB)." }, { status: 400 });
      }

      const ext = file.name.split(".").pop()?.toLowerCase();
      if (!["pdf", "docx", "txt"].includes(ext ?? "")) {
        return NextResponse.json(
          { error: "Unsupported file type. Please upload a PDF, DOCX, or TXT file." },
          { status: 400 }
        );
      }

      if (ext === "pdf") {
        const arrayBuf = await file.arrayBuffer();
        const base64 = Buffer.from(arrayBuf).toString("base64");
        content = [
          {
            type: "document",
            source: { type: "base64", media_type: "application/pdf", data: base64 },
          } as Anthropic.Messages.DocumentBlockParam,
          { type: "text", text: buildPrompt(allergenList) },
        ];
      } else if (ext === "docx") {
        const mammoth = (await import("mammoth")).default;
        const arrayBuf = await file.arrayBuffer();
        const { value: text } = await mammoth.extractRawText({ buffer: Buffer.from(arrayBuf) });
        content = `${buildPrompt(allergenList)}\n\nMENU DOCUMENT:\n${text}`;
      } else {
        const text = await file.text();
        content = `${buildPrompt(allergenList)}\n\nMENU DOCUMENT:\n${text}`;
      }
    }

    // ── Call Claude ──────────────────────────────────────────────────────────
    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [{ role: "user", content }],
    });

    // Extract text response
    const rawText = message.content
      .filter((b) => b.type === "text")
      .map((b) => (b as Anthropic.Messages.TextBlock).text)
      .join("");

    // ── Parse JSON from response ─────────────────────────────────────────────
    // Uses a balanced-bracket scanner so trailing text after the array never
    // corrupts the extracted JSON (greedy regexes fail for this case).
    const dishes = extractJsonArray(rawText);

    if (!dishes) {
      return NextResponse.json(
        { error: "Could not extract dish data from this document. Please try a clearer menu format." },
        { status: 422 }
      );
    }

    // Sanitize: clamp numbers, filter allergens to known list
    const sanitized = dishes.map((d: ExtractedDish) => ({
      name:        String(d.name ?? "").slice(0, 100),
      description: String(d.description ?? "").slice(0, 500),
      price:       Math.max(0, Number(d.price) || 0),
      category:    String(d.category ?? "General"),
      allergens:   (Array.isArray(d.allergens) ? d.allergens : []).filter(
        (a: string) => (ALLERGENS as readonly string[]).includes(a)
      ),
      spiceLevel:  Math.min(5, Math.max(0, Math.round(Number(d.spiceLevel) || 0))),
      isVeg:       Boolean(d.isVeg),
      isVegan:     Boolean(d.isVegan),
      isGlutenFree: Boolean(d.isGlutenFree),
      prepTime:    Math.max(1, Math.round(Number(d.prepTime) || 15)),
    }));

    return NextResponse.json({ dishes: sanitized });
  } catch (error) {
    console.error("[menu/parse]", error);
    return NextResponse.json({ error: "Failed to parse menu" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// extractJsonArray — robust JSON array extraction from Claude's raw output.
// Handles: bare arrays, ```json fenced blocks, trailing text after the array.
// ---------------------------------------------------------------------------

function extractJsonArray(text: string): ExtractedDish[] | null {
  // 1. Try ```json ... ``` code fence first
  const fenceMatch = text.match(/```(?:json)?\s*(\[[\s\S]*?])\s*```/);
  if (fenceMatch?.[1]) {
    try {
      const result = JSON.parse(fenceMatch[1]);
      if (Array.isArray(result)) return result as ExtractedDish[];
    } catch { /* fall through */ }
  }

  // 2. Balanced-bracket scan — finds every top-level [...] in the response
  //    and returns the first one that parses as a non-empty array.
  let depth = 0;
  let start = -1;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "[") {
      if (depth === 0) start = i;
      depth++;
    } else if (text[i] === "]") {
      depth--;
      if (depth === 0 && start !== -1) {
        const candidate = text.slice(start, i + 1);
        try {
          const result = JSON.parse(candidate);
          if (Array.isArray(result) && result.length > 0) {
            return result as ExtractedDish[];
          }
        } catch { /* keep scanning */ }
        start = -1;
      }
    }
  }
  return null;
}

function buildPrompt(allergenList: string): string {
  return `Extract all dishes from this menu document. Return ONLY a valid JSON array with no explanation or markdown — just the raw JSON array.

Each object in the array must have these exact keys:
- "name": string (dish name)
- "description": string (1-2 sentence description; infer if not provided)
- "price": number (numeric value only, no currency symbol)
- "category": string (the menu section/category this dish belongs to, e.g. "Starters", "Mains", "Desserts")
- "allergens": array of strings — only include values from this list: ${allergenList}
- "spiceLevel": integer 0-5 (0=not spicy, 1=mild, 2=medium, 3=hot, 4=very hot, 5=extra hot; estimate if not stated)
- "isVeg": boolean (true if vegetarian)
- "isVegan": boolean (true if vegan)
- "isGlutenFree": boolean (true if gluten-free)
- "prepTime": integer (estimated prep time in minutes; use 15 if not stated)

Return only the JSON array. No other text.`;
}
