import { getRequiredSession } from "@/lib/auth";
import { redirect } from "next/navigation";


import { prisma } from "@/lib/db";
import { MenuPageClient } from "@/components/admin/MenuPageClient";

export const dynamic = "force-dynamic";

export default async function MenuPage() {
  const session = await getRequiredSession();

  if (!session?.user.restaurantId) {
    redirect("/auth/login");
  }

  const restaurantId = session.user.restaurantId;

  const [categories, dishes] = await Promise.all([
    prisma.category.findMany({
      where:   { restaurantId },
      orderBy: { sortOrder: "asc" },
      include: {
        _count: {
          select: { dishes: { where: { isAvailable: true } } },
        },
      },
    }),
    prisma.dish.findMany({
      where:   { restaurantId },
      include: { category: { select: { id: true, name: true, sortOrder: true } } },
      orderBy: [
        { category: { sortOrder: "asc" } },
        { name: "asc" },
      ],
    }),
  ]);

  return (
    <MenuPageClient
      categories={categories}
      dishes={dishes}
    />
  );
}
