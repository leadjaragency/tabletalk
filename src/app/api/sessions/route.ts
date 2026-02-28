import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const CreateSessionSchema = z.object({
  restaurantSlug: z.string().min(1),
  tableNumber:    z.number().int().positive(),
});

/**
 * POST /api/sessions
 * Body: { restaurantSlug: string, tableNumber: number }
 *
 * Public endpoint — no auth. Creates a TableSession, marks the table as
 * "occupied", and returns the sessionId + assigned AI waiter info.
 */
export async function POST(req: Request) {
  try {
    const body   = await req.json();
    const parsed = CreateSessionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request." },
        { status: 400 }
      );
    }

    const { restaurantSlug, tableNumber } = parsed.data;

    // ── Validate restaurant ──────────────────────────────────────────────
    const restaurant = await prisma.restaurant.findUnique({
      where: { slug: restaurantSlug, status: "active" },
      select: { id: true },
    });

    if (!restaurant) {
      return NextResponse.json(
        { error: "Restaurant not found or not active." },
        { status: 404 }
      );
    }

    // ── Validate table ───────────────────────────────────────────────────
    const table = await prisma.table.findUnique({
      where: {
        restaurantId_number: {
          restaurantId: restaurant.id,
          number:       tableNumber,
        },
      },
      select: {
        id:     true,
        waiter: {
          select: {
            id:       true,
            name:     true,
            avatar:   true,
            greeting: true,
          },
        },
      },
    });

    if (!table) {
      return NextResponse.json(
        { error: "Table not found." },
        { status: 404 }
      );
    }

    // ── Create session + mark table occupied (transaction) ───────────────
    const [session] = await prisma.$transaction([
      prisma.tableSession.create({
        data: {
          restaurantId: restaurant.id,
          tableId:      table.id,
        },
        select: { id: true },
      }),
      prisma.table.update({
        where: { id: table.id },
        data:  { status: "occupied" },
      }),
    ]);

    return NextResponse.json({
      sessionId: session.id,
      waiter:    table.waiter ?? null,
    });
  } catch (error) {
    console.error("[POST /api/sessions]", error);
    return NextResponse.json({ error: "Failed to create session." }, { status: 500 });
  }
}

/**
 * GET /api/sessions?sessionId=<id>
 * Public endpoint — returns game status for a given session.
 * Used by the customer games page to check if orders exist and if spin was used.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId required." }, { status: 400 });
    }

    const session = await prisma.tableSession.findUnique({
      where:  { id: sessionId },
      select: {
        gamePlayUsed: true,
        discount:     true,
        orders:       { select: { id: true }, take: 1 },
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found." }, { status: 404 });
    }

    return NextResponse.json({
      gamePlayUsed: session.gamePlayUsed,
      discount:     session.discount,
      hasOrders:    session.orders.length > 0,
    });
  } catch (error) {
    console.error("[GET /api/sessions]", error);
    return NextResponse.json({ error: "Failed to fetch session." }, { status: 500 });
  }
}
