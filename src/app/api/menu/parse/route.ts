import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
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
// Accepts multipart/form-data with a "file" field (.pdf, .docx, .txt)
// Returns { dishes: ExtractedDish[] }
// ---------------------------------------------------------------------------

export async function POST(req: Request) {
  try {
    // ── Auth ────────────────────────────────────────────────────────────────
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { restaurantId } = session.user;
    if (!restaurantId) return NextResponse.json({ error: "No restaurant" }, { status: 403 });

    // ── Parse multipart form ─────────────────────────────────────────────────
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "docx", "txt"].includes(ext ?? "")) {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload a PDF, DOCX, or TXT file." },
        { status: 400 }
      );
    }

    // ── Build Claude message content ─────────────────────────────────────────
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const allergenList = ALLERGENS.join(", ");

    type MessageContent = Anthropic.Messages.MessageParam["content"];
    let content: MessageContent;

    if (ext === "pdf") {
      // Claude natively supports PDF documents
      const arrayBuf = await file.arrayBuffer();
      const base64 = Buffer.from(arrayBuf).toString("base64");
      content = [
        {
          type: "document",
          source: { type: "base64", media_type: "application/pdf", data: base64 },
        } as Anthropic.Messages.DocumentBlockParam,
        {
          type: "text",
          text: buildPrompt(allergenList),
        },
      ];
    } else if (ext === "docx") {
      // Use mammoth to extract plain text from DOCX
      const mammoth = (await import("mammoth")).default;
      const arrayBuf = await file.arrayBuffer();
      const { value: text } = await mammoth.extractRawText({
        buffer: Buffer.from(arrayBuf),
      });
      content = `${buildPrompt(allergenList)}\n\nMENU DOCUMENT:\n${text}`;
    } else {
      // Plain text
      const text = await file.text();
      content = `${buildPrompt(allergenList)}\n\nMENU DOCUMENT:\n${text}`;
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
    const jsonMatch = rawText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "Could not extract dish data from this document. Please try a clearer menu format." },
        { status: 422 }
      );
    }

    const dishes: ExtractedDish[] = JSON.parse(jsonMatch[0]);

    // Sanitize: clamp numbers, filter allergens to known list
    const sanitized = dishes.map((d) => ({
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
