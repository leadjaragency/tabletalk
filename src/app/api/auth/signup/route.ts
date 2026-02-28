import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { generateSlug } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const signupSchema = z.object({
  restaurantName: z.string().min(2).max(100),
  cuisine: z.string().min(2).max(100),
  phone: z.string().optional(),
  address: z.string().optional(),
  ownerName: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(72),
});

// ---------------------------------------------------------------------------
// POST /api/auth/signup
// Creates a pending Restaurant + restaurant_owner User.
// ---------------------------------------------------------------------------

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { restaurantName, cuisine, phone, address, ownerName, email, password } =
      parsed.data;

    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    // Generate a unique slug
    const baseSlug = generateSlug(restaurantName);
    let slug = baseSlug;
    let attempt = 0;

    while (await prisma.restaurant.findUnique({ where: { slug } })) {
      attempt++;
      slug = `${baseSlug}-${attempt}`;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create restaurant + owner in a transaction
    const { restaurant, user } = await prisma.$transaction(async (tx) => {
      const restaurant = await tx.restaurant.create({
        data: {
          name: restaurantName,
          slug,
          cuisine,
          phone: phone ?? null,
          address: address ?? null,
          status: "pending",
        },
      });

      const user = await tx.user.create({
        data: {
          name: ownerName,
          email,
          passwordHash,
          role: "restaurant_owner",
          restaurantId: restaurant.id,
          isActive: false, // activated on approval
        },
      });

      return { restaurant, user };
    });

    return NextResponse.json(
      {
        message: "Application submitted. You will be notified once approved.",
        restaurantId: restaurant.id,
        userId: user.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[signup]", error);
    return NextResponse.json(
      { error: "Failed to create account. Please try again." },
      { status: 500 }
    );
  }
}
