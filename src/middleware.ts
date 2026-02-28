import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function redirectTo(url: string, req: NextRequest) {
  return NextResponse.redirect(new URL(url, req.url));
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Retrieve JWT token (Edge-compatible — no DB queries)
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const role = token?.role as string | undefined;
  const isAuthenticated = !!token;

  // ── /auth/* ──────────────────────────────────────────────────────────────
  // Public pages. If already logged in, redirect to appropriate dashboard.
  if (pathname.startsWith("/auth/")) {
    // Allow /auth/pending for any authenticated user (owner awaiting approval)
    if (pathname === "/auth/pending") return NextResponse.next();

    if (isAuthenticated) {
      if (role === "super_admin") return redirectTo("/super-admin", req);
      if (role === "restaurant_owner" || role === "restaurant_manager")
        return redirectTo("/admin", req);
    }
    return NextResponse.next();
  }

  // ── / (root) ─────────────────────────────────────────────────────────────
  // Redirect to dashboard or login based on role.
  if (pathname === "/") {
    if (!isAuthenticated) return redirectTo("/auth/login", req);
    if (role === "super_admin") return redirectTo("/super-admin", req);
    if (role === "restaurant_owner" || role === "restaurant_manager")
      return redirectTo("/admin", req);
    return redirectTo("/auth/login", req);
  }

  // ── /super-admin/* ───────────────────────────────────────────────────────
  if (pathname.startsWith("/super-admin")) {
    if (!isAuthenticated) return redirectTo("/auth/login", req);
    if (role !== "super_admin") return redirectTo("/auth/login", req);
    return NextResponse.next();
  }

  // ── /api/super-admin/* ───────────────────────────────────────────────────
  if (pathname.startsWith("/api/super-admin")) {
    if (!isAuthenticated)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (role !== "super_admin")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.next();
  }

  // ── /admin/* ─────────────────────────────────────────────────────────────
  if (pathname.startsWith("/admin")) {
    if (!isAuthenticated) return redirectTo("/auth/login", req);
    if (role !== "restaurant_owner" && role !== "restaurant_manager")
      return redirectTo("/auth/login", req);
    // restaurantId must be present (should always be set for restaurant roles)
    if (!token.restaurantId) return redirectTo("/auth/pending", req);
    return NextResponse.next();
  }

  // ── /api/* (restaurant-scoped, non-super-admin) ──────────────────────────
  // Covers /api/menu, /api/tables, /api/orders, /api/waiters, /api/qr, etc.
  // /api/auth/* and /api/chat/* are excluded via the matcher below.
  const restaurantApiPrefixes = [
    "/api/menu",
    "/api/categories",
    "/api/tables",
    "/api/waiters",
    "/api/orders",
    "/api/qr",
    "/api/reviews",
    "/api/promotions",
    "/api/pos",
    "/api/restaurant",
  ];

  if (restaurantApiPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    if (!isAuthenticated)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (role !== "restaurant_owner" && role !== "restaurant_manager")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (!token.restaurantId)
      return NextResponse.json({ error: "No restaurant" }, { status: 403 });
    return NextResponse.next();
  }

  // ── /table/* ─────────────────────────────────────────────────────────────
  // Customer-facing app. Public — no auth required.
  // Restaurant is resolved from ?restaurant= query param by the layout.
  if (pathname.startsWith("/table")) {
    return NextResponse.next();
  }

  // ── /api/chat/* ──────────────────────────────────────────────────────────
  // Customer-facing AI chat. Public — authenticated via restaurantSlug.
  if (pathname.startsWith("/api/chat")) {
    return NextResponse.next();
  }

  // ── /api/games/* ─────────────────────────────────────────────────────────
  if (pathname.startsWith("/api/games")) {
    return NextResponse.next();
  }

  // Default: allow through
  return NextResponse.next();
}

// ---------------------------------------------------------------------------
// Matcher — run middleware only on relevant paths
// ---------------------------------------------------------------------------

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     *  - _next/static  (static files)
     *  - _next/image   (image optimisation)
     *  - favicon.ico
     *  - public/ assets (svg, png, jpg, jpeg, gif, webp, ico, mp3, wav)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp3|wav)$).*)",
  ],
};
