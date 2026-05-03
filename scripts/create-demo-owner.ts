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

const OWNER_EMAIL    = "owner@saffronpalace.com";
const OWNER_PASSWORD = "saffron2024";

async function main() {
  console.log("🔧  Creating Saffron Palace owner in Supabase Auth...\n");

  // Get the Prisma user + restaurant info
  const dbUser = await prisma.user.findUnique({
    where: { email: OWNER_EMAIL },
    include: { restaurant: { select: { id: true, slug: true, trialEndsAt: true } } },
  });

  if (!dbUser) {
    console.error("❌  Prisma user not found. Run the seed first.");
    process.exit(1);
  }

  // Check if already exists in Supabase
  const { data: existing } = await supabaseAdmin.auth.admin.listUsers();
  const alreadyExists = existing?.users?.find(u => u.email === OWNER_EMAIL);

  let supabaseUserId: string;

  if (alreadyExists) {
    console.log(`⚠️  Supabase user already exists: ${alreadyExists.id}`);
    supabaseUserId = alreadyExists.id;
  } else {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: OWNER_EMAIL,
      password: OWNER_PASSWORD,
      email_confirm: true,
      user_metadata: {
        name: dbUser.name,
        role: "restaurant_owner",
        isActive: true,
        restaurantId: dbUser.restaurantId,
        restaurantSlug: dbUser.restaurant?.slug ?? "saffron-palace",
        trialEndsAt: dbUser.restaurant?.trialEndsAt?.toISOString() ?? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      },
    });

    if (error || !data?.user) {
      console.error("❌  Failed to create Supabase user:", error?.message);
      process.exit(1);
    }

    supabaseUserId = data.user.id;
    console.log(`✅  Supabase user created: ${supabaseUserId}`);
  }

  // Link Prisma user with supabaseUserId
  await prisma.user.update({
    where: { email: OWNER_EMAIL },
    data: { supabaseUserId },
  });

  console.log(`✅  Prisma user linked with supabaseUserId`);
  console.log("\n🎉  Saffron Palace owner is ready!");
  console.log(`   Email:    ${OWNER_EMAIL}`);
  console.log(`   Password: ${OWNER_PASSWORD}`);
  console.log(`   Supabase ID: ${supabaseUserId}`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); await pool.end(); });
