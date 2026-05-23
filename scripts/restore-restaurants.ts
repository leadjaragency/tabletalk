/**
 * restore-restaurants.ts
 *
 * Restores the real restaurant accounts that were wiped from the database.
 * Uses original restaurant IDs from Supabase Auth metadata so existing
 * sessions and metadata links remain valid.
 *
 * Run from the tabletalk/ directory:
 *   npx tsx scripts/restore-restaurants.ts
 */

import path from "path";
import fs from "fs";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { createClient } from "@supabase/supabase-js";

function loadEnv() {
  const file = path.resolve(__dirname, "../.env");
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf-8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const key = t.slice(0, eq).trim();
    const val = t.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!(key in process.env)) process.env[key] = val;
  }
}
loadEnv();

function makeClient(searchPath: "public" | "de") {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  pool.on("connect", (c) => c.query(`SET search_path = ${searchPath}`));
  const adapter = new PrismaPg(pool);
  const client = new PrismaClient({ adapter } as any);
  return { pool, client };
}

const { pool: caPool, client: prismaCA } = makeClient("public");
const { pool: dePool, client: prismaDE } = makeClient("de");

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Standard tier ID from the public schema seed
const STANDARD_TIER_ID = "cmphovnb10001fgvf1t4umgjo";
const ONE_YEAR = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

