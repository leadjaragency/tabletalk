import { NextResponse } from "next/server";
import { z } from "zod";

import { getRequiredSession, getRestaurantIdFromSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getRequiredSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const restaurantId = getRestaurantIdFromSession(session);

    const restaurant = await prisma.restaurant.findUnique({
      where:  { id: restaurantId },
      select: {
        id: true, name: true, slug: true, cuisine: true, tagline: true,
        phone: true, email: true, address: true, hours: true,
        taxRate: true, currency: true, logoUrl: true,
        tier: { select: { name: true, features: true } },
      },
    });
    if (!restaurant) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ restaurant: JSON.parse(JSON.stringify(restaurant)) });
  } catch (err) {
    console.error("[GET /api/restaurant/profile]", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

const UpdateSchema = z.object({
  name:     z.string().min(1).max(100).optional(),
  cuisine:  z.string().min(1).max(60).optional(),
  tagline:  z.string().max(200).optional(),
  phone:    z.string().max(30).optional(),
  email:    z.string().email().optional(),
  address:  z.string().max(300).optional(),
  taxRate:  z.number().min(0).max(1).optional(),
  hours:    z.object({ open: z.string(), close: z.string() }).optional(),
});

export async function PUT(req: Request) {
  try {
    const session = await getRequiredSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const restaurantId = getRestaurantIdFromSession(session);

    const body   = await req.json().catch(() => ({}));
    const parsed = UpdateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

    const updated = await prisma.restaurant.update({
      where: { id: restaurantId },
      data:  parsed.data,
    });
    return NextResponse.json({ restaurant: JSON.parse(JSON.stringify(updated)) });
  } catch (err) {
    console.error("[PUT /api/restaurant/profile]", err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
