import { NextResponse } from "next/server";
import { getRestaurantFromSlug } from "@/lib/auth";
import { getPrismaClient } from "@/lib/db";
import type { Country } from "@/types";

export const dynamic = "force-dynamic";

/**
 * GET /api/customer/orders?sessionId=xxx&restaurant=yyy
 * Public (no auth). Returns orders for the given session + restaurant.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId      = searchParams.get("sessionId");
    const restaurantSlug = searchParams.get("restaurant");

    if (!sessionId || !restaurantSlug) {
      return NextResponse.json({ error: "sessionId and restaurant required." }, { status: 400 });
    }

    let restaurant: Awaited<ReturnType<typeof getRestaurantFromSlug>>;
    try {
      restaurant = await getRestaurantFromSlug(restaurantSlug);
    } catch {
      return NextResponse.json({ error: "Restaurant not found." }, { status: 404 });
    }

    const db = getPrismaClient(restaurant.country as Country);

    const session = await db.tableSession.findUnique({
      where:  { id: sessionId },
      select: { id: true, restaurantId: true, discount: true },
    });
    if (!session || session.restaurantId !== restaurant.id) {
      return NextResponse.json({ error: "Session not found." }, { status: 404 });
    }

    const orders = await db.order.findMany({
      where:   { sessionId, restaurantId: restaurant.id },
      orderBy: { createdAt: "asc" },
      select: {
        id:         true,
        orderNumber:true,
        status:     true,
        subtotal:   true,
        tax:        true,
        discount:   true,
        total:      true,
        specialNotes: true,
        createdAt:  true,
        items: {
          select: {
            id:          true,
            quantity:    true,
            unitPrice:   true,
            specialInst: true,
            dish: { select: { id: true, name: true, imageEmoji: true } },
          },
        },
      },
    });

    return NextResponse.json({
      orders,
      session: { discount: session.discount },
      taxRate:  restaurant.taxRate,
    });
  } catch (err) {
    console.error("[GET /api/customer/orders]", err);
    return NextResponse.json({ error: "Failed to fetch orders." }, { status: 500 });
  }
}
