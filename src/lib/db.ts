import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

// ---------------------------------------------------------------------------
// Prisma singleton — reused across hot-reloads in dev, one instance in prod.
// Prisma 7 requires a driver adapter: we use @prisma/adapter-pg with node-pg.
// ---------------------------------------------------------------------------

const globalForPrisma = globalThis as unknown as {
  pool: Pool | undefined;
  prisma: PrismaClient | undefined;
};

function createClient() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    // Conservative limits for Neon's free-tier pooler
    max: 3,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });

  const adapter = new PrismaPg(pool);
  // The `as any` cast is required because Prisma 7's generated PrismaClient
  // type signature expects specific adapter interfaces that conflict with
  // the generic `adapter` typing in some TypeScript configurations.
  const prisma = new PrismaClient({ adapter } as any);

  return { pool, prisma };
}

export let pool: Pool;
export let prisma: PrismaClient;

if (globalForPrisma.prisma) {
  pool = globalForPrisma.pool!;
  prisma = globalForPrisma.prisma;
} else {
  const created = createClient();
  pool = created.pool;
  prisma = created.prisma;

  // Cache on globalThis in development to survive hot-module replacement.
  // In production each Lambda/Worker has its own module scope — no caching needed.
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.pool = pool;
    globalForPrisma.prisma = prisma;
  }
}
