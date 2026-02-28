// ---------------------------------------------------------------------------
// Allergen list (matches Dish.allergens[] in schema)
// ---------------------------------------------------------------------------

export const ALLERGENS = [
  "Dairy",
  "Nuts",
  "Gluten",
  "Shellfish",
  "Soy",
  "Eggs",
  "Fish",
  "Wheat",
  "Sesame",
  "Mustard",
] as const;

export type Allergen = (typeof ALLERGENS)[number];

// ---------------------------------------------------------------------------
// Food emojis for the dish image picker
// ---------------------------------------------------------------------------

export const FOOD_EMOJIS = [
  // Mains
  "🍛", "🍚", "🍜", "🍝", "🥘", "🫕", "🍲", "🥗",
  "🥙", "🌮", "🌯", "🫔", "🥪", "🧆", "🫓",
  // Proteins
  "🥩", "🍗", "🍖", "🐟", "🦐", "🦞", "🦑", "🍤",
  // Dairy & egg
  "🧀", "🥚", "🥛",
  // Veg
  "🥦", "🥬", "🥕", "🧅", "🧄", "🌽", "🫑",
  // Snacks / Asian
  "🥜", "🍱", "🍣", "🥮", "🫙",
  // Sweets
  "🍰", "🧁", "🍮", "🍨", "🍧", "🍦", "🍩", "🍪",
  // Drinks
  "☕", "🍵", "🧃", "🥤", "🍺", "🥂", "🧋", "🍹",
] as const;

// ---------------------------------------------------------------------------
// Spice levels
// ---------------------------------------------------------------------------

export const SPICE_LABELS: Record<number, string> = {
  0: "Not spicy",
  1: "Mild",
  2: "Medium",
  3: "Hot",
  4: "Very Hot",
  5: "Extra Hot",
};

// ---------------------------------------------------------------------------
// Order statuses
// ---------------------------------------------------------------------------

