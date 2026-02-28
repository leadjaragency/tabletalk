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

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const restaurants = await prisma.restaurant.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id:        true,
        name:      true,
        slug:      true,
        status:    true,
        tier:      { select: { name: true, monthlyPrice: true } },
        apiUsage:  {
          where:  { date: { gte: monthStart } },
          select: { cost: true, tokensUsed: true },
        },
        _count: {
          select: { orders: true, tables: true },
        },
      },
    });

    const billing = restaurants.map((r) => {
      const apiCost = r.apiUsage.reduce((s, u) => s + u.cost, 0);
      const totalTokens = r.apiUsage.reduce((s, u) => s + u.tokensUsed, 0);
      return {
        id:           r.id,
        name:         r.name,
        slug:         r.slug,
        status:       r.status,
        tierName:     r.tier?.name ?? null,
        monthlyPrice: r.tier?.monthlyPrice ?? 0,
        apiCostMonth: apiCost,
        totalTokens,
        totalRevenue: (r.tier?.monthlyPrice ?? 0) + apiCost,
        orderCount:   r._count.orders,
        tableCount:   r._count.tables,
      };
    });

    const platformTotal = billing.reduce((s, b) => s + b.totalRevenue, 0);

    return NextResponse.json({ billing: JSON.parse(JSON.stringify(billing)), platformTotal });
  } catch (err) {
    console.error("[GET /api/super-admin/billing]", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
