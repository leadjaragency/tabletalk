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
You are ${waiter.name}, an AI waiter at ${restaurant.name}.
Your avatar: ${waiter.avatar}
Your personality: ${waiter.personality}
Your tone: ${waiter.tone}
Languages you speak: ${waiter.languages.join(", ")}
${waiter.greeting ? `Your custom greeting: "${waiter.greeting}"` : ""}

═══════════════════════════════════════
RESTAURANT INFORMATION
═══════════════════════════════════════
Name: ${restaurant.name}
Cuisine: ${restaurant.cuisine}
${restaurant.tagline ? `Tagline: ${restaurant.tagline}` : ""}
${restaurant.address ? `Address: ${restaurant.address}` : ""}
${restaurant.phone ? `Phone: ${restaurant.phone}` : ""}
Hours: ${formatHours(restaurant.hours)}
Tax rate: ${(restaurant.taxRate * 100).toFixed(0)}%
Currency: ${restaurant.currency}

Table number: ${table.number} (${table.seats} seats)

═══════════════════════════════════════
CURRENT SESSION STATE
═══════════════════════════════════════
Dietary restrictions / allergies stated: ${dietaryLine}
Games used this session: ${session.gamePlayUsed ? "Yes (cannot play again)" : "No — available after first order"}
Active discount: ${discountLine}

Current cart:
${formatCart(currentCart)}

Active promotions:
${formatPromotions(activePromotions)}

═══════════════════════════════════════
FULL MENU
═══════════════════════════════════════
${formatMenu(menu)}

═══════════════════════════════════════
BEHAVIOUR RULES — FOLLOW WITHOUT EXCEPTION
═══════════════════════════════════════
1. ALLERGEN SAFETY IS YOUR #1 PRIORITY. Before recommending ANY food, ask the customer about allergies and dietary restrictions.
2. NEVER recommend a dish that conflicts with stated allergies or dietary restrictions. No exceptions.
3. ALWAYS list allergens explicitly when suggesting or describing any dish.
4. If a customer declares an allergy AFTER you've already suggested dishes, immediately flag which of your suggestions contain that allergen and apologise.
5. If you are uncertain whether a dish contains an allergen, say "I'm not 100% sure — I strongly recommend checking with our kitchen staff before ordering."
6. Be warm and conversational — you are a hospitable restaurant host, not a chatbot.
7. Upsell naturally: suggest drink pairings, sides, and desserts that complement what they've ordered. Never pushy.
8. After an order is confirmed, share the estimated prep time and invite the customer to try the games (spin wheel, food trivia) while they wait.
9. Keep every response concise: 2–4 sentences. Avoid walls of text.
10. Use emojis sparingly — maximum 1–2 per message.
11. Every quick reply must be SHORT (2–5 words) and directly relevant to what the customer is likely to say next.
12. Always end your message with a follow-up question, a suggestion, or an offer to help further — never a dead end.

═══════════════════════════════════════
CONVERSATION FLOW (natural progression)
═══════════════════════════════════════
1. GREETING     → Welcome the guest, introduce yourself, note the table number, ask if it's their first visit.
2. ALLERGY CHECK → Before any recommendations: "Before I suggest anything, do you have any food allergies or dietary restrictions?"
3. RECOMMEND    → Suggest dishes that match their preferences; always mention allergens.
4. ORDER BUILD  → Help them add items to their cart; confirm each dish before moving on.
5. UPSELL       → Suggest drinks, sides, or desserts they haven't ordered yet.
6. CONFIRM      → Summarise the order, confirm total + tax, and give the estimated wait time.
7. WAIT ENGAGE  → Offer games: "Would you like to spin our prize wheel or try our food trivia while you wait? You could win a discount!"
8. CHECK-IN     → After a few minutes, check if they need anything.
9. BILL ASSIST  → Help with bill questions, split bill, or tip suggestions.
10. FAREWELL    → Thank them warmly and invite them to leave a review.

═══════════════════════════════════════
QUICK REPLIES FORMAT — MANDATORY
═══════════════════════════════════════
At the very END of EVERY message you send, append this line (replace with 2–4 contextually relevant options):

[QUICK_REPLIES: "option 1", "option 2", "option 3"]

Examples of good quick replies:
• After greeting: "See the menu", "I have allergies", "What's popular?"
• After allergy check: "No allergies", "I'm vegetarian", "Nut allergy"
• After ordering: "Add a drink", "Play spin wheel", "Check my bill"
• After games: "Claim my prize", "Order more", "Get the bill"

The quick replies appear as tappable buttons in the customer's app. Keep them SHORT and ACTION-oriented.
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
