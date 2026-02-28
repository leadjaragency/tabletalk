import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// POST /api/promotions/validate
// Public endpoint — customers apply promo codes at the cart.
// The "code" is matched case-insensitively against promotion.title.
// ---------------------------------------------------------------------------

const ValidateSchema = z.object({
  restaurantSlug: z.string().min(1),
  code:           z.string().min(1).max(100),
  subtotal:       z.coerce.number().min(0),
});

export async function POST(req: Request) {
  try {
    const body   = await req.json();
    const parsed = ValidateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { valid: false, message: parsed.error.issues[0]?.message ?? "Invalid request." },
        { status: 400 }
      );
    }

    const { restaurantSlug, code, subtotal } = parsed.data;

    // Resolve restaurant
    const restaurant = await prisma.restaurant.findUnique({
      where:  { slug: restaurantSlug, status: "active" },
      select: { id: true },
    });
    if (!restaurant) {
      return NextResponse.json({ valid: false, message: "Restaurant not found." }, { status: 404 });
    }

    // Find matching active promotion (title as code, case-insensitive)
    const now = new Date();
    const promotions = await prisma.promotion.findMany({
      where: {
        restaurantId: restaurant.id,
        isActive:     true,
        validFrom:    { lte: now },
        validUntil:   { gte: now },
      },
      select: {
        id:          true,
        title:       true,
        description: true,
        type:        true,
        value:       true,
        minOrder:    true,
        freeItemId:  true,
      },
    });

    const promo = promotions.find(
      (p) => p.title.toLowerCase() === code.trim().toLowerCase()
    );

    if (!promo) {
      return NextResponse.json({
        valid:   false,
        message: "Promo code not found or has expired.",
      });
    }

    // Check minimum order
    if (promo.minOrder !== null && subtotal < promo.minOrder) {
      return NextResponse.json({
        valid:   false,
        message: `Minimum order of ${promo.minOrder.toFixed(2)} required for this offer.`,
      });
    }

    // Calculate discount amount
    let discount = 0;
    if (promo.type === "percentage") {
      discount = +(subtotal * (promo.value / 100)).toFixed(2);
    } else if (promo.type === "fixed") {
      discount = Math.min(promo.value, subtotal); // never exceed subtotal
    } else if (promo.type === "freeItem") {
      // Free item — discount = 0 here; the item will be added by kitchen
      discount = 0;
    }

    return NextResponse.json({
      valid:       true,
      promoId:     promo.id,
      title:       promo.title,
      description: promo.description,
      type:        promo.type,
      value:       promo.value,
      discount,
    });
  } catch (error) {
    console.error("[POST /api/promotions/validate]", error);
    return NextResponse.json({ valid: false, message: "Failed to validate promo code." }, { status: 500 });
  }
}
