import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions, getRestaurantIdFromSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// ── GET /api/promotions ─────────────────────────────────────────────────────
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const restaurantId = getRestaurantIdFromSession(session);

    const promotions = await prisma.promotion.findMany({
      where:   { restaurantId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ promotions: JSON.parse(JSON.stringify(promotions)) });
  } catch (err) {
    console.error("[GET /api/promotions]", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// ── POST /api/promotions ────────────────────────────────────────────────────
const CreateSchema = z.object({
  title:       z.string().min(1).max(100),
  description: z.string().max(300).default(""),
  type:        z.enum(["percentage", "fixed", "freeItem"]),
  value:       z.coerce.number().min(0),
  minOrder:    z.coerce.number().min(0).nullable().optional(),
  freeItemId:  z.string().nullable().optional(),
  validFrom:   z.string(),
  validUntil:  z.string(),
  isActive:    z.boolean().default(true),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const restaurantId = getRestaurantIdFromSession(session);

    const body   = await req.json().catch(() => ({}));
    const parsed = CreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const promo = await prisma.promotion.create({
      data: {
        ...parsed.data,
        restaurantId,
        validFrom:  new Date(parsed.data.validFrom),
        validUntil: new Date(parsed.data.validUntil),
      },
    });
    return NextResponse.json({ promotion: JSON.parse(JSON.stringify(promo)) }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/promotions]", err);
    return NextResponse.json({ error: "Failed to create promotion" }, { status: 500 });
  }
}
