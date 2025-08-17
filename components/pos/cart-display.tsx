"use client"

import { Minus, Plus, Trash2, ShoppingCart } from "lucide-react"
import { Button } from "../ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Separator } from "../ui/separator"
import { useCart } from "../../src/hooks/use-cart"

interface CartDisplayProps {
  onCheckout: () => void
}

export function CartDisplay({ onCheckout }: CartDisplayProps) {
  const {
    items,
    discount,
    tax,
    updateQuantity,
    removeItem,
    clearCart,
    setDiscount,
    setTax,
    getSubtotal,
    getTotal,
    getItemCount,
  } = useCart()

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`
  }

  const handleDiscountChange = (value: string) => {
    const cents = Math.round(Number.parseFloat(value || "0") * 100)
    setDiscount(cents)
  }

  const handleTaxChange = (value: string) => {
    const cents = Math.round(Number.parseFloat(value || "0") * 100)
    setTax(cents)
  }

  const subtotal = getSubtotal()
  const total = getTotal()
  const itemCount = getItemCount()

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Cart ({itemCount} items)
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col">
        {/* Cart Items */}
        <div className="flex-1 space-y-2 mb-4 max-h-64 overflow-y-auto">
          {items.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Cart is empty</div>
          ) : (
            items.map((item) => (
              <div key={item.productId} className="flex items-center gap-2 p-2 border rounded">
                <div className="flex-1">
                  <div className="font-medium text-sm">{item.name}</div>
                  <div className="text-xs text-gray-600">{formatPrice(item.price)} each</div>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    className="h-8 w-8 p-0"
                  >
                    <Minus className="h-3 w-3" />
                  </Button>

                  <span className="w-8 text-center text-sm">{item.quantity}</span>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    disabled={item.quantity >= item.stock}
                    className="h-8 w-8 p-0"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>

                <div className="text-sm font-medium w-16 text-right">{formatPrice(item.price * item.quantity)}</div>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeItem(item.productId)}
                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))
          )}
        </div>

        {/* Discount and Tax */}
        <div className="space-y-3 mb-4">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="discount" className="text-xs">
                Discount ($)
              </Label>
              <Input
                id="discount"
                type="number"
                step="0.01"
                min="0"
                value={(discount / 100).toFixed(2)}
                onChange={(e) => handleDiscountChange(e.target.value)}
                className="h-8"
              />
            </div>
            <div>
              <Label htmlFor="tax" className="text-xs">
                Tax ($)
              </Label>
              <Input
                id="tax"
                type="number"
                step="0.01"
                min="0"
                value={(tax / 100).toFixed(2)}
                onChange={(e) => handleTaxChange(e.target.value)}
                className="h-8"
              />
            </div>
          </div>
        </div>

        {/* Totals */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span>Subtotal:</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Discount:</span>
              <span>-{formatPrice(discount)}</span>
            </div>
          )}
          {tax > 0 && (
            <div className="flex justify-between text-sm">
              <span>Tax:</span>
              <span>{formatPrice(tax)}</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between text-lg font-bold">
            <span>Total:</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <Button onClick={onCheckout} disabled={items.length === 0} className="w-full" size="lg">
            Complete Sale
          </Button>

          <Button onClick={clearCart} disabled={items.length === 0} variant="outline" className="w-full bg-transparent">
            Clear Cart
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
