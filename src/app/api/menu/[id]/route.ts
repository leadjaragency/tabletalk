import { getRequiredSession } from "@/lib/auth";
import { NextResponse } from "next/server";

import { z } from "zod";
import { prisma } from "@/lib/db";


export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

// ---------------------------------------------------------------------------
// GET /api/menu/[id]
// ---------------------------------------------------------------------------

export async function GET(_req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const session = await getRequiredSession();
    if (!session?.user.restaurantId) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const dish = await prisma.dish.findUnique({
      where:   { id },
      include: { category: { select: { id: true, name: true } } },
    });

    if (!dish || dish.restaurantId !== session.user.restaurantId) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    return NextResponse.json(dish);
  } catch (error) {
    console.error("[GET /api/menu/[id]]", error);
    return NextResponse.json({ error: "Failed to fetch dish." }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PUT /api/menu/[id]
// ---------------------------------------------------------------------------

const UpdateDishSchema = z.object({
  name:         z.string().min(1).max(100).optional(),
  description:  z.string().min(1).max(500).optional(),
  categoryId:   z.string().optional(),
  price:        z.coerce.number().positive().optional(),
  imageEmoji:   z.string().max(8).nullable().optional(),
  spiceLevel:   z.coerce.number().int().min(0).max(5).optional(),
  isVeg:        z.boolean().optional(),
  isVegan:      z.boolean().optional(),
  isGlutenFree: z.boolean().optional(),
  isJain:       z.boolean().optional(),
  allergens:    z.array(z.string()).optional(),
  prepTime:     z.coerce.number().int().positive().optional(),
  isChefPick:   z.boolean().optional(),
  isPopular:    z.boolean().optional(),
  isAvailable:  z.boolean().optional(),
  upsellIds:    z.array(z.string()).optional(),
});

export async function PUT(req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const session = await getRequiredSession();
    if (!session?.user.restaurantId) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    const restaurantId = session.user.restaurantId;

    // Confirm dish belongs to this restaurant
    const existing = await prisma.dish.findUnique({
      where:  { id },
      select: { restaurantId: true },
    });
    if (!existing || existing.restaurantId !== restaurantId) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    const body   = await req.json();
    const parsed = UpdateDishSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid data." },
        { status: 400 }
      );
    }

    // If categoryId is being changed, verify the new category belongs here
    if (parsed.data.categoryId) {
      const cat = await prisma.category.findUnique({
        where:  { id: parsed.data.categoryId },
        select: { restaurantId: true },
      });
      if (!cat || cat.restaurantId !== restaurantId) {
        return NextResponse.json({ error: "Invalid category." }, { status: 400 });
      }
    }

    const dish = await prisma.dish.update({
      where:   { id },
      data:    parsed.data,
      include: { category: { select: { id: true, name: true, sortOrder: true } } },
    });

    return NextResponse.json(dish);
  } catch (error) {
    console.error("[PUT /api/menu/[id]]", error);
    return NextResponse.json({ error: "Failed to update dish." }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/menu/[id]
// ---------------------------------------------------------------------------

export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const session = await getRequiredSession();
    if (!session?.user.restaurantId) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const existing = await prisma.dish.findUnique({
      where:  { id },
      select: { restaurantId: true, _count: { select: { orderItems: true } } },
    });

    if (!existing || existing.restaurantId !== session.user.restaurantId) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    // Soft-delete if the dish has been ordered (preserve history)
    // Hard-delete if no orders reference it
    if (existing._count.orderItems > 0) {
      await prisma.dish.update({
        where: { id },
        data:  { isAvailable: false },
      });
      return NextResponse.json({ deleted: false, message: "Dish hidden (has order history)." });
    }

    await prisma.dish.delete({ where: { id } });
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("[DELETE /api/menu/[id]]", error);
    return NextResponse.json({ error: "Failed to delete dish." }, { status: 500 });
  }
}
