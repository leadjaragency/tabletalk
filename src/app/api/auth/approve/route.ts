import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { supabaseAdmin } from "@/lib/supabase-server";
import { getRequiredSession, requireRole } from "@/lib/auth";
import { sendApprovalEmail } from "@/lib/email";

const approveSchema = z.object({
  restaurantId:    z.string().cuid(),
  action:          z.enum(["approve", "reject"]),
  tierId:          z.string().cuid().optional(),
  rejectionReason: z.string().optional(),
});

// ---------------------------------------------------------------------------
// POST /api/auth/approve
// Super admin approves or rejects a pending restaurant signup.
// On approve: starts the 14-day trial clock and sends approval email.
// ---------------------------------------------------------------------------

export async function POST(req: Request) {
  try {
    const session = await getRequiredSession();
    requireRole(session, ["super_admin"]);

    const body = await req.json();
    const parsed = approveSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error?.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { restaurantId, action, tierId } = parsed.data;

    // Fetch restaurant + owner user
    const restaurant = await prisma.restaurant.findUnique({
      where:   { id: restaurantId },
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

      const tier = await prisma.subscriptionTier.findUnique({ where: { id: tierId } });
      if (!tier) {
        return NextResponse.json({ error: "Tier not found" }, { status: 404 });
      }

      const now = new Date();
      const trialEndsAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // +14 days

      // Activate restaurant + owner in Prisma
      await prisma.$transaction([
        prisma.restaurant.update({
          where: { id: restaurantId },
          data: {
            status:       "active",
            tierId,
            trialStartsAt: now,
            trialEndsAt,
          },
        }),
        prisma.user.updateMany({
          where: { restaurantId, role: "restaurant_owner" },
          data:  { isActive: true },
        }),
      ]);

      // Update Supabase user metadata for each owner (enables middleware trial check)
      for (const owner of restaurant.users) {
        if (owner.supabaseUserId) {
          await supabaseAdmin.auth.admin.updateUserById(owner.supabaseUserId, {
            user_metadata: {
              role:          "restaurant_owner",
              isActive:      true,
              restaurantId,
              restaurantSlug: restaurant.slug,
              trialEndsAt:   trialEndsAt.toISOString(),
            },
          });
        }

        // Send approval email (fire-and-forget)
        sendApprovalEmail({
          to:             owner.email,
          ownerName:      owner.name,
          restaurantName: restaurant.name,
          trialEndsAt,
        }).catch((err) => console.error("[approve] Resend approval email failed:", err));
      }

      return NextResponse.json({
        message:      "Restaurant approved and 14-day trial started.",
        restaurantId,
        trialEndsAt:  trialEndsAt.toISOString(),
      });
    }

    // action === "reject"
    await prisma.restaurant.update({
      where: { id: restaurantId },
      data:  { status: "disabled" },
    });

    for (const owner of restaurant.users) {
      if (owner.supabaseUserId) {
        await supabaseAdmin.auth.admin.updateUserById(owner.supabaseUserId, {
          user_metadata: { isActive: false },
        });
      }
    }

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
