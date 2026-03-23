import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Shared resolver — admin session OR public slug param
// ---------------------------------------------------------------------------

async function resolveRestaurantId(req: Request): Promise<string | null> {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("restaurantSlug");

  if (slug) {
    const restaurant = await prisma.restaurant.findFirst({
      where: { slug, status: "active" },
      select: { id: true },
    });
    return restaurant?.id ?? null;
  }

  const session = await getServerSession(authOptions);
  return session?.user.restaurantId ?? null;
}

// ---------------------------------------------------------------------------
// GET /api/menu
// ---------------------------------------------------------------------------

export async function GET(req: Request) {
  try {
    const restaurantId = await resolveRestaurantId(req);
    if (!restaurantId) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const onlyAvailable = searchParams.get("available") === "true";

    const dishes = await prisma.dish.findMany({
      where:   {
        restaurantId,
        ...(onlyAvailable ? { isAvailable: true } : {}),
      },
      include: { category: { select: { id: true, name: true, sortOrder: true } } },
      orderBy: [
        { category: { sortOrder: "asc" } },
        { name: "asc" },
      ],
    });

    return NextResponse.json(dishes);
  } catch (error) {
    console.error("[GET /api/menu]", error);
    return NextResponse.json({ error: "Failed to fetch menu." }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST /api/menu — admin only
// ---------------------------------------------------------------------------

const DishSchema = z.object({
  name:         z.string().min(1, "Name is required").max(100),
  description:  z.string().min(1, "Description is required").max(500),
  categoryId:   z.string().min(1, "Category is required"),
  price:        z.coerce.number().positive("Price must be positive"),
  imageEmoji:   z.string().max(8).nullable().optional(),
  spiceLevel:   z.coerce.number().int().min(0).max(5).default(0),
  isVeg:        z.boolean().default(false),
  isVegan:      z.boolean().default(false),
  isGlutenFree: z.boolean().default(false),
  isJain:       z.boolean().default(false),
  allergens:    z.array(z.string()).default([]),
  prepTime:     z.coerce.number().int().positive().default(15),
  isChefPick:   z.boolean().default(false),
  isPopular:    z.boolean().default(false),
  isAvailable:  z.boolean().default(true),
  upsellIds:    z.array(z.string()).default([]),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user.restaurantId) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    const restaurantId = session.user.restaurantId;

    const body   = await req.json();
    const parsed = DishSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid data." },
        { status: 400 }
      );
    }

    // Verify the category belongs to this restaurant
    const category = await prisma.category.findUnique({
      where:  { id: parsed.data.categoryId },
      select: { restaurantId: true },
    });
    if (!category || category.restaurantId !== restaurantId) {
      return NextResponse.json({ error: "Invalid category." }, { status: 400 });
    }

    const dish = await prisma.dish.create({
      data: { restaurantId, ...parsed.data },
      include: { category: { select: { id: true, name: true, sortOrder: true } } },
    });

    return NextResponse.json(dish, { status: 201 });
  } catch (error) {
    console.error("[POST /api/menu]", error);
    return NextResponse.json({ error: "Failed to create dish." }, { status: 500 });
  }
}
