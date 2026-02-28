import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

// Status pipeline: received → preparing → ready → served
const STATUS_ORDER = ["received", "preparing", "ready", "served"] as const;
type OrderStatus = (typeof STATUS_ORDER)[number];

const PatchStatusSchema = z.object({
  status: z.enum(STATUS_ORDER),
});

// ---------------------------------------------------------------------------
// PATCH /api/orders/[id]/status
// ---------------------------------------------------------------------------

export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user.restaurantId) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    const restaurantId = session.user.restaurantId;

    const existing = await prisma.order.findUnique({
      where:  { id },
      select: { restaurantId: true, status: true, tableId: true },
    });
    if (!existing || existing.restaurantId !== restaurantId) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    const body   = await req.json();
    const parsed = PatchStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid status." },
        { status: 400 }
      );
    }

    const newStatus  = parsed.data.status;
    const curIdx     = STATUS_ORDER.indexOf(existing.status as OrderStatus);
    const nextIdx    = STATUS_ORDER.indexOf(newStatus);

    // Allow forward movement only (or explicit admin override to any status)
    if (nextIdx < curIdx) {
      return NextResponse.json(
        { error: `Cannot move order back from "${existing.status}" to "${newStatus}".` },
        { status: 400 }
      );
    }

    // When order is served, update the table status to "billing" (ready for payment)
    const updatedOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.order.update({
        where: { id },
        data:  { status: newStatus },
        select: {
          id:          true,
          orderNumber: true,
          status:      true,
          tableId:     true,
          total:       true,
          updatedAt:   true,
        },
      });

      if (newStatus === "served") {
        // Check if there are other active orders on this table
        const otherActive = await tx.order.count({
          where: {
            tableId: existing.tableId,
            id:      { not: id },
            status:  { in: ["received", "preparing", "ready"] },
          },
        });
        if (otherActive === 0) {
          // All orders served — move table to billing
          await tx.table.update({
            where: { id: existing.tableId },
            data:  { status: "billing" },
          });
        }
      }

      return order;
    });

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error("[PATCH /api/orders/[id]/status]", error);
    return NextResponse.json({ error: "Failed to update status." }, { status: 500 });
  }
}
