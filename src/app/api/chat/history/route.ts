import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

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

    // Validate the TableSession exists
    const tableSession = await prisma.tableSession.findUnique({
      where:  { id: sessionId },
      select: { id: true },
    });
    if (!tableSession) {
      return NextResponse.json(
        { error: "Session not found." },
        { status: 404 }
      );
    }

    // Find the most recent ChatSession for this TableSession
    // (there may be multiple if the waiter changed, but we use the latest)
    const chatSession = await prisma.chatSession.findFirst({
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
      // No chat has started yet — return empty state
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
        // Safely extract quickReplies from metadata Json
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
