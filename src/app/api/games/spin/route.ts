import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// ── Wheel segments (must match client-side WHEEL_SEGMENTS order) ──────────────
const SEGMENTS = [
  { label: "5% OFF",           discountPct: 0.05, won: true  },
  { label: "10% OFF",          discountPct: 0.10, won: true  },
  { label: "15% OFF",          discountPct: 0.15, won: true  },
  { label: "Free Dessert",     discountPct: 0,    won: true  },
  { label: "Free Drink",       discountPct: 0,    won: true  },
  { label: "Better Luck Next Time", discountPct: 0, won: false },
] as const;

// Weighted probabilities (must sum to 1)
const WEIGHTS = [0.20, 0.15, 0.10, 0.15, 0.15, 0.25];

function weightedRandom(): number {
  const r = Math.random();
  let cumulative = 0;
  for (let i = 0; i < WEIGHTS.length; i++) {
    cumulative += WEIGHTS[i];
    if (r < cumulative) return i;
  }
  return WEIGHTS.length - 1;
}

const Schema = z.object({
  sessionId:      z.string().min(1),
  restaurantSlug: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const body   = await req.json().catch(() => ({}));
    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }
    const { sessionId, restaurantSlug } = parsed.data;

    // Resolve restaurant
    const restaurant = await prisma.restaurant.findUnique({
      where:  { slug: restaurantSlug, status: "active" },
      select: { id: true },
    });
    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found." }, { status: 404 });
    }

    // Load session
    const session = await prisma.tableSession.findUnique({
      where:  { id: sessionId },
      select: {
        id:           true,
        restaurantId: true,
        gamePlayUsed: true,
        orders:       { select: { id: true }, take: 1 },
      },
    });
    if (!session || session.restaurantId !== restaurant.id) {
      return NextResponse.json({ error: "Session not found." }, { status: 404 });
    }
    if (session.orders.length === 0) {
      return NextResponse.json({ error: "Place an order first to unlock the spin wheel." }, { status: 403 });
    }
    if (session.gamePlayUsed) {
      return NextResponse.json({ error: "You have already used your spin for this session." }, { status: 403 });
    }

    // Pick result
    const segmentIndex = weightedRandom();
    const segment      = SEGMENTS[segmentIndex];

    // Persist game result
    await prisma.$transaction([
      prisma.gameResult.create({
        data: {
          restaurantId: restaurant.id,
          sessionId,
          gameType:    "spin",
          prize:       segment.label,
          discountPct: segment.discountPct,
          won:         segment.won,
        },
      }),
      prisma.tableSession.update({
        where: { id: sessionId },
        data:  {
          gamePlayUsed: true,
          // Only set discount if this spin won a percentage off
          ...(segment.discountPct > 0 ? { discount: segment.discountPct } : {}),
        },
      }),
    ]);

    return NextResponse.json({
      segmentIndex,
      prize:       segment.label,
      discountPct: segment.discountPct,
      won:         segment.won,
    });
  } catch (err) {
    console.error("[POST /api/games/spin]", err);
    return NextResponse.json({ error: "Spin failed." }, { status: 500 });
  }
}
