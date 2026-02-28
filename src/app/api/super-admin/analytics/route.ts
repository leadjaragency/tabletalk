import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      restaurantCounts, orderStats, reviewStats,
      cuisineCounts, chatSessionsToday, gameWins,
    ] = await Promise.all([
      prisma.restaurant.groupBy({ by: ["status"], _count: { id: true } }),
      prisma.order.aggregate({
        where:  { createdAt: { gte: todayStart } },
        _count: { id: true },
        _sum:   { total: true },
      }),
      prisma.review.aggregate({ _avg: { rating: true }, _count: { id: true } }),
      prisma.restaurant.groupBy({
        by:      ["cuisine"],
        where:   { status: "active" },
        _count:  { id: true },
        orderBy: { _count: { id: "desc" } },
        take:    6,
      }),
      prisma.chatSession.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.gameResult.count({ where: { won: true } }),
    ]);

    const statusMap = Object.fromEntries(restaurantCounts.map((r) => [r.status, r._count.id]));

    return NextResponse.json({
      restaurants:      {
        active:    statusMap["active"]    ?? 0,
        pending:   statusMap["pending"]   ?? 0,
        suspended: statusMap["suspended"] ?? 0,
        total:     restaurantCounts.reduce((s, r) => s + r._count.id, 0),
      },
      ordersToday:      orderStats._count.id,
      revenueToday:     orderStats._sum.total ?? 0,
      avgRating:        reviewStats._avg.rating ?? 0,
      totalReviews:     reviewStats._count.id,
      aiChatsToday:     chatSessionsToday,
      gameWinsTotal:    gameWins,
      cuisineBreakdown: JSON.parse(JSON.stringify(cuisineCounts)),
    });
  } catch (err) {
    console.error("[GET /api/super-admin/analytics]", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
