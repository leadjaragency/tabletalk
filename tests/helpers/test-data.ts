/**
 * Seeded demo constants — must match prisma/seed.ts values.
 * Update these if seed data changes.
 */

export const SUPER_ADMIN_EMAIL = 'superadmin@servemytable.ca';
export const SUPER_ADMIN_PASSWORD = 'Naman2019@';

export const RESTAURANT_OWNER_EMAIL = 'owner@saffronpalace.com';
export const RESTAURANT_OWNER_PASSWORD = 'saffron2024';

export const DEMO_RESTAURANT_SLUG = 'saffron-palace';
export const DEMO_RESTAURANT_NAME = 'Saffron Palace';

// Table 1 is the first seeded table in Saffron Palace
export const DEMO_TABLE_NUMBER = 1;

// Customer URL for table 1
export const CUSTOMER_TABLE_URL = `/table/${DEMO_TABLE_NUMBER}?restaurant=${DEMO_RESTAURANT_SLUG}`;
export const CUSTOMER_CHAT_URL = `/table/${DEMO_TABLE_NUMBER}/chat?restaurant=${DEMO_RESTAURANT_SLUG}`;
export const CUSTOMER_MENU_URL = `/table/${DEMO_TABLE_NUMBER}/menu?restaurant=${DEMO_RESTAURANT_SLUG}`;
export const CUSTOMER_CART_URL = `/table/${DEMO_TABLE_NUMBER}/cart?restaurant=${DEMO_RESTAURANT_SLUG}`;
export const CUSTOMER_GAMES_URL = `/table/${DEMO_TABLE_NUMBER}/games?restaurant=${DEMO_RESTAURANT_SLUG}`;
export const CUSTOMER_BILL_URL = `/table/${DEMO_TABLE_NUMBER}/bill?restaurant=${DEMO_RESTAURANT_SLUG}`;
export const CUSTOMER_REVIEW_URL = `/table/${DEMO_TABLE_NUMBER}/review?restaurant=${DEMO_RESTAURANT_SLUG}`;
export const CUSTOMER_ABOUT_URL = `/table/${DEMO_TABLE_NUMBER}/about?restaurant=${DEMO_RESTAURANT_SLUG}`;
