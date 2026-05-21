import { NextResponse } from "next/server";
import { z } from "zod";
import { getRestaurantFromSlug } from "@/lib/auth";
import { getPrismaClient } from "@/lib/db";
import type { Country } from "@/types";
import { DEFAULT_GAME_SETTINGS, type GameSettings } from "@/app/api/restaurant/game-settings/route";

export const dynamic = "force-dynamic";

const Schema = z.object({
  sessionId:      z.string().min(1),
  restaurantSlug: z.string().min(1),
  score:          z.number().int().min(0),
  total:          z.number().int().min(1),
});

export async function POST(req: Request) {
  try {
    const body   = await req.json().catch(() => ({}));
    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }
    const { sessionId, restaurantSlug, score, total } = parsed.data;

    // Resolve restaurant + game settings
    let restaurant: Awaited<ReturnType<typeof getRestaurantFromSlug>>;
    try {
      restaurant = await getRestaurantFromSlug(restaurantSlug);
    } catch {
      return NextResponse.json({ error: "Restaurant not found." }, { status: 404 });
    }

    const db = getPrismaClient(restaurant.country as Country);

    // Read configured scramble discount
    const branding      = (restaurant.branding ?? {}) as Record<string, unknown>;
    const gameSettings  = ({ ...DEFAULT_GAME_SETTINGS, ...(branding.gameSettings ?? {}) }) as GameSettings;
    const winPct        = gameSettings.scrambleWin / 100;

    // Load session — must have at least one order
    const session = await db.tableSession.findUnique({
      where:  { id: sessionId },
      select: { id: true, restaurantId: true, orders: { select: { id: true }, take: 1 } },
    });
    if (!session || session.restaurantId !== restaurant.id) {
      return NextResponse.json({ error: "Session not found." }, { status: 404 });
    }
    if (session.orders.length === 0) {
      return NextResponse.json({ error: "Place an order first to play games." }, { status: 403 });
    }

    const won = score >= Math.ceil(total * 0.8); // 80% threshold (4/5)

    await db.gameResult.create({
      data: {
        restaurantId: restaurant.id,
        sessionId,
        gameType:    "scramble",
        prize:       won ? `${gameSettings.scrambleWin}% OFF` : "No prize",
        discountPct: won ? winPct : 0,
        won,
      },
    });

    // Apply discount to session if won and better than current
    if (won) {
      const current = await db.tableSession.findUnique({
        where:  { id: sessionId },
        select: { discount: true },
      });
      if (!current?.discount || winPct > current.discount) {
        await db.tableSession.update({
          where: { id: sessionId },
          data:  { discount: winPct },
        });
      }
    }

    return NextResponse.json({ won, discountPct: won ? winPct : 0, score, total });
  } catch (err) {
    console.error("[POST /api/games/scramble]", err);
    return NextResponse.json({ error: "Game result failed." }, { status: 500 });
  }
}
