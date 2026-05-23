/**
 * fix-auth-metadata.ts
 *
 * One-shot repair script: syncs Supabase user_metadata for both the super admin
 * and the Saffron Palace demo owner so they can log in immediately.
 *
 * Run from the tabletalk/ directory:
 *   npx tsx scripts/fix-auth-metadata.ts
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

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function fixUser(email: string, metadataFn: (dbUser: any) => object) {
  console.log(`\n🔧  Fixing: ${email}`);

  // 1. Find Prisma user
  const dbUser = await prisma.user.findUnique({
    where: { email },
    include: { restaurant: { select: { id: true, slug: true } } },
  });
  if (!dbUser) {
    console.error(`   ❌  Not found in Prisma — run the seed first`);
    return;
  }

  // 2. Find Supabase user
  const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
  const sbUser = users.find((u) => u.email === email);
  if (!sbUser) {
    console.error(`   ❌  Not found in Supabase Auth — run create-* script first`);
    return;
  }

  // 3. Sync metadata
  const metadata = metadataFn(dbUser);
  const { error } = await supabaseAdmin.auth.admin.updateUserById(sbUser.id, {
    user_metadata: metadata,
  });
  if (error) {
    console.error(`   ❌  Metadata update failed: ${error.message}`);
    return;
  }
  console.log(`   ✅  Supabase metadata updated: ${JSON.stringify(metadata)}`);

  // 4. Ensure Prisma has the supabaseUserId
  if (dbUser.supabaseUserId !== sbUser.id) {
    await prisma.user.update({
      where: { email },
      data: { supabaseUserId: sbUser.id },
    });
    console.log(`   ✅  Prisma supabaseUserId updated: ${sbUser.id}`);
  } else {
    console.log(`   ✓   Prisma supabaseUserId already correct`);
  }
}

async function main() {
  console.log("🚑  Auth metadata repair tool\n");

  // Super admin
  await fixUser("superadmin@servemytable.ca", () => ({
    name: "Super Admin",
    role: "super_admin",
    isActive: true,
  }));

  // Demo restaurant owner — extend trial 1 year
  const farFuture = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
  await fixUser("owner@saffronpalace.com", (dbUser) => ({
    name: dbUser.name,
    role: "restaurant_owner",
    isActive: true,
    restaurantId: dbUser.restaurantId,
    restaurantSlug: dbUser.restaurant?.slug ?? "saffron-palace",
    trialEndsAt: farFuture,
  }));

  console.log("\n🎉  Done! Both accounts should now be able to log in.");
  console.log(`   Super admin:   superadmin@servemytable.ca  /  Naman2019@`);
  console.log(`   Demo owner:    owner@saffronpalace.com     /  saffron2024`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); await pool.end(); });
