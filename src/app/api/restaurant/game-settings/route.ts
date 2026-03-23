import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions, getRestaurantIdFromSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// Default game settings — used when branding.gameSettings is not yet configured
export const DEFAULT_GAME_SETTINGS = {
  spinTier1:    5,   // % for lowest spin prize
  spinTier2:    10,  // % for mid spin prize
  spinTier3:    15,  // % for top spin prize
  triviaWin:    5,   // % for winning trivia
  scrambleWin:  5,   // % for winning word scramble
};

export type GameSettings = typeof DEFAULT_GAME_SETTINGS;

// ---------------------------------------------------------------------------
// GET /api/restaurant/game-settings
// ---------------------------------------------------------------------------

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const restaurantId = getRestaurantIdFromSession(session);

    const restaurant = await prisma.restaurant.findUnique({
      where:  { id: restaurantId },
      select: { branding: true },
    });
    if (!restaurant) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const branding     = (restaurant.branding ?? {}) as Record<string, unknown>;
    const gameSettings = (branding.gameSettings ?? DEFAULT_GAME_SETTINGS) as GameSettings;

    return NextResponse.json({ gameSettings: { ...DEFAULT_GAME_SETTINGS, ...gameSettings } });
  } catch (err) {
    console.error("[GET /api/restaurant/game-settings]", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PUT /api/restaurant/game-settings
// ---------------------------------------------------------------------------

const Schema = z.object({
  spinTier1:   z.number().int().min(1).max(50),
  spinTier2:   z.number().int().min(1).max(50),
  spinTier3:   z.number().int().min(1).max(50),
  triviaWin:   z.number().int().min(1).max(50),
  scrambleWin: z.number().int().min(1).max(50),
});

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const restaurantId = getRestaurantIdFromSession(session);

    const body   = await req.json().catch(() => ({}));
    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    // Merge into existing branding JSON
    const restaurant = await prisma.restaurant.findUnique({
      where:  { id: restaurantId },
      select: { branding: true },
    });
    const existingBranding = (restaurant?.branding ?? {}) as Record<string, unknown>;

    await prisma.restaurant.update({
      where: { id: restaurantId },
      data:  {
        branding: {
          ...existingBranding,
          gameSettings: parsed.data,
        },
      },
    });

    return NextResponse.json({ gameSettings: parsed.data });
  } catch (err) {
    console.error("[PUT /api/restaurant/game-settings]", err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
