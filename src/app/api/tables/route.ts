import { getRequiredSession } from "@/lib/auth";
import { NextResponse } from "next/server";

import { z } from "zod";
import { prisma } from "@/lib/db";


export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// GET /api/tables — all tables for this restaurant
// ---------------------------------------------------------------------------

export async function GET(_req: Request) {
  try {
    const session = await getRequiredSession();
    if (!session?.user.restaurantId) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    const restaurantId = session.user.restaurantId;

    const tables = await prisma.table.findMany({
      where:   { restaurantId },
      orderBy: { number: "asc" },
      include: {
        waiter:      { select: { id: true, name: true, avatar: true } },
        mergedInto:  { select: { id: true, number: true } },
        mergedTables: { select: { id: true, number: true }, orderBy: { number: "asc" } },
        orders: {
          where:   { status: { in: ["received", "preparing", "ready"] } },
          orderBy: { createdAt: "desc" },
          take:    1,
          include: {
            items: {
              take: 3,
              include: { dish: { select: { name: true } } },
            },
          },
        },
        sessions: {
          where:   { endedAt: null },
          orderBy: { startedAt: "desc" },
          take:    1,
          select: {
            id:          true,
            guestCount:  true,
            startedAt:   true,
            dietaryPrefs: true,
          },
        },
      },
    });

    return NextResponse.json(tables);
  } catch (error) {
    console.error("[GET /api/tables]", error);
    return NextResponse.json({ error: "Failed to fetch tables." }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST /api/tables — create a new table
// ---------------------------------------------------------------------------

const CreateTableSchema = z.object({
  number:   z.coerce.number().int().positive(),
  seats:    z.coerce.number().int().positive().default(4),
  waiterId: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  try {
    const session = await getRequiredSession();
    if (!session?.user.restaurantId) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    const restaurantId = session.user.restaurantId;

    const body   = await req.json();
    const parsed = CreateTableSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid data." },
        { status: 400 }
      );
    }

    const { number, seats, waiterId } = parsed.data;

    // Validate waiterId belongs to this restaurant
    if (waiterId) {
      const waiter = await prisma.aIWaiter.findUnique({
        where:  { id: waiterId },
        select: { restaurantId: true, isActive: true },
      });
      if (!waiter || waiter.restaurantId !== restaurantId || !waiter.isActive) {
        return NextResponse.json({ error: "Invalid waiter." }, { status: 400 });
      }
    }

    const table = await prisma.table.create({
      data: { restaurantId, number, seats, waiterId: waiterId ?? null },
      include: { waiter: { select: { id: true, name: true, avatar: true } } },
    });

    return NextResponse.json(table, { status: 201 });
  } catch (error: unknown) {
    if ((error as { code?: string }).code === "P2002") {
      return NextResponse.json(
        { error: `Table number already exists.` },
        { status: 409 }
      );
    }
    console.error("[POST /api/tables]", error);
    return NextResponse.json({ error: "Failed to create table." }, { status: 500 });
  }
}
