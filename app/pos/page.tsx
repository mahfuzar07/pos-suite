"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Scan, LogOut, User, Package, Users, BarChart3, Settings } from "lucide-react"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Alert, AlertDescription } from "../../components/ui/alert"
import { ProductSearch } from "../../components/pos/product-search"
import { CartDisplay } from "../../components/pos/cart-display"
import { HeldCarts } from "../../components/pos/held-carts"
import { CheckoutDialog } from "../../components/pos/checkout-dialog"
import { useCart } from "../../src/hooks/use-cart"
import { useBarcodeScanner } from "../../src/hooks/use-barcode-scanner"
import type { Product } from "../../src/types"

export default function POSPage() {
  const router = useRouter()
  const { addItem } = useCart()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [scannerActive, setScannerActive] = useState(true)
  const [lastScannedBarcode, setLastScannedBarcode] = useState("")

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me")
        if (response.ok) {
          const data = await response.json()
          setUser(data.user)
        } else {
          router.push("/login")
        }
      } catch (error) {
        router.push("/login")
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  // Barcode scanner
  useBarcodeScanner({
    onScan: async (barcode) => {
      if (!scannerActive) return

      setLastScannedBarcode(barcode)

      try {
        const response = await fetch(`/api/products/barcode/${encodeURIComponent(barcode)}`)
        if (response.ok) {
          const data = await response.json()
          if (data.product) {
            const cartItem = {
              ...data.product,
              productId: data.product._id,
            }
            addItem(cartItem)
          } else {
            alert(`Product not found for barcode: ${barcode}`)
          }
        } else {
          alert(`Product not found for barcode: ${barcode}`)
        }
      } catch (error) {
        console.error("Barcode scan error:", error)
        alert("Error scanning barcode")
      }
    },
  })

  const handleAddToCart = (product: Product) => {
    console.log("[v0] Attempting to add product to cart:", product.name, product._id)
    try {
      const cartItem = {
        ...product,
        productId: product._id, // Map _id to productId
      }
      addItem(cartItem)
      console.log("[v0] Successfully added product to cart:", product.name)
    } catch (error) {
      console.error("[v0] Error adding item to cart:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to add item to cart"
      console.error("[v0] Cart error:", errorMessage)
      const notification = document.createElement("div")
      notification.className = "fixed top-4 right-4 bg-red-500 text-white p-4 rounded shadow-lg z-50"
      notification.textContent = errorMessage
      document.body.appendChild(notification)
      setTimeout(() => {
        document.body.removeChild(notification)
      }, 3000)
    }
  }

  const handleCompleteSale = async (saleData: any) => {
    try {
      const response = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(saleData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to complete sale")
      }

      const result = await response.json()
      alert(`Sale completed successfully! Sale ID: ${result.sale._id}`)
    } catch (error) {
      throw error
    }
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      router.push("/login")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold">POS Suite</h1>
              <div className="flex items-center gap-2">
                <Scan className={`h-4 w-4 ${scannerActive ? "text-green-500" : "text-gray-400"}`} />
                <span className="text-sm text-gray-600">Scanner {scannerActive ? "Active" : "Inactive"}</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => router.push("/products")}>
                  <Package className="h-4 w-4 mr-2" />
                  Products
                </Button>
                <Button variant="outline" size="sm" onClick={() => router.push("/customers")}>
                  <Users className="h-4 w-4 mr-2" />
                  Customers
                </Button>
                <Button variant="outline" size="sm" onClick={() => router.push("/reports")}>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Reports
                </Button>
                <Button variant="outline" size="sm" onClick={() => router.push("/settings")}>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </div>

              {user && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4" />
                  <span>
                    {user.name} ({user.role})
                  </span>
                </div>
              )}
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {lastScannedBarcode && (
          <Alert className="mb-4">
            <AlertDescription>Last scanned barcode: {lastScannedBarcode}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Product Search */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Product Search</CardTitle>
              </CardHeader>
              <CardContent>
                <ProductSearch onAddToCart={handleAddToCart} />
              </CardContent>
            </Card>

            <HeldCarts />
          </div>

          {/* Right Column - Cart */}
          <div>
            <CartDisplay onCheckout={() => setCheckoutOpen(true)} />
          </div>
        </div>
      </main>

      {/* Checkout Dialog */}
      <CheckoutDialog isOpen={checkoutOpen} onClose={() => setCheckoutOpen(false)} onComplete={handleCompleteSale} />
    </div>
  )
}
