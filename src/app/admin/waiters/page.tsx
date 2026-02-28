import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AutoRefresh } from "@/components/admin/AutoRefresh";
import { WaitersPageClient } from "@/components/admin/WaitersPageClient";

export const dynamic = "force-dynamic";

export default async function WaitersPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user.restaurantId) {
    redirect("/auth/login");
  }

  const restaurantId = session.user.restaurantId;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [waiters, allTables, todayChatsRaw, todayOrdersRaw] = await Promise.all([
    // All waiters with table assignments and chat session counts
    prisma.aIWaiter.findMany({
      where:   { restaurantId },
      orderBy: { createdAt: "asc" },
      include: {
        tables: {
          select:  { id: true, number: true, status: true },
          orderBy: { number: "asc" },
        },
        _count: { select: { chatSessions: true } },
      },
    }),

    // All tables (for the assignment picker in the modal)
    prisma.table.findMany({
      where:   { restaurantId },
      orderBy: { number: "asc" },
      select:  { id: true, number: true, status: true },
    }),

    // Today's chat sessions grouped by waiter
    prisma.chatSession.groupBy({
      by:    ["waiterId"],
      where: { createdAt: { gte: todayStart } },
      _count: { _all: true },
    }),

    // Today's orders per waiter (via table → session → order path)
    prisma.order.groupBy({
      by:    ["restaurantId"],   // We'll compute per-waiter in JS from table data
      where: { restaurantId, createdAt: { gte: todayStart } },
      _count: { _all: true },
    }),
  ]);

  // Build today's chat map: waiterId → count
  const todayChats: Record<string, number> = {};
  for (const row of todayChatsRaw) {
    todayChats[row.waiterId] = row._count._all;
  }

  // For today's orders per waiter: look up orders via their table's waiter assignment
  // (simpler: count orders on tables currently assigned to each waiter)
  const todayOrdersPerTable = await prisma.order.groupBy({
    by:    ["tableId"],
    where: { restaurantId, createdAt: { gte: todayStart } },
    _count: { _all: true },
  });

  const tableIdToWaiterId: Record<string, string> = {};
  for (const w of waiters) {
    for (const t of w.tables) {
      tableIdToWaiterId[t.id] = w.id;
    }
  }

  const todayOrders: Record<string, number> = {};
  for (const row of todayOrdersPerTable) {
    const waiterId = tableIdToWaiterId[row.tableId];
    if (waiterId) {
      todayOrders[waiterId] = (todayOrders[waiterId] ?? 0) + row._count._all;
    }
  }

  return (
    <>
      <AutoRefresh intervalMs={10_000} />
      <WaitersPageClient
        waiters={JSON.parse(JSON.stringify(waiters))}
        allTables={allTables}
        todayChats={todayChats}
        todayOrders={todayOrders}
      />
    </>
  );
}
