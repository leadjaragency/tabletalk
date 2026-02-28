import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// GET /api/waiters — all waiters for this restaurant
// ---------------------------------------------------------------------------

export async function GET(_req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user.restaurantId) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    const restaurantId = session.user.restaurantId;

    const waiters = await prisma.aIWaiter.findMany({
      where:   { restaurantId },
      orderBy: { createdAt: "asc" },
      include: {
        tables: {
          select: { id: true, number: true, status: true },
          orderBy: { number: "asc" },
        },
        _count: { select: { chatSessions: true } },
      },
    });

    return NextResponse.json(waiters);
  } catch (error) {
    console.error("[GET /api/waiters]", error);
    return NextResponse.json({ error: "Failed to fetch waiters." }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST /api/waiters — create a new waiter
// ---------------------------------------------------------------------------

const CreateWaiterSchema = z.object({
  name:        z.string().min(1).max(60),
  avatar:      z.string().min(1).max(8),
  personality: z.string().min(1).max(200),
  tone:        z.enum(["friendly", "formal", "playful"]).default("friendly"),
  languages:   z.array(z.string()).min(1, "At least one language is required"),
  greeting:    z.string().max(500).nullable().optional(),
  tableIds:    z.array(z.string()).optional(),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user.restaurantId) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    const restaurantId = session.user.restaurantId;

    const body   = await req.json();
    const parsed = CreateWaiterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid data." },
        { status: 400 }
      );
    }

    const { tableIds, ...waiterData } = parsed.data;

    // Validate that any assigned tables belong to this restaurant
    if (tableIds && tableIds.length > 0) {
      const tables = await prisma.table.findMany({
        where:  { id: { in: tableIds }, restaurantId },
        select: { id: true },
      });
      if (tables.length !== tableIds.length) {
        return NextResponse.json({ error: "One or more invalid tables." }, { status: 400 });
      }
    }

    const waiter = await prisma.aIWaiter.create({
      data: {
        ...waiterData,
        restaurantId,
        greeting: waiterData.greeting ?? null,
        ...(tableIds && tableIds.length > 0
          ? { tables: { connect: tableIds.map((id) => ({ id })) } }
          : {}),
      },
      include: {
        tables: { select: { id: true, number: true, status: true }, orderBy: { number: "asc" } },
        _count: { select: { chatSessions: true } },
      },
    });

    return NextResponse.json(waiter, { status: 201 });
  } catch (error) {
    console.error("[POST /api/waiters]", error);
    return NextResponse.json({ error: "Failed to create waiter." }, { status: 500 });
  }
}
