import { getRequiredSession } from "@/lib/auth";
import { redirect } from "next/navigation";


import { prisma } from "@/lib/db";
import { AutoRefresh } from "@/components/admin/AutoRefresh";
import { TablesPageClient } from "@/components/admin/TablesPageClient";

export const dynamic = "force-dynamic";

export default async function TablesPage() {
  const session = await getRequiredSession();

  if (!session?.user.restaurantId) {
    redirect("/auth/login");
  }

  const restaurantId   = session.user.restaurantId;
  const restaurantSlug = session.user.restaurantSlug ?? "";

  const [tables, waiters] = await Promise.all([
    prisma.table.findMany({
      where:   { restaurantId },
      orderBy: { number: "asc" },
      include: {
        waiter:       { select: { id: true, name: true, avatar: true } },
        mergedInto:   { select: { id: true, number: true } },
        mergedTables: { select: { id: true, number: true }, orderBy: { number: "asc" } },
        orders: {
          where:   { status: { in: ["received", "preparing", "ready"] } },
          orderBy: { createdAt: "desc" },
          take:    1,
          include: {
            items: {
              take:    3,
              include: { dish: { select: { name: true } } },
            },
          },
        },
        sessions: {
          where:   { endedAt: null },
          orderBy: { startedAt: "desc" },
          take:    1,
          select: {
            id:           true,
            guestCount:   true,
            startedAt:    true,
            dietaryPrefs: true,
          },
        },
      },
    }),
    prisma.aIWaiter.findMany({
      where:   { restaurantId, isActive: true },
      orderBy: { name: "asc" },
      select:  { id: true, name: true, avatar: true },
    }),
  ]);

  return (
    <>
      <AutoRefresh intervalMs={10_000} />
      <TablesPageClient
        tables={JSON.parse(JSON.stringify(tables))}
        waiters={waiters}
        restaurantSlug={restaurantSlug}
      />
    </>
  );
}
