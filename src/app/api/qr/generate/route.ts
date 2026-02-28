import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions, getRestaurantIdFromSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateTableQR } from "@/lib/qr-generator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Schema = z.object({ tableId: z.string().min(1) });

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const restaurantId = getRestaurantIdFromSession(session);

    const body = await req.json().catch(() => ({}));
    const { tableId } = Schema.parse(body);

    const [table, restaurant] = await Promise.all([
      prisma.table.findFirst({
        where:  { id: tableId, restaurantId },
        select: { id: true, number: true },
      }),
      prisma.restaurant.findUnique({
        where:  { id: restaurantId },
        select: { slug: true, name: true },
      }),
    ]);

    if (!table)      return NextResponse.json({ error: "Table not found" },      { status: 404 });
    if (!restaurant) return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const qrCode  = await generateTableQR(baseUrl, table.number, restaurant.slug);

    await prisma.table.update({ where: { id: tableId }, data: { qrCode } });

    return NextResponse.json({ qrCode, tableId, tableNumber: table.number });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    }
    console.error("[POST /api/qr/generate]", err);
    return NextResponse.json({ error: "Failed to generate QR code" }, { status: 500 });
  }
}
