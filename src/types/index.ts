// ---------------------------------------------------------------------------
// Shared TypeScript types for ServeMyTable
// ---------------------------------------------------------------------------

export type UserRole =
  | "super_admin"
  | "restaurant_owner"
  | "restaurant_manager";

// ---------------------------------------------------------------------------
// NextAuth module augmentation
// Extends Session and JWT to carry our custom fields.
// ---------------------------------------------------------------------------
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
      restaurantId: string | null;
      restaurantSlug: string | null;
    };
  }

  // Extend the User returned from authorize()
  interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    restaurantId: string | null;
    restaurantSlug: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    restaurantId: string | null;
    restaurantSlug: string | null;
  }
}

// ---------------------------------------------------------------------------
// Subscription tier feature flags
// ---------------------------------------------------------------------------
export interface TierFeatures {
  games: boolean;
  analytics: boolean;
  posIntegration: boolean;
  customBranding: boolean;
}

// ---------------------------------------------------------------------------
// Cart (Zustand store — customer side)
// ---------------------------------------------------------------------------
export interface CartItem {
  dishId: string;
  name: string;
  price: number;
  quantity: number;
  imageEmoji?: string;
  specialInst?: string;
  allergens: string[];
}

// ---------------------------------------------------------------------------
// AI chat
// ---------------------------------------------------------------------------
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
  metadata?: Record<string, unknown>;
}

export interface QuickReply {
  label: string;
  value: string;
}

// ---------------------------------------------------------------------------
// Menu
// ---------------------------------------------------------------------------
export interface DishWithCategory {
  id: string;
  name: string;
  description: string;
  price: number;
  imageEmoji?: string | null;
  imageUrl?: string | null;
  spiceLevel: number;
  isVeg: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  isJain: boolean;
  allergens: string[];
  prepTime: number;
  isAvailable: boolean;
  isChefPick: boolean;
  isPopular: boolean;
  upsellIds: string[];
  categoryId: string;
  category: { id: string; name: string; sortOrder: number };
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------
export type OrderStatus = "received" | "preparing" | "ready" | "served";

export interface OrderWithItems {
  id: string;
  orderNumber: string;
  tableId: string;
  sessionId: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: OrderStatus;
  specialNotes?: string | null;
  createdAt: Date;
  updatedAt: Date;
  table: { number: number; seats: number };
  items: OrderItemDetail[];
}

export interface OrderItemDetail {
  id: string;
  dishId: string;
  quantity: number;
  unitPrice: number;
  specialInst?: string | null;
  dish: { name: string; allergens: string[]; imageEmoji?: string | null };
}

// ---------------------------------------------------------------------------
// Table / Session
// ---------------------------------------------------------------------------
export type TableStatus = "empty" | "occupied" | "ordering" | "billing";

export interface TableWithWaiter {
  id: string;
  number: number;
  seats: number;
  status: TableStatus;
  qrCode?: string | null;
  waiterId?: string | null;
  waiter?: { id: string; name: string; avatar: string } | null;
}

// ---------------------------------------------------------------------------
// AI Waiter
// ---------------------------------------------------------------------------
export interface AIWaiterConfig {
  id: string;
  name: string;
  avatar: string;
  personality: string;
  tone: string;
  languages: string[];
  greeting?: string | null;
  isActive: boolean;
}

// ---------------------------------------------------------------------------
// API response helpers
// ---------------------------------------------------------------------------
export interface ApiSuccess<T = unknown> {
  data: T;
  message?: string;
}

export interface ApiError {
  error: string;
  code?: string;
}
