"use client"

import { useState } from "react"
import { Package, Trash2, RotateCcw } from "lucide-react"
import { Button } from "../ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Input } from "../ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog"
import { useCart } from "../../src/hooks/use-cart"

export function HeldCarts() {
  const { items, heldCarts, holdCart, resumeCart, deleteHeldCart } = useCart()
  const [holdName, setHoldName] = useState("")
  const [isHoldDialogOpen, setIsHoldDialogOpen] = useState(false)

  const handleHoldCart = () => {
    if (!holdName.trim()) return

    try {
      holdCart(holdName.trim())
      setHoldName("")
      setIsHoldDialogOpen(false)
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to hold cart")
    }
  }

  const handleResumeCart = (name: string) => {
    try {
      resumeCart(name)
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to resume cart")
    }
  }

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`
  }

  const getCartTotal = (cartItems: any[]) => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  const heldCartEntries = Object.entries(heldCarts)

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Held Carts ({heldCartEntries.length})
          </div>

          <Dialog open={isHoldDialogOpen} onOpenChange={setIsHoldDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" disabled={items.length === 0} variant="outline">
                Hold Current
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Hold Current Cart</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Enter cart name..."
                  value={holdName}
                  onChange={(e) => setHoldName(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleHoldCart()}
                />
                <div className="flex gap-2">
                  <Button onClick={handleHoldCart} disabled={!holdName.trim()}>
                    Hold Cart
                  </Button>
                  <Button variant="outline" onClick={() => setIsHoldDialogOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>

      <CardContent>
        {heldCartEntries.length === 0 ? (
          <div className="text-center py-4 text-gray-500">No held carts</div>
        ) : (
          <div className="space-y-2">
            {heldCartEntries.map(([name, cartItems]) => (
              <div key={name} className="flex items-center justify-between p-3 border rounded">
                <div>
                  <div className="font-medium">{name}</div>
                  <div className="text-sm text-gray-600">
                    {cartItems.length} items • {formatPrice(getCartTotal(cartItems))}
                  </div>
                </div>

                <div className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => handleResumeCart(name)}>
                    <RotateCcw className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteHeldCart(name)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
