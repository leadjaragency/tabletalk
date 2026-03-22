import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

// POST /api/tables/[id]/reset
// Resets a stuck occupied/ordering/billing table back to empty.
// - Sets table.status = "empty"
// - Closes any open TableSession (endedAt = now) for this table

export async function POST(_req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user.restaurantId) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    const restaurantId = session.user.restaurantId;

    const table = await prisma.table.findUnique({
      where:  { id },
      select: { restaurantId: true, status: true },
    });

    if (!table || table.restaurantId !== restaurantId) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    if (table.status === "empty") {
      return NextResponse.json({ error: "Table is already empty." }, { status: 400 });
    }

    // Close any open sessions for this table (endedAt is null = still open)
    await prisma.tableSession.updateMany({
      where: { tableId: id, endedAt: null },
      data:  { endedAt: new Date() },
    });

    // Reset table status
    const updated = await prisma.table.update({
      where:   { id },
      data:    { status: "empty" },
      include: { waiter: { select: { id: true, name: true, avatar: true } } },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[POST /api/tables/[id]/reset]", error);
    return NextResponse.json({ error: "Failed to reset table." }, { status: 500 });
  }
}
