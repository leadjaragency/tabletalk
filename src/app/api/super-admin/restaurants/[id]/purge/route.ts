export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getRequiredSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { supabaseAdmin } from "@/lib/supabase-server";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const session = await getRequiredSession();
    if (!session || session.user.role !== "super_admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const restaurant = await prisma.restaurant.findUnique({
      where: { id },
      include: {
        users: { select: { supabaseUserId: true } },
      },
    });

    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    // Collect Supabase user IDs before deleting from DB
    const supabaseUserIds = restaurant.users
      .map((u) => u.supabaseUserId)
      .filter(Boolean) as string[];

    // Hard delete all restaurant data in dependency order
    await prisma.$transaction([
      // Chat messages → chat sessions
      prisma.chatMessage.deleteMany({
        where: { chatSession: { session: { restaurantId: id } } },
      }),
      prisma.chatSession.deleteMany({
        where: { session: { restaurantId: id } },
      }),
      // Order items → orders
      prisma.orderItem.deleteMany({ where: { order: { restaurantId: id } } }),
      prisma.order.deleteMany({ where: { restaurantId: id } }),
      // Reviews, game results, table sessions
      prisma.review.deleteMany({ where: { restaurantId: id } }),
      prisma.gameResult.deleteMany({ where: { restaurantId: id } }),
      prisma.tableSession.deleteMany({ where: { restaurantId: id } }),
      // Tables, AI waiters
      prisma.table.deleteMany({ where: { restaurantId: id } }),
      prisma.aIWaiter.deleteMany({ where: { restaurantId: id } }),
      // Menu
      prisma.dish.deleteMany({ where: { restaurantId: id } }),
      prisma.category.deleteMany({ where: { restaurantId: id } }),
      // Promotions, API usage logs
      prisma.promotion.deleteMany({ where: { restaurantId: id } }),
      prisma.aPIUsageLog.deleteMany({ where: { restaurantId: id } }),
      // Users and restaurant
      prisma.user.deleteMany({ where: { restaurantId: id } }),
      prisma.restaurant.delete({ where: { id } }),
    ]);

    // Delete Supabase auth accounts so owners can never log in again
    await Promise.all(
      supabaseUserIds.map((uid) =>
        supabaseAdmin.auth.admin.deleteUser(uid).catch(() => {
          // Log but don't fail — DB is already cleaned up
          console.warn(`[purge] Failed to delete Supabase user ${uid}`);
        })
      )
    );

    return NextResponse.json({ message: `${restaurant.name} has been permanently deleted.` });
  } catch (error) {
    console.error("[restaurant PURGE]", error);
    return NextResponse.json({ error: "Failed to permanently delete restaurant." }, { status: 500 });
  }
}
