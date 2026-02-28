import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions, getRestaurantIdFromSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// ── PUT /api/promotions/[id] — full update ──────────────────────────────────
const UpdateSchema = z.object({
  title:       z.string().min(1).max(100).optional(),
  description: z.string().max(300).optional(),
  type:        z.enum(["percentage", "fixed", "freeItem"]).optional(),
  value:       z.coerce.number().min(0).optional(),
  minOrder:    z.coerce.number().min(0).nullable().optional(),
  validFrom:   z.string().optional(),
  validUntil:  z.string().optional(),
  isActive:    z.boolean().optional(),
});

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const restaurantId = getRestaurantIdFromSession(session);

    const target = await prisma.promotion.findFirst({ where: { id, restaurantId } });
    if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body   = await req.json().catch(() => ({}));
    const parsed = UpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { validFrom, validUntil, ...rest } = parsed.data;
    const updated = await prisma.promotion.update({
      where: { id },
      data:  {
        ...rest,
        ...(validFrom  ? { validFrom:  new Date(validFrom)  } : {}),
        ...(validUntil ? { validUntil: new Date(validUntil) } : {}),
      },
    });
    return NextResponse.json({ promotion: JSON.parse(JSON.stringify(updated)) });
  } catch (err) {
    console.error("[PUT /api/promotions/[id]]", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// ── PATCH /api/promotions/[id] — toggle isActive ────────────────────────────
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const restaurantId = getRestaurantIdFromSession(session);

    const target = await prisma.promotion.findFirst({ where: { id, restaurantId } });
    if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body    = await req.json().catch(() => ({}));
    const updated = await prisma.promotion.update({
      where: { id },
      data:  { isActive: body.isActive ?? !target.isActive },
    });
    return NextResponse.json({ promotion: JSON.parse(JSON.stringify(updated)) });
  } catch (err) {
    console.error("[PATCH /api/promotions/[id]]", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// ── DELETE /api/promotions/[id] ─────────────────────────────────────────────
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const restaurantId = getRestaurantIdFromSession(session);

    const target = await prisma.promotion.findFirst({ where: { id, restaurantId } });
    if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.promotion.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/promotions/[id]]", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
