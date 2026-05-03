import { getRequiredSession } from "@/lib/auth";
import { NextResponse } from "next/server";

import { z } from "zod";
import { prisma } from "@/lib/db";


export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Resolve restaurantId — admin session OR public slug param
// ---------------------------------------------------------------------------

async function resolveRestaurantId(req: Request): Promise<string | null> {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("restaurantSlug");

  if (slug) {
    const restaurant = await prisma.restaurant.findUnique({
      where: { slug, status: "active" },
      select: { id: true },
    });
    return restaurant?.id ?? null;
  }

  const session = await getRequiredSession();
  return session?.user.restaurantId ?? null;
}

// ---------------------------------------------------------------------------
// GET /api/categories
// ---------------------------------------------------------------------------

export async function GET(req: Request) {
  try {
    const restaurantId = await resolveRestaurantId(req);
    if (!restaurantId) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const categories = await prisma.category.findMany({
      where:   { restaurantId },
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { dishes: { where: { isAvailable: true } } } } },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("[GET /api/categories]", error);
    return NextResponse.json({ error: "Failed to fetch categories." }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST /api/categories — admin only
// ---------------------------------------------------------------------------

const CreateCategorySchema = z.object({
  name:      z.string().min(1).max(60),
  sortOrder: z.number().int().default(0),
});

export async function POST(req: Request) {
  try {
    const session = await getRequiredSession();
    if (!session?.user.restaurantId) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    const restaurantId = session.user.restaurantId;

    const body   = await req.json();
    const parsed = CreateCategorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid data." },
        { status: 400 }
      );
    }

    // Auto-increment sortOrder to put new category at end
    const { name, sortOrder } = parsed.data;
    const maxOrder = await prisma.category.aggregate({
      where: { restaurantId },
      _max:  { sortOrder: true },
    });
    const nextOrder = sortOrder || (maxOrder._max.sortOrder ?? -1) + 1;

    const category = await prisma.category.create({
      data: { restaurantId, name, sortOrder: nextOrder },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error: unknown) {
    if ((error as { code?: string }).code === "P2002") {
      return NextResponse.json(
        { error: "A category with this name already exists." },
        { status: 409 }
      );
    }
    console.error("[POST /api/categories]", error);
    return NextResponse.json({ error: "Failed to create category." }, { status: 500 });
  }
}
