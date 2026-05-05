export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendTrialWarningEmail } from "@/lib/email";

// ---------------------------------------------------------------------------
// GET /api/cron/trial-warning
// Runs daily (scheduled via vercel.json cron).
// Sends a warning email to restaurants whose trial expires within 3 days.
// Uses lastWarningSentAt to ensure one email per restaurant per trial window.
// ---------------------------------------------------------------------------

export async function GET(req: Request) {
  // Protect with a shared secret so only Vercel Cron can call this
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  // Find active restaurants whose trial ends in the next 3 days
  // and haven't received a warning email yet
  const restaurants = await prisma.restaurant.findMany({
    where: {
      status:       "active",
      trialEndsAt:  { gte: now, lte: in3Days },
      lastWarningSentAt: null,
    },
    include: {
      users: {
        where:  { role: "restaurant_owner", isActive: true },
        select: { email: true, name: true },
      },
    },
  });

  let sent = 0;
  const errors: string[] = [];

  for (const restaurant of restaurants) {
    const owner = restaurant.users[0];
    if (!owner || !restaurant.trialEndsAt) continue;

    const msLeft = restaurant.trialEndsAt.getTime() - now.getTime();
    const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));

    try {
      await sendTrialWarningEmail({
        to:             owner.email,
        ownerName:      owner.name,
        restaurantName: restaurant.name,
        trialEndsAt:    restaurant.trialEndsAt,
        daysLeft,
      });

      await prisma.restaurant.update({
        where: { id: restaurant.id },
        data:  { lastWarningSentAt: now },
      });

      sent++;
    } catch (err) {
      errors.push(`${restaurant.id}: ${String(err)}`);
      console.error("[cron/trial-warning]", restaurant.id, err);
    }
  }

  return NextResponse.json({
    sent,
    errors: errors.length > 0 ? errors : undefined,
    checkedAt: now.toISOString(),
  });
}
