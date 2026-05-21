import { getRequiredSession, getPrismaForSession, getRestaurantFromSlug } from "@/lib/auth";
import { getPrismaClient } from "@/lib/db";
import { NextResponse } from "next/server";
import type { Country } from "@/types";
import { z } from "zod";


export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Resolve restaurant context — admin session OR public slug param
// Returns { restaurantId, db } or null
// ---------------------------------------------------------------------------

async function resolveRestaurantContext(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("restaurantSlug");

  if (slug) {
    try {
      const restaurant = await getRestaurantFromSlug(slug);
      return { restaurantId: restaurant.id, db: getPrismaClient(restaurant.country as Country) };
    } catch {
      return null;
    }
  }

  const session = await getRequiredSession();
  if (!session?.user.restaurantId) return null;
  return { restaurantId: session.user.restaurantId, db: getPrismaForSession(session) };
}

// ---------------------------------------------------------------------------
// GET /api/categories
// ---------------------------------------------------------------------------

export async function GET(req: Request) {
  try {
    const ctx = await resolveRestaurantContext(req);
    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    const { restaurantId, db } = ctx;

    const categories = await db.category.findMany({
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
    const db = getPrismaForSession(session);

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
    const maxOrder = await db.category.aggregate({
      where: { restaurantId },
      _max:  { sortOrder: true },
    });
    const nextOrder = sortOrder || (maxOrder._max.sortOrder ?? -1) + 1;

    const category = await db.category.create({
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
