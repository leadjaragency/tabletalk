import { getRequiredSession } from "@/lib/auth";
import { redirect } from "next/navigation";


import { prisma } from "@/lib/db";
import { generateTableQR } from "@/lib/qr-generator";
import { QrCodesPageClient, type QrTable } from "@/components/admin/QrCodesPageClient";

export const dynamic = "force-dynamic";

export default async function QrCodesPage() {
  const session = await getRequiredSession();

  if (!session?.user.restaurantId) {
    redirect("/auth/login");
  }

  const restaurantId   = session.user.restaurantId;
  const restaurantSlug = session.user.restaurantSlug ?? "";

  const [restaurant, rawTables] = await Promise.all([
    prisma.restaurant.findUnique({
      where:  { id: restaurantId },
      select: { name: true, slug: true },
    }),
    prisma.table.findMany({
      where:   { restaurantId },
      orderBy: { number: "asc" },
      select: {
        id:     true,
        number: true,
        seats:  true,
        status: true,
        qrCode: true,
        waiter: { select: { name: true, avatar: true } },
      },
    }),
  ]);

  if (!restaurant) redirect("/auth/login");

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  // Pre-generate QR codes server-side for tables that don't have one saved yet
  const tables: QrTable[] = await Promise.all(
    rawTables.map(async (t) => {
      const qrCode = t.qrCode ?? (await generateTableQR(baseUrl, t.number, restaurantSlug));
      return { ...t, qrCode };
    })
  );

  return (
    <div className="p-6 lg:p-8">
      <QrCodesPageClient
        tables={tables}
        restaurantName={restaurant.name}
        restaurantSlug={restaurantSlug}
        baseUrl={baseUrl}
      />
    </div>
  );
}
