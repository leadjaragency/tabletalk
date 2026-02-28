import { CustomerShell } from "@/components/customer/CustomerShell";

type Params = { params: Promise<{ tableId: string }> };

/**
 * Customer-facing table layout.
 *
 * Next.js App Router layouts cannot access searchParams — the restaurant
 * slug lives in ?restaurant=<slug>. We defer restaurant/table resolution
 * to <CustomerShell>, a client component that reads useSearchParams(),
 * fetches /api/customer/info, and provides the CustomerContext + BottomNav.
 */
export default async function TableLayout({
  children,
  params,
}: {
  children: React.ReactNode;
} & Params) {
  const { tableId } = await params;

  return (
    // zone-customer applies the warm-cream light theme (cu-* tokens)
    <div className="zone-customer">
      {/* Max-width centering — mobile-first at 480px */}
      <div className="mx-auto max-w-[480px] relative min-h-dvh bg-cu-bg">
        <CustomerShell tableId={tableId}>{children}</CustomerShell>
      </div>
    </div>
  );
}
