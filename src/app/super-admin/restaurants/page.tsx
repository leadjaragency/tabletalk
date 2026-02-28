import { prisma } from "@/lib/db";
import { RestaurantsPageClient } from "@/components/super-admin/RestaurantsPageClient";

export const dynamic = "force-dynamic";

async function getData() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [restaurants, tiers] = await Promise.all([
    prisma.restaurant.findMany({
      include: {
        tier: { select: { id: true, name: true, monthlyPrice: true } },
        _count: {
          select: {
            tables: true,
            orders: { where: { createdAt: { gte: todayStart } } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.subscriptionTier.findMany({
      where: { isActive: true },
      orderBy: { monthlyPrice: "asc" },
      select: { id: true, name: true, monthlyPrice: true },
    }),
  ]);

  return { restaurants, tiers };
}

export default async function RestaurantsPage() {
  const { restaurants, tiers } = await getData();

  // Serialise dates so client components can receive them as props
  const serialised = restaurants.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
  }));

  return <RestaurantsPageClient restaurants={serialised} tiers={tiers} />;
}
