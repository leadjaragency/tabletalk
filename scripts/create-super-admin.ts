import path from "path";
import fs from "fs";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { createClient } from "@supabase/supabase-js";

// Load .env
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

const SUPER_ADMIN_EMAIL = "superadmin@servemytable.ca";
const SUPER_ADMIN_PASSWORD = "Naman2019@";

async function main() {
  console.log("🔧  Creating super admin in Supabase Auth...\n");

  // Check if already exists in Supabase
  const { data: existing } = await supabaseAdmin.auth.admin.listUsers();
  const alreadyExists = existing?.users?.find(u => u.email === SUPER_ADMIN_EMAIL);

  let supabaseUserId: string;

  if (alreadyExists) {
    console.log(`⚠️  Supabase user already exists: ${alreadyExists.id}`);
    supabaseUserId = alreadyExists.id;
  } else {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: SUPER_ADMIN_EMAIL,
      password: SUPER_ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: {
        name: "Super Admin",
        role: "super_admin",
        isActive: true,
      },
    });

    if (error || !data?.user) {
      console.error("❌  Failed to create Supabase user:", error?.message);
      process.exit(1);
    }

    supabaseUserId = data.user.id;
    console.log(`✅  Supabase user created: ${supabaseUserId}`);
  }

  // Update Prisma User with supabaseUserId
  const updated = await prisma.user.updateMany({
    where: { email: SUPER_ADMIN_EMAIL },
    data: { supabaseUserId },
  });

  if (updated.count === 0) {
    console.error("❌  Prisma user not found. Run the seed first.");
    process.exit(1);
  }

  console.log(`✅  Prisma user updated with supabaseUserId`);
  console.log("\n🎉  Super admin is ready!");
  console.log(`   Email:    ${SUPER_ADMIN_EMAIL}`);
  console.log(`   Password: ${SUPER_ADMIN_PASSWORD}`);
  console.log(`   Supabase ID: ${supabaseUserId}`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); await pool.end(); });
