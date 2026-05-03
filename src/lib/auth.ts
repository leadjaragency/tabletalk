import { prisma } from "@/lib/db";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import type { AppSession, UserRole } from "@/types";

// ---------------------------------------------------------------------------
// getRequiredSession — reads the Supabase session from cookies, then fetches
// the matching Prisma User row for app-level fields (name, restaurantId, etc.)
// Throws AuthError(401) if not authenticated.
// ---------------------------------------------------------------------------
export async function getRequiredSession(): Promise<AppSession> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new AuthError("Unauthorized", 401);

  // Look up the Prisma user by the Supabase user ID
  const dbUser = await prisma.user.findUnique({
    where: { supabaseUserId: user.id },
    include: {
      restaurant: { select: { id: true, slug: true, status: true, trialEndsAt: true } },
    },
  });

  if (!dbUser || !dbUser.isActive) throw new AuthError("Unauthorized", 401);

  // Block suspended / disabled restaurant accounts
  if (dbUser.role !== "super_admin") {
    const status = dbUser.restaurant?.status;
    if (status === "suspended" || status === "disabled") {
      throw new AuthError("Account is not active", 403);
    }
  }

  return {
    user: {
      id:             dbUser.id,
      email:          dbUser.email,
      name:           dbUser.name,
      role:           dbUser.role as UserRole,
      restaurantId:   dbUser.restaurantId ?? null,
      restaurantSlug: dbUser.restaurant?.slug ?? null,
    },
  };
}

// ---------------------------------------------------------------------------
// requireRole — call after getRequiredSession to enforce role-based access
// ---------------------------------------------------------------------------
export function requireRole(session: AppSession, roles: UserRole[]): void {
  if (!roles.includes(session.user.role)) {
    throw new AuthError("Forbidden", 403);
  }
}

// ---------------------------------------------------------------------------
// getRestaurantIdFromSession — extracts restaurantId, throws if missing
// ---------------------------------------------------------------------------
export function getRestaurantIdFromSession(session: AppSession): string {
  const id = session.user.restaurantId;
  if (!id) throw new AuthError("No restaurant associated with this account", 403);
  return id;
}

// ---------------------------------------------------------------------------
// getRestaurantFromSlug — customer-facing APIs resolve restaurant from URL param
// ---------------------------------------------------------------------------
export async function getRestaurantFromSlug(slug: string) {
  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    select: {
      id:       true,
      name:     true,
      slug:     true,
      cuisine:  true,
      tagline:  true,
      logoUrl:  true,
      phone:    true,
      email:    true,
      address:  true,
      hours:    true,
      taxRate:  true,
      currency: true,
      status:   true,
      tier:     { select: { features: true } },
    },
  });

  if (!restaurant) throw new AuthError("Restaurant not found", 404);
  if (restaurant.status !== "active") throw new AuthError("Restaurant is not active", 403);

  return restaurant;
}

// ---------------------------------------------------------------------------
// getDashboardPath — resolve which dashboard to redirect to after login
// ---------------------------------------------------------------------------
export function getDashboardPath(role: UserRole): string {
  switch (role) {
    case "super_admin":        return "/super-admin";
    case "restaurant_owner":
    case "restaurant_manager": return "/admin";
  }
}

// ---------------------------------------------------------------------------
// AuthError — typed error class so API routes can return the right HTTP status
// ---------------------------------------------------------------------------
export class AuthError extends Error {
  constructor(
    message: string,
    public readonly status: 401 | 403 | 404 = 401
  ) {
    super(message);
    this.name = "AuthError";
  }
}
