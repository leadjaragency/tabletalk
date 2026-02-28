import { type NextAuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import type { Session } from "next-auth";
import type { UserRole } from "@/types";

// ---------------------------------------------------------------------------
// NextAuth options — imported by the route handler and getServerSession calls
// ---------------------------------------------------------------------------
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email:    { label: "Email",    type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // Look up user with their restaurant (for slug + status check)
        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
          include: {
            restaurant: {
              select: { id: true, slug: true, status: true },
            },
          },
        });

        // User not found or deactivated
        if (!user || !user.isActive) return null;

        // Password check
        const passwordOk = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );
        if (!passwordOk) return null;

        // Restaurant staff must have an active restaurant
        // (super_admin has no restaurant — skip the check)
        if (user.role !== "super_admin") {
          const status = user.restaurant?.status;
          // Allow pending through — they'll be redirected to /auth/pending
          // Deny suspended / disabled
          if (status === "suspended" || status === "disabled") return null;
        }

        return {
          id:             user.id,
          email:          user.email,
          name:           user.name,
          role:           user.role as UserRole,
          restaurantId:   user.restaurantId ?? null,
          restaurantSlug: user.restaurant?.slug ?? null,
        };
      },
    }),
  ],

  callbacks: {
    // Encode extra fields into the JWT when the user signs in
    async jwt({ token, user }) {
      if (user) {
        token.id             = user.id;
        token.role           = user.role;
        token.restaurantId   = user.restaurantId;
        token.restaurantSlug = user.restaurantSlug;
      }
      return token;
    },

    // Expose JWT fields on the session object (available via useSession / getServerSession)
    async session({ session, token }) {
      session.user.id             = token.id;
      session.user.role           = token.role;
      session.user.restaurantId   = token.restaurantId;
      session.user.restaurantSlug = token.restaurantSlug;
      return session;
    },
  },

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  pages: {
    signIn: "/auth/login",
    error:  "/auth/login",
  },

  secret: process.env.NEXTAUTH_SECRET,

  // Only log errors in production to keep dev console clean
  logger: {
    error: (code, ...message) => {
      if (process.env.NODE_ENV === "production") {
        console.error("[NextAuth]", code, ...message);
      }
    },
  },
};

// ---------------------------------------------------------------------------
// Server-side helper: get session, throwing if not authenticated
// ---------------------------------------------------------------------------
export async function getRequiredSession(): Promise<Session> {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new AuthError("Unauthorized", 401);
  }
  return session;
}

// ---------------------------------------------------------------------------
// Role guard — call after getRequiredSession
// ---------------------------------------------------------------------------
export function requireRole(session: Session, roles: UserRole[]): void {
  if (!roles.includes(session.user.role)) {
    throw new AuthError("Forbidden", 403);
  }
}

// ---------------------------------------------------------------------------
// Extract restaurantId from session (throws for super_admin with no restaurant)
// ---------------------------------------------------------------------------
export function getRestaurantIdFromSession(session: Session): string {
  const id = session.user.restaurantId;
  if (!id) throw new AuthError("No restaurant associated with this account", 403);
  return id;
}

// ---------------------------------------------------------------------------
// Look up a restaurant by its URL slug (customer-facing APIs use this)
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

  if (!restaurant) {
    throw new AuthError("Restaurant not found", 404);
  }
  if (restaurant.status !== "active") {
    throw new AuthError("Restaurant is not active", 403);
  }

  return restaurant;
}

// ---------------------------------------------------------------------------
// Typed error class so API routes can return the right HTTP status code
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

// ---------------------------------------------------------------------------
// Convenience: resolve which dashboard to redirect to after login
// ---------------------------------------------------------------------------
export function getDashboardPath(role: UserRole): string {
  switch (role) {
    case "super_admin":          return "/super-admin";
    case "restaurant_owner":
    case "restaurant_manager":   return "/admin";
  }
}
