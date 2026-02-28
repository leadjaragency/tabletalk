import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { OrdersPageClient } from "@/components/admin/OrdersPageClient";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user.restaurantId) {
    redirect("/auth/login");
  }

  const restaurantId = session.user.restaurantId;

  // Show today's orders plus any still-active ones from previous days
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const orders = await prisma.order.findMany({
    where: {
      restaurantId,
      OR: [
        { createdAt: { gte: todayStart } },                        // today's orders
        { status: { in: ["received", "preparing", "ready"] } },    // still-active older orders
      ],
    },
    orderBy: { createdAt: "desc" },
    take:    200,
    include: {
      table: { select: { id: true, number: true, seats: true } },
      items: {
        include: {
          dish: {
            select: {
              id:         true,
              name:       true,
              allergens:  true,
              imageEmoji: true,
              isVeg:      true,
              isVegan:    true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  return (
    <OrdersPageClient
      initialOrders={JSON.parse(JSON.stringify(orders))}
    />
  );
}
