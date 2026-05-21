import { NextResponse } from "next/server";
import { prisma as prismaCA, prismaDE } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/chat/history?sessionId=<tableSessionId>
 *
 * Public endpoint — no auth required (customer-facing).
 * Returns the chat session's full message history for a given TableSession,
 * along with the assigned waiter info so the UI can personalise the display.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId")?.trim() ?? "";

    if (!sessionId) {
      return NextResponse.json(
        { error: "Missing sessionId parameter." },
        { status: 400 }
      );
    }

    // Find the session in whichever schema owns it
    let tableSession = await prismaCA.tableSession.findUnique({
      where:  { id: sessionId },
      select: { id: true },
    });
    const db = tableSession ? prismaCA : prismaDE;

    if (!tableSession) {
      tableSession = await prismaDE.tableSession.findUnique({
        where:  { id: sessionId },
        select: { id: true },
      });
    }

    if (!tableSession) {
      return NextResponse.json(
        { error: "Session not found." },
        { status: 404 }
      );
    }

    // Find the most recent ChatSession for this TableSession
    const chatSession = await db.chatSession.findFirst({
      where:   { sessionId },
      orderBy: { createdAt: "desc" },
      select: {
        id:        true,
        createdAt: true,
        waiter: {
          select: {
            id:       true,
            name:     true,
            avatar:   true,
            greeting: true,
          },
        },
        messages: {
          orderBy: { createdAt: "asc" },
          select: {
            id:        true,
            role:      true,
            content:   true,
            metadata:  true,
            createdAt: true,
          },
        },
      },
    });

    if (!chatSession) {
      return NextResponse.json({
        chatSessionId: null,
        waiter:        null,
        messages:      [],
      });
    }

    return NextResponse.json({
      chatSessionId: chatSession.id,
      waiter:        chatSession.waiter,
      messages:      chatSession.messages.map((m) => ({
        ...m,
        createdAt: m.createdAt.toISOString(),
        quickReplies: extractQuickReplies(m.metadata),
      })),
    });
  } catch (error) {
    console.error("[GET /api/chat/history]", error);
    return NextResponse.json({ error: "Failed to fetch chat history." }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// Helper — safely pull quickReplies out of Prisma's Json metadata field
// ---------------------------------------------------------------------------

function extractQuickReplies(metadata: unknown): string[] {
  if (
    metadata &&
    typeof metadata === "object" &&
    !Array.isArray(metadata) &&
    "quickReplies" in metadata &&
    Array.isArray((metadata as { quickReplies: unknown }).quickReplies)
  ) {
    return (metadata as { quickReplies: string[] }).quickReplies;
  }
  return [];
}
