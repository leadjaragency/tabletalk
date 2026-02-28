import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

// ---------------------------------------------------------------------------
// GET /api/waiters/[id]
// ---------------------------------------------------------------------------

export async function GET(_req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user.restaurantId) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const waiter = await prisma.aIWaiter.findUnique({
      where: { id },
      include: {
        tables:      { select: { id: true, number: true, status: true }, orderBy: { number: "asc" } },
        _count:      { select: { chatSessions: true } },
      },
    });

    if (!waiter || waiter.restaurantId !== session.user.restaurantId) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    return NextResponse.json(waiter);
  } catch (error) {
    console.error("[GET /api/waiters/[id]]", error);
    return NextResponse.json({ error: "Failed to fetch waiter." }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PUT /api/waiters/[id]
// ---------------------------------------------------------------------------

const UpdateWaiterSchema = z.object({
  name:        z.string().min(1).max(60).optional(),
  avatar:      z.string().min(1).max(8).optional(),
  personality: z.string().min(1).max(200).optional(),
  tone:        z.enum(["friendly", "formal", "playful"]).optional(),
  languages:   z.array(z.string()).min(1).optional(),
  greeting:    z.string().max(500).nullable().optional(),
  isActive:    z.boolean().optional(),
  tableIds:    z.array(z.string()).optional(),
});

export async function PUT(req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user.restaurantId) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    const restaurantId = session.user.restaurantId;

    const existing = await prisma.aIWaiter.findUnique({
      where:  { id },
      select: { restaurantId: true },
    });
    if (!existing || existing.restaurantId !== restaurantId) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    const body   = await req.json();
    const parsed = UpdateWaiterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid data." },
        { status: 400 }
      );
    }

    const { tableIds, ...waiterData } = parsed.data;

    // Validate table ownership
    if (tableIds !== undefined && tableIds.length > 0) {
      const tables = await prisma.table.findMany({
        where:  { id: { in: tableIds }, restaurantId },
        select: { id: true },
      });
      if (tables.length !== tableIds.length) {
        return NextResponse.json({ error: "One or more invalid tables." }, { status: 400 });
      }
    }

    // Build the update — if tableIds provided, replace the entire table assignment set
    const waiter = await prisma.aIWaiter.update({
      where: { id },
      data:  {
        ...waiterData,
        ...(tableIds !== undefined
          ? { tables: { set: tableIds.map((tid) => ({ id: tid })) } }
          : {}),
      },
      include: {
        tables: { select: { id: true, number: true, status: true }, orderBy: { number: "asc" } },
        _count: { select: { chatSessions: true } },
      },
    });

    return NextResponse.json(waiter);
  } catch (error) {
    console.error("[PUT /api/waiters/[id]]", error);
    return NextResponse.json({ error: "Failed to update waiter." }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/waiters/[id]
// ---------------------------------------------------------------------------

export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user.restaurantId) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const existing = await prisma.aIWaiter.findUnique({
      where:  { id },
      select: {
        restaurantId: true,
        _count:       { select: { chatSessions: true } },
      },
    });

    if (!existing || existing.restaurantId !== session.user.restaurantId) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    // Unlink from all tables first, then delete (or soft-delete if has history)
    await prisma.table.updateMany({
      where: { waiterId: id },
      data:  { waiterId: null },
    });

    if (existing._count.chatSessions > 0) {
      // Soft-delete: deactivate waiter to preserve chat history
      await prisma.aIWaiter.update({
        where: { id },
        data:  { isActive: false },
      });
      return NextResponse.json({ deleted: false, message: "Waiter deactivated (has conversation history)." });
    }

    await prisma.aIWaiter.delete({ where: { id } });
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("[DELETE /api/waiters/[id]]", error);
    return NextResponse.json({ error: "Failed to delete waiter." }, { status: 500 });
  }
}
