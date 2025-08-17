"use client"

import { useState } from "react"
import { CreditCard, DollarSign, Receipt, Printer } from "lucide-react"
import { Button } from "../ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog"
import { Label } from "../ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Input } from "../ui/input"
import { Separator } from "../ui/separator"
import { Checkbox } from "../ui/checkbox"
import { useCart } from "../../src/hooks/use-cart"
import printService from "../../src/lib/print"

interface CheckoutDialogProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (saleData: any) => void
}

export function CheckoutDialog({ isOpen, onClose, onComplete }: CheckoutDialogProps) {
  const { items, discount, tax, getSubtotal, getTotal, clearCart } = useCart()
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "other">("cash")
  const [customerId, setCustomerId] = useState("")
  const [processing, setProcessing] = useState(false)
  const [printReceipt, setPrintReceipt] = useState(printService.isEnabled())

  const subtotal = getSubtotal()
  const total = getTotal()

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`
  }

  const handleComplete = async () => {
    setProcessing(true)

    try {
      const saleData = {
        items: items.map((item) => ({
          productId: item.productId,
          sku: item.sku,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          total: item.price * item.quantity,
        })),
        subtotal,
        tax,
        discount,
        total,
        customerId: customerId || undefined,
        paymentMethod,
      }

      // Complete the sale first
      await onComplete(saleData)

      // Print receipt if enabled and requested
      if (printReceipt && printService.isEnabled()) {
        try {
          const receiptNumber = `RCP-${Date.now()}`
          await printService.printReceipt(
            {
              ...saleData,
              cashierName: "Current User", // TODO: Get from user context
              customerName: customerId ? `Customer ${customerId}` : undefined,
            },
            receiptNumber,
          )

          console.log("Receipt printed successfully")
        } catch (printError) {
          console.error("Print failed:", printError)
          // Don't fail the sale if printing fails
          alert(
            `Sale completed but printing failed: ${printError instanceof Error ? printError.message : "Unknown error"}`,
          )
        }
      }

      clearCart()
      onClose()
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to complete sale")
    } finally {
      setProcessing(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Complete Sale
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Order Summary */}
          <div className="space-y-2">
            <h3 className="font-medium">Order Summary</h3>
            <div className="text-sm space-y-1">
              {items.map((item) => (
                <div key={item.productId} className="flex justify-between">
                  <span>
                    {item.name} x{item.quantity}
                  </span>
                  <span>{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            <Separator />

            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount:</span>
                  <span>-{formatPrice(discount)}</span>
                </div>
              )}
              {tax > 0 && (
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span>{formatPrice(tax)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold">
                <span>Total:</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label>Payment Method</Label>
            <Select value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Cash
                  </div>
                </SelectItem>
                <SelectItem value="card">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Card
                  </div>
                </SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Customer ID (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="customerId">Customer ID (Optional)</Label>
            <Input
              id="customerId"
              placeholder="Enter customer ID..."
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
            />
          </div>

          {/* Print Receipt Option */}
          {printService.isEnabled() && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="printReceipt"
                checked={printReceipt}
                onCheckedChange={(checked) => setPrintReceipt(checked as boolean)}
              />
              <Label htmlFor="printReceipt" className="flex items-center gap-2">
                <Printer className="h-4 w-4" />
                Print Receipt
              </Label>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button onClick={handleComplete} disabled={processing || items.length === 0} className="flex-1">
              {processing ? "Processing..." : `Complete Sale (${formatPrice(total)})`}
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
