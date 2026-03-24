import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

// ---------------------------------------------------------------------------
// GET /api/tables/[id]
// ---------------------------------------------------------------------------

export async function GET(_req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user.restaurantId) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const restaurantId = session.user.restaurantId;

    const table = await prisma.table.findUnique({
      where: { id },
      include: {
        waiter: { select: { id: true, name: true, avatar: true, personality: true } },
        // Active session with ALL orders for this session
        sessions: {
          where:   { endedAt: null },
          take:    1,
          orderBy: { startedAt: "desc" },
          include: {
            orders: {
              orderBy: { createdAt: "asc" },
              include: {
                items: {
                  include: {
                    dish: { select: { name: true, price: true, imageEmoji: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!table || table.restaurantId !== restaurantId) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    // Fetch game results for the active session
    const activeSession = table.sessions[0] ?? null;
    const gameResults = activeSession
      ? await prisma.gameResult.findMany({
          where:   { sessionId: activeSession.id, restaurantId },
          orderBy: { createdAt: "asc" },
          select:  {
            id:          true,
            gameType:    true,
            prize:       true,
            discountPct: true,
            won:         true,
            createdAt:   true,
          },
        })
      : [];

    return NextResponse.json({ ...table, gameResults });
  } catch (error) {
    console.error("[GET /api/tables/[id]]", error);
    return NextResponse.json({ error: "Failed to fetch table." }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PUT /api/tables/[id]
// ---------------------------------------------------------------------------

const UpdateTableSchema = z.object({
  seats:    z.coerce.number().int().positive().optional(),
  status:   z.enum(["empty", "occupied", "ordering", "billing"]).optional(),
  waiterId: z.string().nullable().optional(),
  number:   z.coerce.number().int().positive().optional(),
});

export async function PUT(req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user.restaurantId) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    const restaurantId = session.user.restaurantId;

    const existing = await prisma.table.findUnique({
      where:  { id },
      select: { restaurantId: true },
    });
    if (!existing || existing.restaurantId !== restaurantId) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    const body   = await req.json();
    const parsed = UpdateTableSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid data." },
        { status: 400 }
      );
    }

    // If waiterId is being changed, verify the waiter belongs to this restaurant
    if (parsed.data.waiterId !== undefined && parsed.data.waiterId !== null) {
      const waiter = await prisma.aIWaiter.findUnique({
        where:  { id: parsed.data.waiterId },
        select: { restaurantId: true, isActive: true },
      });
      if (!waiter || waiter.restaurantId !== restaurantId || !waiter.isActive) {
        return NextResponse.json({ error: "Invalid waiter." }, { status: 400 });
      }
    }

    const table = await prisma.table.update({
      where:   { id },
      data:    parsed.data,
      include: { waiter: { select: { id: true, name: true, avatar: true } } },
    });

    return NextResponse.json(table);
  } catch (error: unknown) {
    if ((error as { code?: string }).code === "P2002") {
      return NextResponse.json({ error: "Table number already exists." }, { status: 409 });
    }
    console.error("[PUT /api/tables/[id]]", error);
    return NextResponse.json({ error: "Failed to update table." }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/tables/[id]
// ---------------------------------------------------------------------------

export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user.restaurantId) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const existing = await prisma.table.findUnique({
      where:  { id },
      select: {
        restaurantId: true,
        status:       true,
        _count:       { select: { orders: true, sessions: true } },
      },
    });

    if (!existing || existing.restaurantId !== session.user.restaurantId) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    // Prevent deletion of occupied tables
    if (existing.status !== "empty") {
      return NextResponse.json(
        { error: "Cannot delete an occupied table. Clear the table first." },
        { status: 409 }
      );
    }

    // If no history, hard-delete; otherwise keep for audit (won't reach here if occupied check passes, but future-safe)
    await prisma.table.delete({ where: { id } });
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("[DELETE /api/tables/[id]]", error);
    return NextResponse.json({ error: "Failed to delete table." }, { status: 500 });
  }
}
