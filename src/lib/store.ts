import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/types";

// ---------------------------------------------------------------------------
// Cart store
// ---------------------------------------------------------------------------

interface CartState {
  items:             CartItem[];
  /** Dietary prefs / allergen flags captured by the AI waiter during chat */
  dietaryPrefs:      string[];
  addItem:           (item: CartItem) => void;
  removeItem:        (dishId: string) => void;
  updateQuantity:    (dishId: string, qty: number) => void;
  updateSpecialInst: (dishId: string, inst: string) => void;
  clearCart:         () => void;
  setDietaryPrefs:   (prefs: string[]) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items:        [],
      dietaryPrefs: [],

      setDietaryPrefs: (prefs) => set({ dietaryPrefs: prefs }),

      addItem: (incoming) =>
        set((state) => {
          const existing = state.items.find((i) => i.dishId === incoming.dishId);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.dishId === incoming.dishId
                  ? { ...i, quantity: i.quantity + (incoming.quantity ?? 1) }
                  : i
              ),
            };
          }
          return { items: [...state.items, incoming] };
        }),

      removeItem: (dishId) =>
        set((state) => ({ items: state.items.filter((i) => i.dishId !== dishId) })),

      updateQuantity: (dishId, qty) =>
        set((state) => ({
          items:
            qty <= 0
              ? state.items.filter((i) => i.dishId !== dishId)
              : state.items.map((i) =>
                  i.dishId === dishId ? { ...i, quantity: qty } : i
                ),
        })),

      updateSpecialInst: (dishId, inst) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.dishId === dishId ? { ...i, specialInst: inst } : i
          ),
        })),

      clearCart: () => set({ items: [] }),
    }),
    { name: "tt-cart" }
  )
);

// Selector helpers — use in components to avoid unnecessary re-renders
export const selectItemCount = (state: CartState) =>
  state.items.reduce((sum, i) => sum + i.quantity, 0);

export const selectSubtotal = (state: CartState) =>
  state.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
