import path from "path";
import fs from "fs";
import { Pool } from "pg";

// ---------------------------------------------------------------------------
// Load env
// ---------------------------------------------------------------------------
function loadEnv() {
  const files = [
    path.resolve(__dirname, "../.env.local"),
    path.resolve(__dirname, "../.env"),
  ];
  for (const file of files) {
    if (!fs.existsSync(file)) continue;
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
}
loadEnv();

// ---------------------------------------------------------------------------
// Use session pooler (port 5432) — migrations require advisory locks
// ---------------------------------------------------------------------------
const SESSION_URL = process.env.DATABASE_URL!
  .replace(":6543/", ":5432/")
  .replace("?pgbouncer=true", "");

async function main() {
  const pool = new Pool({
    connectionString: SESSION_URL,
    ssl: { rejectUnauthorized: false },
  });

  const client = await pool.connect();
  console.log("✓ Connected to Supabase\n");

  try {
    // 1. Create the de schema
    await client.query(`CREATE SCHEMA IF NOT EXISTS de`);
    console.log("✓ Schema 'de' created\n");

    // 2. Set search_path so all subsequent DDL targets the de schema
    await client.query(`SET search_path = de`);

    // 3. Run all migrations in order
    const migrations = [
      "20260222155219_init",
      "20260503000000_add_supabase_fields",
      "20260504000000_add_table_merge",
      "20260521025508_add_country_field",
    ];

    for (const name of migrations) {
      const sqlPath = path.resolve(
        __dirname,
        `../prisma/migrations/${name}/migration.sql`
      );
      const sql = fs.readFileSync(sqlPath, "utf-8");

      // Wrap in a transaction per migration
      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query("COMMIT");
        console.log(`✓ Applied migration: ${name}`);
      } catch (err: any) {
        await client.query("ROLLBACK");
        // "already exists" errors are expected on re-runs — treat as warnings
        if (
          err.message.includes("already exists") ||
          err.message.includes("duplicate")
        ) {
          console.warn(`  ⚠  ${name}: skipped (already applied)`);
        } else {
          throw err;
        }
      }
    }

    // 4. Set default taxRate to 7% for German schema
    await client.query(
      `ALTER TABLE "Restaurant" ALTER COLUMN "taxRate" SET DEFAULT 0.07`
    );
    await client.query(
      `ALTER TABLE "Restaurant" ALTER COLUMN "currency" SET DEFAULT 'EUR'`
    );
    await client.query(
      `ALTER TABLE "Restaurant" ALTER COLUMN "country" SET DEFAULT 'DE'`
    );
    console.log("\n✓ Updated DE schema defaults (taxRate=0.07, currency=EUR, country=DE)");

    console.log("\n🎉  de schema setup complete. German restaurants will use this schema.");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("❌ Setup failed:", err.message);
  process.exit(1);
});
