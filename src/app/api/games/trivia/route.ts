import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { TRIVIA_QUESTIONS } from "@/lib/constants";
import { DEFAULT_GAME_SETTINGS, type GameSettings } from "@/app/api/restaurant/game-settings/route";

export const dynamic = "force-dynamic";

const Schema = z.object({
  sessionId:      z.string().min(1),
  restaurantSlug: z.string().min(1),
  score:          z.coerce.number().int().min(0).optional(), // submit final score
});

/**
 * GET /api/games/trivia?count=5
 * Returns `count` shuffled trivia questions (no session check — questions are public)
 */
export async function GET(req: Request) {
  try {
    const count = Math.min(
      Number(new URL(req.url).searchParams.get("count") ?? "5"),
      TRIVIA_QUESTIONS.length,
    );

    // Shuffle and pick
    const shuffled = [...TRIVIA_QUESTIONS].sort(() => Math.random() - 0.5).slice(0, count);

    return NextResponse.json({ questions: shuffled });
  } catch (err) {
    console.error("[GET /api/games/trivia]", err);
    return NextResponse.json({ error: "Failed to fetch questions." }, { status: 500 });
  }
}

/**
 * POST /api/games/trivia
 * Body: { sessionId, restaurantSlug, score }
 * Called when a trivia round ends with 4+ correct to apply 5% discount.
 */
export async function POST(req: Request) {
  try {
    const body   = await req.json().catch(() => ({}));
    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }
    const { sessionId, restaurantSlug, score = 0 } = parsed.data;

    const restaurant = await prisma.restaurant.findUnique({
      where:  { slug: restaurantSlug, status: "active" },
      select: { id: true, branding: true },
    });
    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found." }, { status: 404 });
    }

    const branding    = (restaurant.branding ?? {}) as Record<string, unknown>;
    const gs          = ({ ...DEFAULT_GAME_SETTINGS, ...(branding.gameSettings ?? {}) }) as GameSettings;
    const winPct      = gs.triviaWin / 100;

    const session = await prisma.tableSession.findUnique({
      where:  { id: sessionId },
      select: { id: true, restaurantId: true, discount: true },
    });
    if (!session || session.restaurantId !== restaurant.id) {
      return NextResponse.json({ error: "Session not found." }, { status: 404 });
    }

    const won         = score >= 4;
    const discountPct = won ? winPct : 0;

    await prisma.gameResult.create({
      data: {
        restaurantId: restaurant.id,
        sessionId,
        gameType:    "trivia",
        prize:       won ? `${gs.triviaWin}% OFF` : null,
        discountPct: discountPct,
        won,
      },
    });

    // Apply discount if won and no better discount already set
    if (won && (!session.discount || session.discount < discountPct)) {
      await prisma.tableSession.update({
        where: { id: sessionId },
        data:  { discount: discountPct },
      });
    }

    return NextResponse.json({ won, discountPct, score });
  } catch (err) {
    console.error("[POST /api/games/trivia]", err);
    return NextResponse.json({ error: "Failed to save result." }, { status: 500 });
  }
}
