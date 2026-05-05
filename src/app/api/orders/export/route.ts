export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getRequiredSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

function esc(val: string | number | null | undefined): string {
  if (val == null) return "";
  const s = String(val);
  if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

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
      include: {
        table: { select: { number: true } },
        items: {
          include: { dish: { select: { name: true } } },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const header = [
      "Order Number", "Date", "Time", "Table No.",
      "Status", "Items", "Subtotal ($)", "Tax ($)", "Discount ($)", "Total ($)", "Special Notes",
    ].join(",");

    const dataRows = orders.map((o) => {
      const d = new Date(o.createdAt);
      const itemsSummary = o.items
        .map((i) => `${i.dish.name} x${i.quantity}`)
        .join("; ");
      return [
        esc(o.orderNumber),
        esc(d.toISOString().slice(0, 10)),
        esc(d.toLocaleTimeString("en-CA", { hour: "2-digit", minute: "2-digit", hour12: false })),
        esc(o.table.number),
        esc(o.status),
        esc(itemsSummary),
        esc(o.subtotal.toFixed(2)),
        esc(o.tax.toFixed(2)),
        esc(o.discount.toFixed(2)),
        esc(o.total.toFixed(2)),
        esc(o.specialNotes),
      ].join(",");
    });

    const fromStr = fromDate.toISOString().slice(0, 10);
    const toStr   = toDate.toISOString().slice(0, 10);
    const csv     = [header, ...dataRows].join("\r\n") + "\r\n";

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="orders-${fromStr}-to-${toStr}.csv"`,
      },
    });
  } catch (err) {
    console.error("[orders/export]", err);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
