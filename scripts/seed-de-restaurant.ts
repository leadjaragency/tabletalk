/**
 * seed-de-restaurant.ts
 *
 * Seeds the `de` PostgreSQL schema with a German demo restaurant.
 * Run with: npx tsx scripts/seed-de-restaurant.ts
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env for auth user creation.
 */

import path from "path";
import fs from "fs";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { createClient } from "@supabase/supabase-js";

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
// Prisma client pointing to de schema
// ---------------------------------------------------------------------------
const SESSION_URL = process.env.DATABASE_URL!
  .replace(":6543/", ":5432/")
  .replace("?pgbouncer=true", "");

const pool = new Pool({
  connectionString: SESSION_URL,
  ssl: { rejectUnauthorized: false },
});

pool.on("connect", (client) => {
  client.query("SET search_path = de");
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

// ---------------------------------------------------------------------------
// Supabase admin client
// ---------------------------------------------------------------------------
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const ago = (minutes: number) => new Date(Date.now() - minutes * 60 * 1000);
const daysAgo = (d: number) => new Date(Date.now() - d * 24 * 60 * 60 * 1000);
const daysFromNow = (d: number) => new Date(Date.now() + d * 24 * 60 * 60 * 1000);

function orderNum(prefix: string, n: number) {
  return `${prefix}-${String(n).padStart(4, "0")}`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log("🌱  Seeding German de schema...\n");

  // ── 1. Wipe existing de data ──────────────────────────────────────────
  console.log("🗑   Clearing existing de data...");
  await prisma.chatMessage.deleteMany();
  await prisma.chatSession.deleteMany();
  await prisma.gameResult.deleteMany();
  await prisma.review.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.tableSession.deleteMany();
  await prisma.promotion.deleteMany();
  await prisma.aPIUsageLog.deleteMany();
  await prisma.table.updateMany({ data: { waiterId: null } });
  await prisma.aIWaiter.deleteMany();
  await prisma.table.deleteMany();
  await prisma.dish.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
  await prisma.restaurant.deleteMany();
  await prisma.subscriptionTier.deleteMany();
  console.log("   ✓ Cleared\n");

  // ── 2. Subscription Tiers (DE schema copy) ────────────────────────────
  console.log("💳  Creating subscription tiers (DE)...");
  const [, tierStandard] = await Promise.all([
    prisma.subscriptionTier.create({
      data: {
        name: "Basic",
        maxTables: 15,
        maxWaiters: 1,
        maxTeamMembers: 2,
        monthlyPrice: 89,      // EUR pricing
        features: { games: false, analytics: false, posIntegration: false, customBranding: false },
      },
    }),
    prisma.subscriptionTier.create({
      data: {
        name: "Standard",
        maxTables: 50,
        maxWaiters: 3,
        maxTeamMembers: 5,
        monthlyPrice: 179,     // EUR pricing
        features: { games: true, analytics: true, posIntegration: false, customBranding: false },
      },
    }),
    prisma.subscriptionTier.create({
      data: {
        name: "Premium",
        maxTables: -1,
        maxWaiters: -1,
        maxTeamMembers: -1,
        monthlyPrice: 369,     // EUR pricing
        features: { games: true, analytics: true, posIntegration: true, customBranding: true },
      },
    }),
  ]);
  console.log("   ✓ Basic / Standard / Premium (EUR pricing)\n");

  // ── 3. Demo Restaurant: Zum Goldenen Hirsch ───────────────────────────
  console.log("🍺  Creating Zum Goldenen Hirsch...");
  const restaurant = await prisma.restaurant.create({
    data: {
      name: "Zum Goldenen Hirsch",
      slug: "zum-goldenen-hirsch",
      cuisine: "Bayerische Küche",
      tagline: "Herzliche Gastlichkeit seit 1887",
      phone: "+49 89 1234567",
      email: "info@zumgoldenenhirsch.de",
      address: "Maximilianstraße 28, 80539 München",
      hours: { open: "11:00", close: "23:00" },
      taxRate: 0.07,
      currency: "EUR",
      country: "DE",
      status: "active",
      tierId: tierStandard.id,
      trialStartsAt: daysAgo(30),
      trialEndsAt: daysFromNow(100),
    },
  });
  console.log(`   ✓ Restaurant created: ${restaurant.id}\n`);

  // ── 4. Create Supabase auth user for owner ────────────────────────────
  console.log("👤  Creating owner in Supabase Auth...");
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: "owner@zumgoldenenhirsch.de",
    password: "hirsch2024",
    email_confirm: true,
    user_metadata: {
      name: "Hans Bauer",
      role: "restaurant_owner",
      restaurantId: restaurant.id,
      isActive: true,
    },
  });

  let supabaseUserId: string | undefined;
  if (authError) {
    console.warn(`   ⚠  Supabase auth user might already exist: ${authError.message}`);
    // Try to find existing user
    const { data: listData } = await supabase.auth.admin.listUsers();
    const existing = listData?.users?.find((u) => u.email === "owner@zumgoldenenhirsch.de");
    supabaseUserId = existing?.id;
  } else {
    supabaseUserId = authData?.user?.id;
  }
  console.log(`   ✓ Supabase user: ${supabaseUserId ?? "(not created)"}\n`);

  // ── 5. Prisma User ────────────────────────────────────────────────────
  console.log("👤  Creating owner Prisma user...");
  await prisma.user.upsert({
    where: { email: "owner@zumgoldenenhirsch.de" },
    create: {
      email: "owner@zumgoldenenhirsch.de",
      name: "Hans Bauer",
      role: "restaurant_owner",
      restaurantId: restaurant.id,
      isActive: true,
      supabaseUserId: supabaseUserId ?? null,
    },
    update: {
      supabaseUserId: supabaseUserId ?? undefined,
      restaurantId: restaurant.id,
    },
  });
  console.log("   ✓ Hans Bauer (owner@zumgoldenenhirsch.de / hirsch2024)\n");

  // ── 6. Menu categories ────────────────────────────────────────────────
  console.log("📂  Creating categories...");
  const categories = await Promise.all([
    prisma.category.create({ data: { restaurantId: restaurant.id, name: "Vorspeisen", sortOrder: 1 } }),
    prisma.category.create({ data: { restaurantId: restaurant.id, name: "Suppen", sortOrder: 2 } }),
    prisma.category.create({ data: { restaurantId: restaurant.id, name: "Hauptgerichte", sortOrder: 3 } }),
    prisma.category.create({ data: { restaurantId: restaurant.id, name: "Beilagen", sortOrder: 4 } }),
    prisma.category.create({ data: { restaurantId: restaurant.id, name: "Desserts", sortOrder: 5 } }),
    prisma.category.create({ data: { restaurantId: restaurant.id, name: "Getränke", sortOrder: 6 } }),
  ]);
  const [catVorspeise, catSuppen, catHaupt, catBeilagen, catDesserts, catGetraenke] = categories;
  console.log("   ✓ 6 Kategorien\n");

  // ── 7. Menu dishes ────────────────────────────────────────────────────
  console.log("🍽   Creating dishes...");
  const dishes = await Promise.all([
    // Vorspeisen
    prisma.dish.create({ data: { restaurantId: restaurant.id, categoryId: catVorspeise.id, name: "Obazda", description: "Bayerische Käsecreme mit Zwiebeln, Kümmel und Radieschen, serviert mit Brezn", price: 8.90, imageEmoji: "🧀", isVeg: true, allergens: ["Milch", "Gluten", "Eier"], prepTime: 5, isChefPick: true, isPopular: true } }),
    prisma.dish.create({ data: { restaurantId: restaurant.id, categoryId: catVorspeise.id, name: "Leberknödelsuppe", description: "Hausgemachte Leberknödel in kräftiger Rinderbrühe", price: 7.50, imageEmoji: "🍲", allergens: ["Gluten", "Eier", "Milch"], prepTime: 10 } }),
    prisma.dish.create({ data: { restaurantId: restaurant.id, categoryId: catVorspeise.id, name: "Wurstsalat", description: "Münchner Wurst mit Zwiebeln, Essig und Öl", price: 9.50, imageEmoji: "🥗", allergens: ["Senf"], prepTime: 8, isPopular: true } }),

    // Suppen
    prisma.dish.create({ data: { restaurantId: restaurant.id, categoryId: catSuppen.id, name: "Gulaschsuppe", description: "Herzhafte Rindfleischsuppe mit Paprika und Kartoffeln", price: 8.90, imageEmoji: "🍲", allergens: ["Sellerie", "Gluten"], prepTime: 10, isChefPick: true } }),
    prisma.dish.create({ data: { restaurantId: restaurant.id, categoryId: catSuppen.id, name: "Hochzeitssuppe", description: "Klare Hühnerbrühe mit Grießnockerl und Eierstich", price: 7.50, imageEmoji: "🍵", allergens: ["Eier", "Gluten", "Milch"], prepTime: 8 } }),

    // Hauptgerichte
    prisma.dish.create({ data: { restaurantId: restaurant.id, categoryId: catHaupt.id, name: "Schweinshaxe", description: "Knusprige Schweinshaxe vom Grill mit Sauerkraut und Semmelknödel", price: 22.90, imageEmoji: "🍖", allergens: ["Gluten", "Milch", "Sellerie"], prepTime: 25, isChefPick: true, isPopular: true } }),
    prisma.dish.create({ data: { restaurantId: restaurant.id, categoryId: catHaupt.id, name: "Wiener Schnitzel", description: "Zarter Kalbsschnitzel in Semmelpanade, paniert und goldgelb gebraten", price: 24.90, imageEmoji: "🥩", allergens: ["Gluten", "Eier", "Milch"], prepTime: 18, isPopular: true } }),
    prisma.dish.create({ data: { restaurantId: restaurant.id, categoryId: catHaupt.id, name: "Sauerbraten", description: "Rheinischer Sauerbraten mit Rotkohl und Kartoffelklößen", price: 21.90, imageEmoji: "🥘", allergens: ["Gluten", "Sellerie"], prepTime: 20, isChefPick: true } }),
    prisma.dish.create({ data: { restaurantId: restaurant.id, categoryId: catHaupt.id, name: "Käsespätzle", description: "Hausgemachte Spätzle mit Bergkäse überbacken, mit Röstzwiebeln", price: 16.90, imageEmoji: "🍝", isVeg: true, allergens: ["Gluten", "Eier", "Milch"], prepTime: 15, isPopular: true } }),
    prisma.dish.create({ data: { restaurantId: restaurant.id, categoryId: catHaupt.id, name: "Forelle Müllerin Art", description: "Frische Forelle, in Butter gebraten, mit Mandeln, Zitrone und Petersilienkartoffeln", price: 19.90, imageEmoji: "🐟", allergens: ["Fisch", "Milch", "Gluten", "Nüsse"], prepTime: 20 } }),
    prisma.dish.create({ data: { restaurantId: restaurant.id, categoryId: catHaupt.id, name: "Gemüseschnitzel", description: "Knusprig paniertes Gemüseschnitzel mit Kräuterdip und Beilagensalat", price: 15.90, imageEmoji: "🥦", isVeg: true, isVegan: false, allergens: ["Gluten", "Eier", "Milch"], prepTime: 15 } }),

    // Beilagen
    prisma.dish.create({ data: { restaurantId: restaurant.id, categoryId: catBeilagen.id, name: "Semmelknödel", description: "Zwei hausgemachte Semmelknödel", price: 4.50, imageEmoji: "🫓", isVeg: true, allergens: ["Gluten", "Milch", "Eier"], prepTime: 8 } }),
    prisma.dish.create({ data: { restaurantId: restaurant.id, categoryId: catBeilagen.id, name: "Sauerkraut", description: "Bayerisches Sauerkraut mit Kümmel", price: 3.90, imageEmoji: "🥬", isVeg: true, isVegan: true, allergens: [], prepTime: 5 } }),
    prisma.dish.create({ data: { restaurantId: restaurant.id, categoryId: catBeilagen.id, name: "Kartoffelsalat", description: "Warmer Kartoffelsalat mit Gurken und Speck", price: 4.90, imageEmoji: "🥔", allergens: ["Senf", "Sellerie"], prepTime: 8 } }),

    // Desserts
    prisma.dish.create({ data: { restaurantId: restaurant.id, categoryId: catDesserts.id, name: "Kaiserschmarrn", description: "Fluffiger Kaiserschmarrn mit Zwetschgenröster und Puderzucker", price: 9.90, imageEmoji: "🥞", isVeg: true, allergens: ["Gluten", "Eier", "Milch"], prepTime: 15, isChefPick: true, isPopular: true } }),
    prisma.dish.create({ data: { restaurantId: restaurant.id, categoryId: catDesserts.id, name: "Apfelstrudel", description: "Knuspriger Apfelstrudel mit Vanillesauce und Sahne", price: 7.90, imageEmoji: "🍏", isVeg: true, allergens: ["Gluten", "Milch", "Eier"], prepTime: 10, isPopular: true } }),
    prisma.dish.create({ data: { restaurantId: restaurant.id, categoryId: catDesserts.id, name: "Schokoladenfondue", description: "Zartbitterschokolade mit frischen Früchten und Marshmallows", price: 10.90, imageEmoji: "🍫", isVeg: true, allergens: ["Milch", "Nüsse"], prepTime: 10 } }),

    // Getränke
    prisma.dish.create({ data: { restaurantId: restaurant.id, categoryId: catGetraenke.id, name: "Weißbier (0,5l)", description: "Frisch gezapftes bayerisches Hefeweizen", price: 4.50, imageEmoji: "🍺", allergens: ["Gluten"], prepTime: 2, isPopular: true } }),
    prisma.dish.create({ data: { restaurantId: restaurant.id, categoryId: catGetraenke.id, name: "Radler (0,5l)", description: "Bayerisches Bier mit Zitronenlimonade", price: 4.20, imageEmoji: "🍋", allergens: ["Gluten"], prepTime: 2 } }),
    prisma.dish.create({ data: { restaurantId: restaurant.id, categoryId: catGetraenke.id, name: "Apfelschorle (0,3l)", description: "Naturtrüber Apfelsaft mit Sprudelwasser", price: 3.50, imageEmoji: "🍎", isVeg: true, isVegan: true, allergens: [], prepTime: 1 } }),
    prisma.dish.create({ data: { restaurantId: restaurant.id, categoryId: catGetraenke.id, name: "Café mit Sahne", description: "Frisch gebrühter Kaffee mit geschlagener Sahne", price: 3.90, imageEmoji: "☕", isVeg: true, allergens: ["Milch"], prepTime: 3 } }),
    prisma.dish.create({ data: { restaurantId: restaurant.id, categoryId: catGetraenke.id, name: "Weißwein Grüner Veltliner (0,2l)", description: "Österreichischer Grüner Veltliner, frisch und mineralisch", price: 6.50, imageEmoji: "🥂", isVeg: true, isVegan: true, allergens: ["Schwefeloxide"], prepTime: 2 } }),
  ]);
  console.log(`   ✓ ${dishes.length} Gerichte\n`);

  // ── 8. Tables ─────────────────────────────────────────────────────────
  console.log("🪑  Creating tables...");
  await Promise.all([
    prisma.table.create({ data: { restaurantId: restaurant.id, number: 1, seats: 2, status: "empty" } }),
    prisma.table.create({ data: { restaurantId: restaurant.id, number: 2, seats: 2, status: "empty" } }),
    prisma.table.create({ data: { restaurantId: restaurant.id, number: 3, seats: 4, status: "empty" } }),
    prisma.table.create({ data: { restaurantId: restaurant.id, number: 4, seats: 4, status: "empty" } }),
    prisma.table.create({ data: { restaurantId: restaurant.id, number: 5, seats: 4, status: "empty" } }),
    prisma.table.create({ data: { restaurantId: restaurant.id, number: 6, seats: 4, status: "empty" } }),
    prisma.table.create({ data: { restaurantId: restaurant.id, number: 7, seats: 6, status: "empty" } }),
    prisma.table.create({ data: { restaurantId: restaurant.id, number: 8, seats: 6, status: "empty" } }),
    prisma.table.create({ data: { restaurantId: restaurant.id, number: 9, seats: 6, status: "empty" } }),
    prisma.table.create({ data: { restaurantId: restaurant.id, number: 10, seats: 8, status: "empty" } }),
    prisma.table.create({ data: { restaurantId: restaurant.id, number: 11, seats: 8, status: "empty" } }),
    prisma.table.create({ data: { restaurantId: restaurant.id, number: 12, seats: 10, status: "empty" } }),
  ]);
  console.log("   ✓ 12 Tische (2×2-Sitzer, 4×4-Sitzer, 3×6-Sitzer, 2×8-Sitzer, 1×10-Sitzer)\n");

  // ── 9. AI Waiters ─────────────────────────────────────────────────────
  console.log("🤖  Creating AI waiters...");
  const allTables = await prisma.table.findMany({ where: { restaurantId: restaurant.id }, orderBy: { number: "asc" } });

  const [waiterKlaus, waiterBrigitte] = await Promise.all([
    prisma.aIWaiter.create({
      data: {
        restaurantId: restaurant.id,
        name: "Klaus",
        avatar: "🧔",
        personality: "Herzlicher bayerischer Wirt mit Sinn für Humor und tiefem Wissen über die regionale Küche",
        tone: "friendly",
        languages: ["Deutsch", "English"],
        greeting: "Servus und herzlich willkommen im Zum Goldenen Hirsch! Ich bin Klaus, Ihr persönlicher KI-Kellner. Darf ich fragen, ob Sie Lebensmittelallergien oder besondere Wünsche haben?",
        isActive: true,
      },
    }),
    prisma.aIWaiter.create({
      data: {
        restaurantId: restaurant.id,
        name: "Brigitte",
        avatar: "👩‍🍳",
        personality: "Professionelle und warmherzige Servicekraft mit Leidenschaft für traditionelle bayerische Küche",
        tone: "professional",
        languages: ["Deutsch", "English", "Français"],
        greeting: "Grüß Gott! Ich bin Brigitte und freue mich, Sie heute zu bedienen. Haben Sie besondere Ernährungswünsche oder Allergien, die ich berücksichtigen soll?",
        isActive: true,
      },
    }),
  ]);
  console.log("   ✓ Klaus & Brigitte\n");

  // Assign waiters to tables
  const tisch1to6 = allTables.slice(0, 6).map((t: { id: string }) => t.id);
  const tisch7to12 = allTables.slice(6).map((t: { id: string }) => t.id);

  await Promise.all([
    ...tisch1to6.map((id: string) => prisma.table.update({ where: { id }, data: { waiterId: waiterKlaus.id } })),
    ...tisch7to12.map((id: string) => prisma.table.update({ where: { id }, data: { waiterId: waiterBrigitte.id } })),
  ]);
  console.log("   ✓ Klaus → Tische 1-6 | Brigitte → Tische 7-12\n");

  // ── 10. Promotions ────────────────────────────────────────────────────
  console.log("🏷   Creating promotions...");
  await Promise.all([
    prisma.promotion.create({
      data: {
        restaurantId: restaurant.id,
        title: "Mittagsmenü",
        description: "3-Gänge-Mittagsmenü von 11 bis 14 Uhr",
        type: "percentage",
        value: 15,
        validFrom: daysAgo(30),
        validUntil: daysFromNow(60),
        isActive: true,
      },
    }),
    prisma.promotion.create({
      data: {
        restaurantId: restaurant.id,
        title: "Stammgast-Rabatt",
        description: "10% für alle Stammgäste mit Treuekarte",
        type: "percentage",
        value: 10,
        validFrom: daysAgo(90),
        validUntil: daysFromNow(90),
        isActive: true,
      },
    }),
    prisma.promotion.create({
      data: {
        restaurantId: restaurant.id,
        title: "Geburtstagsüberraschung",
        description: "Kaiserschmarrn gratis zum Geburtstag",
        type: "freeItem",
        value: 0,
        freeItemId: dishes[14]?.id, // Kaiserschmarrn
        minOrder: 20,
        validFrom: daysAgo(60),
        validUntil: daysFromNow(120),
        isActive: false,
      },
    }),
  ]);
  console.log("   ✓ 3 Aktionen\n");

  // ── 11. Sample orders ─────────────────────────────────────────────────
  console.log("📋  Creating sample orders...");
  const sampleTable = allTables[2]!; // Tisch 3
  const session = await prisma.tableSession.create({
    data: {
      restaurantId: restaurant.id,
      tableId: sampleTable.id,
      guestCount: 2,
      startedAt: ago(45),
    },
  });

  const schweinshaxe = dishes.find((d: { name: string }) => d.name === "Schweinshaxe")!;
  const kaesespaetzle = dishes.find((d: { name: string }) => d.name === "Käsespätzle")!;
  const weissbier = dishes.find((d: { name: string }) => d.name === "Weißbier (0,5l)")!;

  const order = await prisma.order.create({
    data: {
      restaurantId: restaurant.id,
      tableId: sampleTable.id,
      sessionId: session.id,
      orderNumber: orderNum("GH", 1),
      subtotal: schweinshaxe.price + kaesespaetzle.price + weissbier.price * 2,
      tax: Math.round((schweinshaxe.price + kaesespaetzle.price + weissbier.price * 2) * 0.07 * 100) / 100,
      total: Math.round((schweinshaxe.price + kaesespaetzle.price + weissbier.price * 2) * 1.07 * 100) / 100,
      status: "preparing",
      createdAt: ago(30),
    },
  });

  await Promise.all([
    prisma.orderItem.create({ data: { orderId: order.id, dishId: schweinshaxe.id, quantity: 1, unitPrice: schweinshaxe.price } }),
    prisma.orderItem.create({ data: { orderId: order.id, dishId: kaesespaetzle.id, quantity: 1, unitPrice: kaesespaetzle.price } }),
    prisma.orderItem.create({ data: { orderId: order.id, dishId: weissbier.id, quantity: 2, unitPrice: weissbier.price } }),
  ]);
  await prisma.table.update({ where: { id: sampleTable.id }, data: { status: "ordering" } });
  console.log("   ✓ 1 Musterbestellung (Tisch 3)\n");

  // ── 12. Sample reviews ────────────────────────────────────────────────
  console.log("⭐  Creating sample reviews...");
  await prisma.review.create({
    data: {
      restaurantId: restaurant.id,
      sessionId: session.id,
      rating: 5,
      comment: "Die Schweinshaxe war absolut fantastisch! Knusprig außen, saftig innen. Klaus war ein aufmerksamer und freundlicher Kellner. Wir kommen definitiv wieder!",
      createdAt: ago(15),
    },
  });
  console.log("   ✓ 1 Bewertung\n");

  console.log("─".repeat(50));
  console.log("🎉  Zum Goldenen Hirsch erfolgreich angelegt!\n");
  console.log("   Restaurant-Slug:  zum-goldenen-hirsch");
  console.log("   Owner-Login:      owner@zumgoldenenhirsch.de / hirsch2024");
  console.log("   Kunden-URL:       de.servemytable.ca/table/1?restaurant=zum-goldenen-hirsch");
  console.log("─".repeat(50));
}

main()
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
