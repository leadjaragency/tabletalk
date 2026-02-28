import { prisma } from "@/lib/db";
import { ApprovalsPageClient } from "@/components/super-admin/ApprovalsPageClient";

export const dynamic = "force-dynamic";

async function getData() {
  const [pending, tiers] = await Promise.all([
    prisma.restaurant.findMany({
      where: { status: "pending" },
      orderBy: { createdAt: "asc" }, // oldest first — process in order
      select: {
        id: true,
        name: true,
        cuisine: true,
        phone: true,
        address: true,
        createdAt: true,
        users: {
          where: { role: "restaurant_owner" },
          select: { id: true, name: true, email: true, role: true },
        },
      },
    }),
    prisma.subscriptionTier.findMany({
      where: { isActive: true },
      orderBy: { monthlyPrice: "asc" },
      select: {
        id: true, name: true, monthlyPrice: true,
        maxTables: true, maxWaiters: true,
      },
    }),
  ]);

  return { pending, tiers };
}

export default async function ApprovalsPage() {
  const { pending, tiers } = await getData();

  const serialised = pending.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
  }));

  return <ApprovalsPageClient pending={serialised} tiers={tiers} />;
}