export const ORDER_STATUSES = ["received", "preparing", "ready", "served"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

// ---------------------------------------------------------------------------
// Game prizes
// ---------------------------------------------------------------------------

export const GAME_PRIZES = [
  "5% OFF",
  "10% OFF",
  "15% OFF",
  "Free Dessert",
  "Free Drink",
  "Better Luck Next Time",
] as const;

// ---------------------------------------------------------------------------
// AI Waiter — personality presets
// ---------------------------------------------------------------------------

export const WAITER_PERSONALITIES = [
  { value: "Friendly & Warm",        label: "Friendly & Warm",        description: "Cheerful, approachable, uses light humour" },
  { value: "Professional & Polished", label: "Professional & Polished", description: "Crisp, knowledgeable, formal but never stiff" },
  { value: "Playful & Energetic",     label: "Playful & Energetic",     description: "Fun, enthusiastic, loves a good joke" },
  { value: "Calm & Elegant",          label: "Calm & Elegant",          description: "Soft-spoken, refined, fine-dining tone" },
] as const;

export type WaiterPersonality = (typeof WAITER_PERSONALITIES)[number]["value"];

export const WAITER_TONES = [
  { value: "friendly", label: "Friendly" },
  { value: "formal",   label: "Formal"   },
  { value: "playful",  label: "Playful"  },
] as const;

export type WaiterTone = (typeof WAITER_TONES)[number]["value"];

export const WAITER_LANGUAGES = [
  "English", "Hindi", "Tamil", "Telugu", "Kannada",
  "Bengali", "Marathi", "Gujarati", "Punjabi",
  "French", "Spanish", "Arabic", "Mandarin", "Japanese",
] as const;

export type WaiterLanguage = (typeof WAITER_LANGUAGES)[number];

// ---------------------------------------------------------------------------
// AI Waiter — avatar emoji presets
// ---------------------------------------------------------------------------

export const WAITER_AVATARS = [
  "👨‍🍳", "👩‍🍳", "🧑‍🍳", "👨‍💼", "👩‍💼",
  "🧑‍💼", "🤵",  "💂",  "🧙",  "🧝",
  "🦸",  "🧚",  "🎩",  "👸",  "🫅",
  "🧑‍🎤", "👮",  "🧑‍🚀", "🪄",  "⭐",
] as const;

// ---------------------------------------------------------------------------
// Indian Food Trivia (used by /api/games/trivia and the games page)
// ---------------------------------------------------------------------------

export interface TriviaQuestion {
  question: string;
  options:  [string, string, string, string];
  correct:  0 | 1 | 2 | 3;
}

export const TRIVIA_QUESTIONS: TriviaQuestion[] = [
  { question: "Which spice gives turmeric its characteristic yellow colour?",         options: ["Curcumin", "Capsaicin", "Piperine", "Lycopene"],                                     correct: 0 },
  { question: "What does 'paneer' mean in Hindi?",                                    options: ["Cheese", "Cream", "Curd", "Butter"],                                                 correct: 0 },
  { question: "Which Indian bread is baked in a tandoor oven?",                       options: ["Naan", "Roti", "Puri", "Paratha"],                                                   correct: 0 },
  { question: "What is the main ingredient in Dal Makhani?",                          options: ["Black lentils", "Red lentils", "Chickpeas", "Split peas"],                           correct: 0 },
  { question: "Biryani originated in which part of the world?",                       options: ["Persia / Middle East", "China", "South India", "Central Asia"],                      correct: 0 },
  { question: "Which city is famous for the original Butter Chicken recipe?",         options: ["Delhi", "Mumbai", "Kolkata", "Chennai"],                                             correct: 0 },
  { question: "What spice is known as 'the king of spices'?",                         options: ["Black pepper", "Cardamom", "Saffron", "Cumin"],                                      correct: 0 },
  { question: "Vindaloo is a dish originating from which Indian state?",              options: ["Goa", "Kerala", "Maharashtra", "Rajasthan"],                                         correct: 0 },
  { question: "What is 'ghee'?",                                                      options: ["Clarified butter", "Coconut oil", "Mustard oil", "Sesame oil"],                      correct: 0 },
  { question: "Which lentil is used to make traditional yellow dal?",                 options: ["Toor dal", "Urad dal", "Chana dal", "Masoor dal"],                                   correct: 0 },
  { question: "What gives Kashmiri food its distinctive red colour?",                 options: ["Kashmiri red chilli", "Tomato puree", "Paprika", "Annatto"],                         correct: 0 },
  { question: "Sambar is a lentil-based dish most popular in which region?",          options: ["South India", "North India", "East India", "West India"],                            correct: 0 },
  { question: "Which spice blend literally means 'hot spice mixture' in Hindi?",      options: ["Garam masala", "Chaat masala", "Tandoori masala", "Curry powder"],                   correct: 0 },
  { question: "Raita combines yogurt with what?",                                     options: ["Vegetables or fruit", "Lentils", "Bread", "Meat"],                                   correct: 0 },
  { question: "Lassi is a traditional Indian drink made from which base?",            options: ["Yogurt", "Milk", "Coconut milk", "Buttermilk"],                                      correct: 0 },
  { question: "Which Indian flatbread puffs up when deep-fried in oil?",             options: ["Puri", "Chapati", "Kulcha", "Naan"],                                                 correct: 0 },
  { question: "A 'tadka' in Indian cooking refers to what technique?",                options: ["Tempering spices in hot oil", "A cooling yogurt sauce", "A rice dish", "A bread type"], correct: 0 },
  { question: "Which spice is the most expensive in the world, used in fine biryani?",options: ["Saffron", "Cardamom", "Vanilla", "Turmeric"],                                       correct: 0 },
  { question: "Chole Bhature is a famous dish from which Indian state?",              options: ["Punjab", "Tamil Nadu", "West Bengal", "Gujarat"],                                    correct: 0 },
  { question: "Which region of India is known for its use of coconut in cooking?",   options: ["Kerala", "Rajasthan", "Uttar Pradesh", "Haryana"],                                   correct: 0 },
];

// ---------------------------------------------------------------------------
// Default subscription tier limits (used for UI hints)
// ---------------------------------------------------------------------------

export const TIER_DEFAULTS = {
  basic:    { maxTables: 15,  maxWaiters: 1,  maxTeamMembers: 2,  monthlyPrice: 99  },
  standard: { maxTables: 50,  maxWaiters: 3,  maxTeamMembers: 5,  monthlyPrice: 199 },
  premium:  { maxTables: -1,  maxWaiters: -1, maxTeamMembers: -1, monthlyPrice: 399 },
} as const;
