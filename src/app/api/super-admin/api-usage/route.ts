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

    const weekAgo = new Date(todayStart.getTime() - 6 * 86_400_000);

    // Per-restaurant totals
    const perRestaurant = await prisma.restaurant.findMany({
      where:   { status: "active" },
      orderBy: { name: "asc" },
      select: {
        id:   true,
        name: true,
        slug: true,
        apiUsage: {
          select: { cost: true, tokensUsed: true, date: true, endpoint: true },
        },
      },
    });

    const rows = perRestaurant.map((r) => {
      const all     = r.apiUsage;
      const today   = all.filter((u) => new Date(u.date) >= todayStart);
      const week    = all.filter((u) => new Date(u.date) >= weekAgo);
      return {
        id:          r.id,
        name:        r.name,
        slug:        r.slug,
        callsTotal:  all.length,
        callsToday:  today.length,
        callsWeek:   week.length,
        tokensTotal: all.reduce((s, u) => s + u.tokensUsed, 0),
        tokensToday: today.reduce((s, u) => s + u.tokensUsed, 0),
        costTotal:   all.reduce((s, u) => s + u.cost, 0),
        costToday:   today.reduce((s, u) => s + u.cost, 0),
        costWeek:    week.reduce((s, u) => s + u.cost, 0),
      };
    });

    const platformTokensToday = rows.reduce((s, r) => s + r.tokensToday, 0);
    const platformCostToday   = rows.reduce((s, r) => s + r.costToday, 0);
    const platformCostTotal   = rows.reduce((s, r) => s + r.costTotal, 0);

    return NextResponse.json({
      rows: JSON.parse(JSON.stringify(rows)),
      platformTokensToday,
      platformCostToday,
      platformCostTotal,
    });
  } catch (err) {
    console.error("[GET /api/super-admin/api-usage]", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
