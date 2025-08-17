"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { CartItem } from "../types"

interface CartState {
  items: CartItem[]
  discount: number // in cents
  tax: number // in cents
  heldCarts: { [key: string]: CartItem[] }

  // Actions
  addItem: (item: Omit<CartItem, "quantity">) => void
  updateQuantity: (productId: string, quantity: number) => void
  removeItem: (productId: string) => void
  clearCart: () => void
  holdCart: (name: string) => void
  resumeCart: (name: string) => void
  deleteHeldCart: (name: string) => void
  setDiscount: (discount: number) => void
  setTax: (tax: number) => void

  // Computed values
  getSubtotal: () => number
  getTotal: () => number
  getItemCount: () => number
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      discount: 0,
      tax: 0,
      heldCarts: {},

      addItem: (item) => {
        console.log("[v0] Cart addItem called with:", {
          productId: item.productId,
          name: item.name,
          price: item.price,
          stock: item.stock,
        })

        const items = get().items
        console.log("[v0] Current cart items:", items.length)

        const existingItem = items.find((i) => i.productId === item.productId)
        console.log("[v0] Existing item found:", !!existingItem)

        if (existingItem) {
          console.log("[v0] Existing item quantity:", existingItem.quantity, "Stock:", item.stock)
          // Check stock limit
          if (existingItem.quantity >= item.stock) {
            const error = `Cannot add more items. Only ${item.stock} in stock.`
            console.log("[v0] Stock limit error:", error)
            throw new Error(error)
          }

          console.log("[v0] Incrementing existing item quantity")
          set({
            items: items.map((i) => (i.productId === item.productId ? { ...i, quantity: i.quantity + 1 } : i)),
          })
        } else {
          console.log("[v0] Adding new item to cart")
          set({
            items: [...items, { ...item, quantity: 1 }],
          })
        }

        // Log final state
        const finalItems = get().items
        console.log("[v0] Cart after addItem:", finalItems.length, "items")
        console.log(
          "[v0] Cart contents:",
          finalItems.map((i) => ({ name: i.name, quantity: i.quantity })),
        )
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId)
          return
        }

        const items = get().items
        const item = items.find((i) => i.productId === productId)

        if (item && quantity > item.stock) {
          throw new Error(`Cannot set quantity to ${quantity}. Only ${item.stock} in stock.`)
        }

        set({
          items: items.map((i) => (i.productId === productId ? { ...i, quantity } : i)),
        })
      },

      removeItem: (productId) => {
        set({
          items: get().items.filter((i) => i.productId !== productId),
        })
      },

      clearCart: () => {
        set({
          items: [],
          discount: 0,
          tax: 0,
        })
      },

      holdCart: (name) => {
        const { items, heldCarts } = get()
        if (items.length === 0) {
          throw new Error("Cannot hold an empty cart")
        }

        set({
          heldCarts: { ...heldCarts, [name]: [...items] },
          items: [],
          discount: 0,
          tax: 0,
        })
      },

      resumeCart: (name) => {
        const { heldCarts } = get()
        const heldCart = heldCarts[name]

        if (!heldCart) {
          throw new Error("Held cart not found")
        }

        set({
          items: [...heldCart],
          heldCarts: Object.fromEntries(Object.entries(heldCarts).filter(([key]) => key !== name)),
        })
      },

      deleteHeldCart: (name) => {
        const { heldCarts } = get()
        set({
          heldCarts: Object.fromEntries(Object.entries(heldCarts).filter(([key]) => key !== name)),
        })
      },

      setDiscount: (discount) => {
        set({ discount: Math.max(0, discount) })
      },

      setTax: (tax) => {
        set({ tax: Math.max(0, tax) })
      },

      getSubtotal: () => {
        return get().items.reduce((total, item) => total + item.price * item.quantity, 0)
      },

      getTotal: () => {
        const { getSubtotal, discount, tax } = get()
        const subtotal = getSubtotal()
        return Math.max(0, subtotal - discount + tax)
      },

      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0)
      },
    }),
    {
      name: "pos-cart-storage",
    },
  ),
)
