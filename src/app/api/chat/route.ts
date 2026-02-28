import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { streamChat, estimateCost } from "@/lib/anthropic";
import { buildWaiterPrompt, parseAIResponse, type PromptCartItem } from "@/lib/ai-waiter-prompt";

// Node.js runtime required — Anthropic SDK streaming depends on it
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Request schema
// ---------------------------------------------------------------------------

const CartItemSchema = z.object({
  name:        z.string(),
  quantity:    z.number().int().positive(),
  price:       z.number(),
  allergens:   z.array(z.string()),
  specialInst: z.string().optional(),
});

const ChatRequestSchema = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() }))
    .min(1),
  tableNumber:    z.number().int().positive(),
  sessionId:      z.string(),
  restaurantSlug: z.string().min(1),
  currentCart:    z.array(CartItemSchema).default([]),
  /** True on first load — skips saving user message, injects greeting prompt */
  isInit:         z.boolean().default(false),
});

// ---------------------------------------------------------------------------
// SSE helper — encodes one event frame
// ---------------------------------------------------------------------------

function sse(payload: Record<string, unknown>): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(payload)}\n\n`);
}

// ---------------------------------------------------------------------------
// POST /api/chat
// ---------------------------------------------------------------------------

export async function POST(req: Request) {
  // ── Parse + validate ─────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = ChatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 400 }
    );
  }

  const { messages, tableNumber, sessionId, restaurantSlug, currentCart, isInit } = parsed.data;

  // ── Restaurant ────────────────────────────────────────────────────────
  const restaurant = await prisma.restaurant.findUnique({
    where: { slug: restaurantSlug, status: "active" },
    select: {
      id: true, name: true, slug: true, cuisine: true, tagline: true,
      phone: true, address: true, hours: true, taxRate: true, currency: true,
    },
  });
  if (!restaurant) {
    return NextResponse.json({ error: "Restaurant not found." }, { status: 404 });
  }

  // ── Table + assigned waiter ───────────────────────────────────────────
  const table = await prisma.table.findUnique({
    where: { restaurantId_number: { restaurantId: restaurant.id, number: tableNumber } },
    select: {
      id: true, number: true, seats: true,
      waiter: {
        select: {
          id: true, name: true, avatar: true,
          personality: true, tone: true, languages: true, greeting: true,
        },
      },
    },
  });
  if (!table) {
    return NextResponse.json({ error: "Table not found." }, { status: 404 });
  }

  // Fall back to first active waiter if table has none assigned
  let waiter = table.waiter;
  if (!waiter) {
    waiter = await prisma.aIWaiter.findFirst({
      where:  { restaurantId: restaurant.id, isActive: true },
      select: {
        id: true, name: true, avatar: true,
        personality: true, tone: true, languages: true, greeting: true,
      },
    });
  }
  if (!waiter) {
    return NextResponse.json({ error: "No AI waiter available." }, { status: 404 });
  }

  // ── Table session ─────────────────────────────────────────────────────
  const tableSession = await prisma.tableSession.findUnique({
    where:  { id: sessionId },
    select: { id: true, dietaryPrefs: true, gamePlayUsed: true, discount: true },
  });
  if (!tableSession) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }

  // ── Menu ──────────────────────────────────────────────────────────────
  const menu = await prisma.dish.findMany({
    where:   { restaurantId: restaurant.id, isAvailable: true },
    include: { category: { select: { name: true, sortOrder: true } } },
    orderBy: [{ category: { sortOrder: "asc" } }, { name: "asc" }],
  });

  // ── Active promotions ─────────────────────────────────────────────────
  const now = new Date();
  const activePromotions = await prisma.promotion.findMany({
    where: {
      restaurantId: restaurant.id,
      isActive:     true,
      validFrom:    { lte: now },
      validUntil:   { gte: now },
    },
    select: { title: true, description: true, type: true, value: true, validUntil: true },
  });

  // ── Find or create ChatSession ────────────────────────────────────────
  let chatSession = await prisma.chatSession.findFirst({
    where:  { sessionId, waiterId: waiter.id },
    select: { id: true },
  });
  if (!chatSession) {
    chatSession = await prisma.chatSession.create({
      data:   { sessionId, waiterId: waiter.id },
      select: { id: true },
    });
  }

  // ── System prompt ─────────────────────────────────────────────────────
  const cart: PromptCartItem[] = currentCart.map((i) => ({
    name:        i.name,
    quantity:    i.quantity,
    price:       i.price,
    allergens:   i.allergens,
    specialInst: i.specialInst,
  }));

  const systemPrompt = buildWaiterPrompt({
    restaurant,
    waiter,
    table:       { number: table.number, seats: table.seats },
    menu,
    session:     {
      dietaryPrefs: tableSession.dietaryPrefs,
      gamePlayUsed: tableSession.gamePlayUsed,
      discount:     tableSession.discount,
    },
    currentCart:      cart,
    activePromotions,
  });

  // ── Persist user message (skip for greeting init) ────────────────────
  const latestUserMsg = messages[messages.length - 1];
  if (!isInit) {
    await prisma.chatMessage.create({
      data: {
        chatSessionId: chatSession.id,
        role:          "user",
        content:       latestUserMsg.content,
      },
    });
  }

  // ── Build Claude messages — replace init trigger with a real greeting prompt
  const claudeMessages = isInit
    ? [{
        role:    "user" as const,
        content: `Please greet me warmly. I just sat down at table ${table.number} at ${restaurant.name}. Introduce yourself by name, tell me what you can help with, and ask if I have any food allergies or dietary restrictions before you make recommendations.`,
      }]
    : messages;

  // ── Stream from Claude ────────────────────────────────────────────────
  const claudeStream = streamChat(systemPrompt, claudeMessages);

  let fullText     = "";
  let inputTokens  = 0;
  let outputTokens = 0;

  const body2 = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of claudeStream) {
          if (event.type === "message_start") {
            inputTokens = event.message.usage.input_tokens;
          }
          if (event.type === "message_delta") {
            outputTokens = event.usage.output_tokens;
          }
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            fullText += event.delta.text;
            controller.enqueue(sse({ t: "delta", v: event.delta.text }));
          }
        }

        // Parse quick replies out of the full response
        const { cleanText, quickReplies } = parseAIResponse(fullText);

        // Save assistant message
        const assistantMsg = await prisma.chatMessage.create({
          data: {
            chatSessionId: chatSession.id,
            role:          "assistant",
            content:       cleanText,
            metadata:      { quickReplies },
          },
          select: { id: true },
        });

        // Log API usage
        await prisma.aPIUsageLog.create({
          data: {
            restaurantId: restaurant.id,
            endpoint:     "chat",
            tokensUsed:   inputTokens + outputTokens,
            cost:         estimateCost(inputTokens, outputTokens),
          },
        });

        // Send completion event
        controller.enqueue(sse({ t: "done", qr: quickReplies, msgId: assistantMsg.id }));
      } catch (err) {
        console.error("[POST /api/chat] stream error:", err);
        controller.enqueue(sse({ t: "error", error: "AI response failed. Please try again." }));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(body2, {
    headers: {
      "Content-Type":      "text/event-stream",
      "Cache-Control":     "no-cache",
      "Connection":        "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
