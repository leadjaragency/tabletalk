import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateSlug } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const createSchema = z.object({
  name:          z.string().min(2).max(100),
  cuisine:       z.string().min(2).max(100),
  tierId:        z.string().cuid(),
  ownerName:     z.string().min(2).max(100),
  ownerEmail:    z.string().email(),
  ownerPassword: z.string().min(8).max(72),
  phone:         z.string().optional(),
  address:       z.string().optional(),
});

// ---------------------------------------------------------------------------
// GET /api/super-admin/restaurants
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "super_admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = req.nextUrl;
    const status = searchParams.get("status") || undefined;
    const q      = searchParams.get("q")      || undefined;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const restaurants = await prisma.restaurant.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { slug: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: {
        tier: { select: { id: true, name: true, monthlyPrice: true } },
        _count: {
          select: {
            tables: true,
            orders: { where: { createdAt: { gte: todayStart } } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(restaurants);
  } catch (error) {
    console.error("[restaurants GET]", error);
    return NextResponse.json({ error: "Failed to fetch restaurants" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST /api/super-admin/restaurants  — manual restaurant creation
// ---------------------------------------------------------------------------

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "super_admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body   = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { name, cuisine, tierId, ownerName, ownerEmail, ownerPassword, phone, address } =
      parsed.data;

    // Email uniqueness check
    const existingUser = await prisma.user.findUnique({ where: { email: ownerEmail } });
    if (existingUser) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }

    // Unique slug generation
    const baseSlug = generateSlug(name);
    let slug = baseSlug;
    let attempt = 0;
    while (await prisma.restaurant.findUnique({ where: { slug } })) {
      attempt++;
      slug = `${baseSlug}-${attempt}`;
    }

    // Verify tier
    const tier = await prisma.subscriptionTier.findUnique({ where: { id: tierId } });
    if (!tier) {
      return NextResponse.json({ error: "Tier not found" }, { status: 404 });
    }

    const passwordHash = await bcrypt.hash(ownerPassword, 12);

    const { restaurant } = await prisma.$transaction(async (tx) => {
      const restaurant = await tx.restaurant.create({
        data: {
          name, slug, cuisine,
          phone:   phone   ?? null,
          address: address ?? null,
          status:  "active",
          tierId,
        },
      });

      await tx.user.create({
        data: {
          name:         ownerName,
          email:        ownerEmail,
          passwordHash,
          role:         "restaurant_owner",
          restaurantId: restaurant.id,
          isActive:     true,
        },
      });

      return { restaurant };
    });

    return NextResponse.json(
      { id: restaurant.id, slug: restaurant.slug },
      { status: 201 }
    );
  } catch (error) {
    console.error("[restaurants POST]", error);
    return NextResponse.json({ error: "Failed to create restaurant" }, { status: 500 });
  }
}
