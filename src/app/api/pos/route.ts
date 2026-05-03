import { NextResponse } from "next/server";

import { getRequiredSession, getRestaurantIdFromSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// ── GET /api/pos — status + sync stats ─────────────────────────────────────
export async function GET() {
  try {
    const session = await getRequiredSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const restaurantId = getRestaurantIdFromSession(session);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [syncedToday, unsyncedCount, recentOrders] = await Promise.all([
      prisma.order.count({
        where: { restaurantId, posSynced: true, createdAt: { gte: todayStart } },
      }),
      prisma.order.count({
        where: { restaurantId, posSynced: false },
      }),
      prisma.order.findMany({
        where:   { restaurantId },
        orderBy: { createdAt: "desc" },
        take:    5,
        select:  {
          id:          true,
          orderNumber: true,
          status:      true,
          total:       true,
          posSynced:   true,
          createdAt:   true,
          table:       { select: { number: true } },
        },
      }),
    ]);

    return NextResponse.json({
      connected:    true,
      syncedToday,
      unsyncedCount,
      recentOrders: JSON.parse(JSON.stringify(recentOrders)),
      provider:     "ServeMyTable POS (Demo)",
      lastSync:     new Date().toISOString(),
    });
  } catch (err) {
    console.error("[GET /api/pos]", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// ── POST /api/pos — sync all unsynced orders ────────────────────────────────
export async function POST() {
  try {
    const session = await getRequiredSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const restaurantId = getRestaurantIdFromSession(session);

    const result = await prisma.order.updateMany({
      where: { restaurantId, posSynced: false },
      data:  { posSynced: true, posOrderId: `POS-${Date.now()}` },
    });

    return NextResponse.json({ synced: result.count });
  } catch (err) {
    console.error("[POST /api/pos]", err);
    return NextResponse.json({ error: "Failed to sync" }, { status: 500 });
  }
}
