import { getRequiredSession, getPrismaForSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { MenuPageClient } from "@/components/admin/MenuPageClient";

export const dynamic = "force-dynamic";

export default async function MenuPage() {
  const session = await getRequiredSession();

  if (!session?.user.restaurantId) {
    redirect("/auth/login");
  }

  const restaurantId = session.user.restaurantId;
  const db = getPrismaForSession(session);

  const [categories, dishes] = await Promise.all([
    db.category.findMany({
      where:   { restaurantId },
      orderBy: { sortOrder: "asc" },
      include: {
        _count: {
          select: { dishes: { where: { isAvailable: true } } },
        },
      },
    }),
    db.dish.findMany({
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
