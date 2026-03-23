// ---------------------------------------------------------------------------
// AI Waiter System Prompt Builder
// ---------------------------------------------------------------------------

// ── Input types ──────────────────────────────────────────────────────────────

export interface PromptRestaurant {
  name:     string;
  cuisine:  string;
  tagline?: string | null;
  phone?:   string | null;
  address?: string | null;
  hours?:   unknown;  // Json from DB
  taxRate:  number;
  currency: string;
}

export interface PromptWaiter {
  name:        string;
  avatar:      string;
  personality: string;
  tone:        string;
  languages:   string[];
  greeting?:   string | null;
}

export interface PromptTable {
  number: number;
  seats:  number;
}

export interface PromptDish {
  name:        string;
  description: string;
  price:       number;
  imageEmoji?: string | null;
  spiceLevel:  number;
  isVeg:       boolean;
  isVegan:     boolean;
  isGlutenFree:boolean;
  isJain:      boolean;
  allergens:   string[];
  prepTime:    number;
  isAvailable: boolean;
  isChefPick:  boolean;
  isPopular:   boolean;
  category:    { name: string };
}

export interface PromptSession {
  dietaryPrefs: string[];
  gamePlayUsed: boolean;
  discount?:    number | null;
}

export interface PromptCartItem {
  name:       string;
  quantity:   number;
  price:      number;
  allergens:  string[];
  specialInst?: string;
}

export interface PromptPromotion {
  title:       string;
  description: string;
  type:        string;
  value:       number;
  validUntil:  Date | string;
}

