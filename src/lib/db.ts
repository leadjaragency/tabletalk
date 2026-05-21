import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

// ---------------------------------------------------------------------------
// Multi-schema Prisma setup
//
// Canada data  → public schema  (default `prisma` export)
// Germany data → de schema      (`prismaDE` / `getPrismaClient('DE')`)
//
// Both clients share the same Supabase project. The schema is switched via
// PostgreSQL's search_path, set immediately after each connection is acquired
// from the pool.
//
// RULES:
//   - User / SubscriptionTier lookups: always use `prisma` (public schema)
//   - All restaurant-scoped data (Dish, Table, Order, etc.): use getPrismaClient(country)
//   - Super admin cross-country queries: query both clients and merge
// ---------------------------------------------------------------------------

type Country = "CA" | "DE";

const globalForPrisma = globalThis as unknown as {
  caPool: Pool | undefined;
  caPrisma: PrismaClient | undefined;
  dePool: Pool | undefined;
  dePrisma: PrismaClient | undefined;
};

function createPoolClient(searchPath: "public" | "de") {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 3,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });

  // Set search_path on every new connection so Prisma finds tables in the right schema
  pool.on("connect", (pgClient) => {
    pgClient.query(`SET search_path = ${searchPath}`);
  });

  const adapter = new PrismaPg(pool);
  const client = new PrismaClient({ adapter } as any);
  return { pool, client };
}

// ── Canada client (public schema) ───────────────────────────────────────────

export let prisma: PrismaClient;
export let pool: Pool;

if (globalForPrisma.caPrisma) {
  prisma = globalForPrisma.caPrisma;
  pool = globalForPrisma.caPool!;
} else {
  const ca = createPoolClient("public");
  prisma = ca.client;
  pool = ca.pool;

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.caPrisma = prisma;
    globalForPrisma.caPool = pool;
  }
}

// ── Germany client (de schema) ───────────────────────────────────────────────

export let prismaDE: PrismaClient;

if (globalForPrisma.dePrisma) {
  prismaDE = globalForPrisma.dePrisma;
} else {
  const de = createPoolClient("de");
  prismaDE = de.client;

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.dePrisma = prismaDE;
    globalForPrisma.dePool = de.pool;
  }
}

// ── Factory helper ───────────────────────────────────────────────────────────

export function getPrismaClient(country: Country): PrismaClient {
  return country === "DE" ? prismaDE : prisma;
}
