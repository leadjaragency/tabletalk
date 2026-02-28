import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

const orderInclude = {
  table: { select: { id: true, number: true, seats: true } },
  items: {
    include: {
      dish: {
        select: {
          id:         true,
          name:       true,
          allergens:  true,
          imageEmoji: true,
          isVeg:      true,
          isVegan:    true,
        },
      },
    },
    orderBy: { createdAt: "asc" as const },
  },
} as const;

// ---------------------------------------------------------------------------
// GET /api/orders/[id]
// ---------------------------------------------------------------------------

export async function GET(_req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user.restaurantId) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const order = await prisma.order.findUnique({
      where:   { id },
      include: orderInclude,
    });

    if (!order || order.restaurantId !== session.user.restaurantId) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("[GET /api/orders/[id]]", error);
    return NextResponse.json({ error: "Failed to fetch order." }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PUT /api/orders/[id] — full update (admin only)
// ---------------------------------------------------------------------------

const UpdateOrderSchema = z.object({
  status:       z.enum(["received", "preparing", "ready", "served"]).optional(),
  specialNotes: z.string().max(500).nullable().optional(),
  discount:     z.coerce.number().min(0).optional(),
  posSynced:    z.boolean().optional(),
  posOrderId:   z.string().nullable().optional(),
});

export async function PUT(req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user.restaurantId) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    const restaurantId = session.user.restaurantId;

    const existing = await prisma.order.findUnique({
      where:  { id },
      select: { restaurantId: true, subtotal: true, tax: true },
    });
    if (!existing || existing.restaurantId !== restaurantId) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    const body   = await req.json();
    const parsed = UpdateOrderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid data." },
        { status: 400 }
      );
    }

    // Recalculate total if discount changes
    const dataToUpdate: Record<string, unknown> = { ...parsed.data };
    if (parsed.data.discount !== undefined) {
      dataToUpdate.total = +(existing.subtotal + existing.tax - parsed.data.discount).toFixed(2);
    }

    const order = await prisma.order.update({
      where:   { id },
      data:    dataToUpdate,
      include: orderInclude,
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error("[PUT /api/orders/[id]]", error);
    return NextResponse.json({ error: "Failed to update order." }, { status: 500 });
  }
}
