import { NextRequest, NextResponse } from "next/server";
import { getRequiredSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await getRequiredSession();
    if (!session?.user.restaurantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const restaurantId = session.user.restaurantId;

    const { searchParams } = new URL(req.url);
    const fromParam = searchParams.get("from");
    const toParam   = searchParams.get("to");

    const fromDate = fromParam ? new Date(fromParam) : new Date(Date.now() - 30 * 86_400_000);
    fromDate.setHours(0, 0, 0, 0);
    const toDate = toParam ? new Date(toParam) : new Date();
    toDate.setHours(23, 59, 59, 999);

    const orders = await prisma.order.findMany({
      where: {
        restaurantId,
        createdAt: { gte: fromDate, lte: toDate },
      },
      select: {
        total: true,
        subtotal: true,
        tax: true,
        discount: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    // Aggregate by day
    const dayMap = new Map<string, { count: number; revenue: number; tax: number; discount: number }>();
    for (const o of orders) {
      const day = o.createdAt.toISOString().slice(0, 10);
      const prev = dayMap.get(day) ?? { count: 0, revenue: 0, tax: 0, discount: 0 };
      dayMap.set(day, {
        count:    prev.count + 1,
        revenue:  prev.revenue + o.total,
        tax:      prev.tax + o.tax,
        discount: prev.discount + o.discount,
      });
    }

    const header = [
      "Date", "Orders", "Revenue ($)", "Avg Order Value ($)", "Tax Collected ($)", "Discounts Given ($)",
    ].join(",");

    const dataRows: string[] = [];
    const cursor = new Date(fromDate);
    while (cursor <= toDate) {
      const day  = cursor.toISOString().slice(0, 10);
      const data = dayMap.get(day) ?? { count: 0, revenue: 0, tax: 0, discount: 0 };
      const avg  = data.count > 0 ? data.revenue / data.count : 0;
      dataRows.push([
        day,
        data.count,
        data.revenue.toFixed(2),
        avg.toFixed(2),
        data.tax.toFixed(2),
        data.discount.toFixed(2),
      ].join(","));
      cursor.setDate(cursor.getDate() + 1);
    }

    // Totals row
    const totalOrders  = orders.length;
    const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
    const totalTax     = orders.reduce((s, o) => s + o.tax, 0);
    const totalDiscount = orders.reduce((s, o) => s + o.discount, 0);
    const avgOrder     = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    dataRows.push(""); // blank separator
    dataRows.push([
      "TOTAL",
      totalOrders,
      totalRevenue.toFixed(2),
      avgOrder.toFixed(2),
      totalTax.toFixed(2),
      totalDiscount.toFixed(2),
    ].join(","));

    const fromStr = fromDate.toISOString().slice(0, 10);
    const toStr   = toDate.toISOString().slice(0, 10);
    const csv     = [header, ...dataRows].join("\r\n") + "\r\n";

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="revenue-report-${fromStr}-to-${toStr}.csv"`,
      },
    });
  } catch (err) {
    console.error("[analytics/revenue-export]", err);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
