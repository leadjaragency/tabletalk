import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const approveSchema = z.object({
  restaurantId: z.string().cuid(),
  action: z.enum(["approve", "reject"]),
  tierId: z.string().cuid().optional(),  // required when action === "approve"
  rejectionReason: z.string().optional(),
});

// ---------------------------------------------------------------------------
// POST /api/auth/approve
// Super admin approves or rejects a pending restaurant signup.
// ---------------------------------------------------------------------------

export async function POST(req: Request) {
  try {
    // Auth guard — super_admin only
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = approveSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error?.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { restaurantId, action, tierId } = parsed.data;

    // Verify restaurant exists and is still pending
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: { users: { where: { role: "restaurant_owner" } } },
    });

    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }
    if (restaurant.status !== "pending") {
      return NextResponse.json(
        { error: `Restaurant is already ${restaurant.status}` },
        { status: 409 }
      );
    }

    if (action === "approve") {
      if (!tierId) {
        return NextResponse.json(
          { error: "tierId is required when approving" },
          { status: 400 }
        );
      }

      // Verify tier exists
      const tier = await prisma.subscriptionTier.findUnique({ where: { id: tierId } });
      if (!tier) {
        return NextResponse.json({ error: "Tier not found" }, { status: 404 });
      }

      // Activate restaurant + owner(s) in a transaction
      await prisma.$transaction([
        prisma.restaurant.update({
          where: { id: restaurantId },
          data: { status: "active", tierId },
        }),
        prisma.user.updateMany({
          where: { restaurantId, role: "restaurant_owner" },
          data: { isActive: true },
        }),
      ]);

      return NextResponse.json({
        message: "Restaurant approved and activated.",
        restaurantId,
      });
    }

    // action === "reject" — mark restaurant disabled, leave user inactive
    await prisma.restaurant.update({
      where: { id: restaurantId },
      data: { status: "disabled" },
    });

    return NextResponse.json({
      message: "Restaurant application rejected.",
      restaurantId,
    });
  } catch (error) {
    console.error("[approve]", error);
    return NextResponse.json(
      { error: "Failed to process request. Please try again." },
      { status: 500 }
    );
  }
}