async function main() {
  console.log("🔧  Restoring real restaurant accounts...\n");

  // ── 1. Dosa Garden ─────────────────────────────────────────────────────────
  console.log("🌿  Restoring Dosa Garden...");
  const dosaRestaurantId = "cmoqe1gwk000004lluaz01ypy";
  const dosaSupabaseId   = "8f5a2bf5-e2be-4005-b207-dd7c8efeb29e";
  const dosaEmail        = "darmadthe@gmail.com";

  const dosaExists = await prismaCA.restaurant.findUnique({ where: { id: dosaRestaurantId } });
  if (dosaExists) {
    console.log("   ✓ Already exists — skipping");
  } else {
    await prismaCA.restaurant.create({
      data: {
        id:      dosaRestaurantId,
        name:    "Dosa Garden",
        slug:    "dosa-garden",
        cuisine: "South Indian",
        status:  "active",
        tierId:  STANDARD_TIER_ID,
        trialStartsAt: new Date("2026-05-03"),
        trialEndsAt:   new Date("2026-06-17T19:12:11.882Z"),
      },
    });
    console.log("   ✅  Restaurant created");
  }

  const dosaUserExists = await prismaCA.user.findUnique({ where: { email: dosaEmail } });
  if (dosaUserExists) {
    await prismaCA.user.update({
      where: { email: dosaEmail },
      data: { supabaseUserId: dosaSupabaseId, isActive: true, restaurantId: dosaRestaurantId },
    });
    console.log("   ✅  User updated");
  } else {
    await prismaCA.user.create({
      data: {
        email:          dosaEmail,
        name:           "Dosa Garden Owner",
        role:           "restaurant_owner",
        restaurantId:   dosaRestaurantId,
        isActive:       true,
        supabaseUserId: dosaSupabaseId,
      },
    });
    console.log("   ✅  User created");
  }

  // Sync Supabase metadata
  await supabaseAdmin.auth.admin.updateUserById(dosaSupabaseId, {
    user_metadata: {
      role:           "restaurant_owner",
      isActive:       true,
      restaurantId:   dosaRestaurantId,
      restaurantSlug: "dosa-garden",
      trialEndsAt:    ONE_YEAR.toISOString(),
    },
  });
  console.log("   ✅  Supabase metadata synced (trial extended 1 year)\n");

  // ── 2. Desi Adda ───────────────────────────────────────────────────────────
  console.log("🍛  Restoring Desi Adda...");
  const desiRestaurantId = "cmpbdoxk5000004kz1pg7p5w4";
  const desiSupabaseId   = "70d078b5-69ba-412b-940c-55c5c3b19127";
  const desiEmail        = "srisailam.paka@gmail.com";

  const desiExists = await prismaCA.restaurant.findUnique({ where: { id: desiRestaurantId } });
  if (desiExists) {
    console.log("   ✓ Already exists — skipping");
  } else {
    await prismaCA.restaurant.create({
      data: {
        id:      desiRestaurantId,
        name:    "Desi Adda",
        slug:    "desiadda",
        cuisine: "Indian",
        status:  "active",
        tierId:  STANDARD_TIER_ID,
        trialStartsAt: new Date("2026-05-18"),
        trialEndsAt:   ONE_YEAR,
      },
    });
    console.log("   ✅  Restaurant created");
  }

  const desiUserExists = await prismaCA.user.findUnique({ where: { email: desiEmail } });
  if (desiUserExists) {
    await prismaCA.user.update({
      where: { email: desiEmail },
      data: { supabaseUserId: desiSupabaseId, isActive: true, restaurantId: desiRestaurantId },
    });
    console.log("   ✅  User updated");
  } else {
    await prismaCA.user.create({
      data: {
        email:          desiEmail,
        name:           "Desi Adda Owner",
        role:           "restaurant_owner",
        restaurantId:   desiRestaurantId,
        isActive:       true,
        supabaseUserId: desiSupabaseId,
      },
    });
    console.log("   ✅  User created");
  }

  await supabaseAdmin.auth.admin.updateUserById(desiSupabaseId, {
    user_metadata: {
      role:           "restaurant_owner",
      isActive:       true,
      restaurantId:   desiRestaurantId,
      restaurantSlug: "desiadda",
      trialEndsAt:    ONE_YEAR.toISOString(),
    },
  });
  console.log("   ✅  Supabase metadata synced (trial extended 1 year)\n");

  // ── 3. Zum Goldenen Hirsch (DE schema) ─────────────────────────────────────
  console.log("🍺  Restoring Zum Goldenen Hirsch (DE)...");
  const hirschRestaurantId = "cmpfdfkg00003o4vfg8thr8ki";
  const hirschSupabaseId   = "712c01d7-cb74-46eb-a36b-c16ac8c147ae";
  const hirschEmail        = "owner@zumgoldenenhirsch.de";
  const hirschSlug         = "zum-goldenen-hirsch";

  // Create a Standard tier in DE schema if it doesn't exist
  const deTierExists = await prismaDE.subscriptionTier.findFirst({ where: { name: "Standard" } });
  let deTierId: string | null = deTierExists?.id ?? null;
  if (!deTierExists) {
    const deTier = await prismaDE.subscriptionTier.create({
      data: {
        name:           "Standard",
        maxTables:      50,
        maxWaiters:     3,
        maxTeamMembers: 5,
        monthlyPrice:   199,
        features: { games: true, analytics: true, posIntegration: false, customBranding: false },
      },
    });
    deTierId = deTier.id;
    console.log("   ✅  DE Standard tier created");
  }

  const hirschExists = await prismaDE.restaurant.findUnique({ where: { id: hirschRestaurantId } });
  if (hirschExists) {
    console.log("   ✓ Already exists — skipping");
  } else {
    await prismaDE.restaurant.create({
      data: {
        id:      hirschRestaurantId,
        name:    "Zum Goldenen Hirsch",
        slug:    hirschSlug,
        cuisine: "German",
        status:  "active",
        tierId:  deTierId,
        trialStartsAt: new Date("2026-05-21"),
        trialEndsAt:   ONE_YEAR,
        country: "DE",
      },
    });
    console.log("   ✅  Restaurant created in DE schema");
  }

  const hirschUserExists = await prismaDE.user.findUnique({ where: { email: hirschEmail } });
  if (hirschUserExists) {
    await prismaDE.user.update({
      where: { email: hirschEmail },
      data: { supabaseUserId: hirschSupabaseId, isActive: true, restaurantId: hirschRestaurantId },
    });
    console.log("   ✅  User updated");
  } else {
    await prismaDE.user.create({
      data: {
        email:          hirschEmail,
        name:           "Hans Bauer",
        role:           "restaurant_owner",
        restaurantId:   hirschRestaurantId,
        isActive:       true,
        supabaseUserId: hirschSupabaseId,
      },
    });
    console.log("   ✅  User created in DE schema");
  }

  await supabaseAdmin.auth.admin.updateUserById(hirschSupabaseId, {
    user_metadata: {
      role:           "restaurant_owner",
      isActive:       true,
      restaurantId:   hirschRestaurantId,
      restaurantSlug: hirschSlug,
      trialEndsAt:    ONE_YEAR.toISOString(),
    },
  });
  console.log("   ✅  Supabase metadata synced (trial extended 1 year)\n");

  console.log("🎉  All restaurants restored!\n");
  console.log("   Dosa Garden:         darmadthe@gmail.com");
  console.log("   Desi Adda:           srisailam.paka@gmail.com");
  console.log("   Zum Goldenen Hirsch: owner@zumgoldenenhirsch.de");
  console.log("\n   ⚠️  Menus, tables, orders, and other data were not recoverable.");
  console.log("   Owners will need to rebuild their menus from scratch.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => {
    await prismaCA.$disconnect();
    await prismaDE.$disconnect();
    await caPool.end();
    await dePool.end();
  });
