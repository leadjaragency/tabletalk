import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const Schema = z.object({
  sessionId:      z.string().min(1),
  restaurantSlug: z.string().min(1),
});

/**
 * POST /api/customer/request-payment
 * Called when a customer taps "Call for Card Machine".
 * Sets table.status = "billing" so the admin floor plan highlights it,
 * and creates a simple notification record via the existing TableSession.
 */
export async function POST(req: Request) {
  try {
    const body   = await req.json().catch(() => ({}));
    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }
    const { sessionId, restaurantSlug } = parsed.data;

    // Resolve restaurant
    const restaurant = await prisma.restaurant.findFirst({
      where:  { slug: restaurantSlug, status: "active" },
      select: { id: true },
    });
    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found." }, { status: 404 });
    }

    // Resolve session → tableId
    const session = await prisma.tableSession.findUnique({
      where:  { id: sessionId },
      select: { id: true, restaurantId: true, tableId: true, endedAt: true },
    });
    if (!session || session.restaurantId !== restaurant.id) {
      return NextResponse.json({ error: "Session not found." }, { status: 404 });
    }
    if (session.endedAt) {
      return NextResponse.json({ error: "Session already ended." }, { status: 400 });
    }

    // Set table status to "billing" — flags it on admin floor plan
    await prisma.table.update({
      where: { id: session.tableId },
      data:  { status: "billing" },
    });

    return NextResponse.json({ ok: true, message: "Representative notified." });
  } catch (err) {
    console.error("[POST /api/customer/request-payment]", err);
    return NextResponse.json({ error: "Failed to notify." }, { status: 500 });
  }
}
