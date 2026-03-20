import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { calculateBillingBreakdown, type BillingBreakdown } from "../utils/billing";

interface CartItem {
  itemId: string;
  name: string;
  price: number;
  qty: number;
}

interface CartStore {
  items: CartItem[];
  total: number;
  gstPercentage: number;
  setGstPercentage: (gst: number) => void;
  getBaseTotal: () => number;
  getBillingBreakdown: () => BillingBreakdown | null;
  addItem: (item: Omit<CartItem, "qty">, qty?: number) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, qty: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      total: 0,
      gstPercentage: 0,

      setGstPercentage: (gst: number) => set({ gstPercentage: gst }),

      getBaseTotal: () => {
        const state = get();
        return state.items.reduce((sum, i) => sum + i.price * i.qty, 0);
      },

      getBillingBreakdown: () => {
        const state = get();
        const baseTotal = state.getBaseTotal();
        if (baseTotal === 0) return null;
        return calculateBillingBreakdown(baseTotal, state.gstPercentage);
      },

      addItem: (item, qty = 1) =>
        set((state) => {
          const existing = state.items.find((i) => i.itemId === item.itemId);
          let newItems;

          if (existing) {
            newItems = state.items.map((i) =>
              i.itemId === item.itemId ? { ...i, qty: i.qty + qty } : i
            );
          } else {
            newItems = [...state.items, { ...item, qty }];
          }

          const newTotal = newItems.reduce(
            (sum, i) => sum + i.price * i.qty,
            0
          );
          return { items: newItems, total: newTotal };
        }),

      removeItem: (itemId) =>
        set((state) => {
          const newItems = state.items.filter((i) => i.itemId !== itemId);
          const newTotal = newItems.reduce(
            (sum, i) => sum + i.price * i.qty,
            0
          );
          return { items: newItems, total: newTotal };
        }),

      updateQuantity: (itemId, qty) =>
        set((state) => {
          if (qty <= 0) {
            const newItems = state.items.filter((i) => i.itemId !== itemId);
            const newTotal = newItems.reduce(
              (sum, i) => sum + i.price * i.qty,
              0
            );
            return { items: newItems, total: newTotal };
          }

          const newItems = state.items.map((i) =>
            i.itemId === itemId ? { ...i, qty } : i
          );
          const newTotal = newItems.reduce(
            (sum, i) => sum + i.price * i.qty,
            0
          );
          return { items: newItems, total: newTotal };
        }),

      clearCart: () => set({ items: [], total: 0 }),
    }),
    {
      name: "cart-storage",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    }
  )
);
