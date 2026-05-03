import { getRequiredSession } from "@/lib/auth";
import { NextResponse } from "next/server";
import { z } from "zod";


import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/** GET /api/reviews — admin scoped (restaurant staff only) */
export async function GET(req: Request) {
  try {
    const session = await getRequiredSession();
    if (!session?.user.restaurantId) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    const restaurantId = session.user.restaurantId;

    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get("limit") ?? "50"), 200);

    const reviews = await prisma.review.findMany({
      where:   { restaurantId },
      orderBy: { createdAt: "desc" },
      take:    limit,
      select: {
        id:        true,
        rating:    true,
        comment:   true,
        createdAt: true,
        session: {
          select: {
            table: { select: { number: true } },
          },
        },
      },
    });

    return NextResponse.json({ reviews: JSON.parse(JSON.stringify(reviews)) });
  } catch (err) {
    console.error("[GET /api/reviews]", err);
    return NextResponse.json({ error: "Failed to fetch reviews." }, { status: 500 });
  }
}

/** POST /api/reviews — customer facing (no auth, identified by sessionId) */
export async function POST(req: Request) {
  try {
    const body   = await req.json().catch(() => ({}));
    const Schema = z.object({
      sessionId:      z.string().min(1),
      restaurantSlug: z.string().min(1),
      rating:         z.number().int().min(1).max(5),
      comment:        z.string().max(1000).optional(),
    });

    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }
    const { sessionId, restaurantSlug, rating, comment } = parsed.data;

    const restaurant = await prisma.restaurant.findUnique({
      where:  { slug: restaurantSlug, status: "active" },
      select: { id: true },
    });
    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found." }, { status: 404 });
    }

    const session = await prisma.tableSession.findUnique({
      where:  { id: sessionId },
      select: { id: true, restaurantId: true },
    });
    if (!session || session.restaurantId !== restaurant.id) {
      return NextResponse.json({ error: "Session not found." }, { status: 404 });
    }

    // Upsert review (one per session)
    const review = await prisma.review.upsert({
      where:  { sessionId },
      create: { sessionId, restaurantId: restaurant.id, rating, comment },
      update: { rating, comment },
    });

    return NextResponse.json({ review });
  } catch (err) {
    console.error("[POST /api/reviews]", err);
    return NextResponse.json({ error: "Failed to submit review." }, { status: 500 });
  }
}