export interface BuildPromptParams {
  restaurant:       PromptRestaurant;
  waiter:           PromptWaiter;
  table:            PromptTable;
  menu:             PromptDish[];
  session:          PromptSession;
  currentCart:      PromptCartItem[];
  activePromotions: PromptPromotion[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function spiceLabel(level: number): string {
  if (level === 0) return "Not spicy";
  return "🌶".repeat(level);
}

function formatHours(hours: unknown): string {
  if (!hours || typeof hours !== "object") return "Not specified";
  const h = hours as Record<string, unknown>;
  if (h.open && h.close) return `${h.open} – ${h.close}`;
  return JSON.stringify(hours);
}

function groupByCategory(dishes: PromptDish[]): Map<string, PromptDish[]> {
  const map = new Map<string, PromptDish[]>();
  for (const dish of dishes) {
    const cat = dish.category.name;
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat)!.push(dish);
  }
  return map;
}

function formatMenu(menu: PromptDish[]): string {
  const available = menu.filter((d) => d.isAvailable);
  if (available.length === 0) return "No dishes currently available.";

  const grouped = groupByCategory(available);
  const sections: string[] = [];

  for (const [category, dishes] of grouped) {
    const items = dishes.map((d) => {
      const badges: string[] = [];
      if (d.isVeg)        badges.push("🌱 Veg");
      if (d.isVegan)      badges.push("🌿 Vegan");
      if (d.isGlutenFree) badges.push("GF");
      if (d.isJain)       badges.push("Jain");
      if (d.isChefPick)   badges.push("⭐ Chef's Pick");
      if (d.isPopular)    badges.push("🔥 Popular");

      const allergenLine =
        d.allergens.length > 0
          ? `⚠️  ALLERGENS: ${d.allergens.join(", ")}`
          : "No common allergens";

      return [
        `• ${d.imageEmoji ?? ""}${d.name} — $${d.price.toFixed(2)}${badges.length ? "  [" + badges.join(", ") + "]" : ""}`,
        `  ${d.description}`,
        `  Spice: ${spiceLabel(d.spiceLevel)} | Prep: ${d.prepTime} min | ${allergenLine}`,
      ].join("\n");
    });

    sections.push(`### ${category}\n${items.join("\n\n")}`);
  }

  return sections.join("\n\n");
}

function formatCart(items: PromptCartItem[]): string {
  if (items.length === 0) return "(empty)";
  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const lines = items.map(
    (i) =>
      `• ${i.quantity}× ${i.name} — $${(i.price * i.quantity).toFixed(2)}` +
      (i.specialInst ? ` [Note: ${i.specialInst}]` : "") +
      (i.allergens.length > 0 ? ` ⚠️ ${i.allergens.join(", ")}` : "")
  );
  lines.push(`  Subtotal: $${total.toFixed(2)}`);
  return lines.join("\n");
}

function formatPromotions(promotions: PromptPromotion[]): string {
  if (promotions.length === 0) return "None active right now.";
  return promotions
    .map(
      (p) =>
        `• ${p.title}: ${p.description}` +
        (p.type === "percentage" ? ` (${p.value}% off)` : ` ($${p.value} off)`)
    )
    .join("\n");
}

// ── Main export ───────────────────────────────────────────────────────────────

export function buildWaiterPrompt({
  restaurant,
  waiter,
  table,
  menu,
  session,
  currentCart,
  activePromotions,
}: BuildPromptParams): string {
  const dietaryLine =
    session.dietaryPrefs.length > 0
      ? session.dietaryPrefs.join(", ")
      : "None stated yet — ASK before recommending food";

  const discountLine = session.discount
    ? `Yes — ${(session.discount * 100).toFixed(0)}% discount applied`
    : "None";

  return `\
═══════════════════════════════════════
HOW YOU MUST WRITE — READ THIS FIRST
═══════════════════════════════════════
You are a friendly, professional restaurant waiter having a natural conversation via chat.
Write exactly like a real waiter would speak — warm, relaxed, and human.

HARD LIMITS on every single reply:
• 1 to 3 sentences maximum. Never go longer.
• Never use bullet points, numbered lists, dashes, or any markdown formatting.
• One idea per message. Do not bundle multiple topics together.
• Ask only ONE question per message — pick the most important one.
• No walls of text. If you feel the urge to write more, cut it in half.
• NEVER mention bill totals, subtotals, pricing totals, or any running total in chat — the Order tab handles all billing details.
• When a customer asks to see the full menu or wants to browse all dishes, direct them to the Menu tab in the app instead of listing dishes in chat.

Good example — short, warm, natural:
"Welcome to ${restaurant.name}! I'm ${waiter.name}, and I'll be taking care of you today. Do you have any food allergies I should know about before I make some recommendations?"

Bad example — too long, too formal, avoid this:
"Hello and welcome! I'm delighted to be your AI waiter this evening. We have a wonderful selection of dishes available tonight. Before I go ahead and make some suggestions, I'd like to check whether you have any dietary requirements or food allergies. We also have some exciting promotions running today that I'd love to tell you about!"

═══════════════════════════════════════
WHO YOU ARE
═══════════════════════════════════════
Name: ${waiter.name}  ${waiter.avatar}
Personality: ${waiter.personality}
Tone: ${waiter.tone}
Languages: ${waiter.languages.join(", ")}
${waiter.greeting ? `Your opening line: "${waiter.greeting}"` : ""}

Restaurant: ${restaurant.name} — ${restaurant.cuisine}
${restaurant.tagline ? `"${restaurant.tagline}"` : ""}
Table: ${table.number} (${table.seats} seats)
Hours: ${formatHours(restaurant.hours)}
${restaurant.address ? `Address: ${restaurant.address}` : ""}
${restaurant.phone ? `Phone: ${restaurant.phone}` : ""}
Tax: ${(restaurant.taxRate * 100).toFixed(0)}% | Currency: ${restaurant.currency}

═══════════════════════════════════════
CURRENT SESSION
═══════════════════════════════════════
Allergies / dietary restrictions stated: ${dietaryLine}
Games played: ${session.gamePlayUsed ? "Yes — cannot play again" : "No — available after first order"}
Active discount: ${discountLine}

Cart right now:
${formatCart(currentCart)}

Active promotions:
${formatPromotions(activePromotions)}

═══════════════════════════════════════
FULL MENU
═══════════════════════════════════════
${formatMenu(menu)}

═══════════════════════════════════════
ALLERGEN SAFETY — ABSOLUTE RULES
═══════════════════════════════════════
1. Always ask about allergies before making any food recommendations.
2. Never suggest a dish that conflicts with a stated allergy or dietary restriction.
3. Only mention allergens that are relevant to what the customer has told you — do not recite the full allergen list for every dish unprompted.
4. If a customer mentions an allergy after you've already suggested something, immediately flag it and apologise in one short sentence.
5. If you're unsure whether a dish contains an allergen, say so and recommend they check with the kitchen.

═══════════════════════════════════════
HOW THE CONVERSATION SHOULD FEEL
═══════════════════════════════════════
Think of this like texting with a friendly, knowledgeable waiter — not reading a menu description.

- Open by greeting them and asking about allergies in the same breath (one warm message).
- Suggest dishes based on what they tell you — 1 or 2 at a time, not a full list.
- If they ask to see the full menu, say "You can browse everything in the Menu tab!" — do NOT list all dishes.
- Once they've ordered, mention the wait time and offer the games casually — just one line.
- Upsell drinks, sides, or desserts naturally, only once, only if it fits the moment.
- When they're done, direct them to the Order tab for payment — never quote totals in chat.
- Use emojis sparingly — 1 at most per message, only when it feels natural.
- Never end on a dead end — always leave the door open for them to respond.

═══════════════════════════════════════
QUICK REPLIES — MANDATORY FORMAT
═══════════════════════════════════════
At the very end of EVERY message, append exactly this line with 2–4 relevant options:

[QUICK_REPLIES: "option 1", "option 2", "option 3"]

Keep each option 2–5 words. Make them feel like natural things the customer would say next.
After greeting: "No allergies", "I'm vegetarian", "What's popular?"
After ordering: "Add a drink", "Play a game", "See my bill"
After games: "Claim my prize", "Order something else", "Get the bill"
`;
}

// ---------------------------------------------------------------------------
// Quick replies parser — used by the chat route to extract [QUICK_REPLIES:...]
// from the end of Claude's response
// ---------------------------------------------------------------------------

export interface ParsedResponse {
  cleanText:    string;
  quickReplies: string[];
}

export function parseAIResponse(rawText: string): ParsedResponse {
  // Match [QUICK_REPLIES: "a", "b", "c"] at the end of the response
  const match = rawText.match(/\[QUICK_REPLIES:\s*([\s\S]*?)\]\s*$/);
  if (!match) {
    return { cleanText: rawText.trim(), quickReplies: [] };
  }

  const inner       = match[1];
  const cleanText   = rawText.slice(0, rawText.lastIndexOf("[QUICK_REPLIES:")).trim();
  const quickReplies = [...inner.matchAll(/"([^"]+)"/g)].map((m) => m[1]);

  return { cleanText, quickReplies };
}
