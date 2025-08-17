"use client"

import { useState, useEffect } from "react"
import { Search, Plus } from "lucide-react"
import { Input } from "../ui/input"
import { Button } from "../ui/button"
import { Card, CardContent } from "../ui/card"
import { Badge } from "../ui/badge"
import type { Product } from "../../src/types"

interface ProductSearchProps {
  onAddToCart: (product: Product) => void
}

export function ProductSearch({ onAddToCart }: ProductSearchProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const searchProducts = async () => {
      if (searchTerm.length < 2) {
        setProducts([])
        return
      }

      setLoading(true)
      try {
        const response = await fetch(`/api/products?search=${encodeURIComponent(searchTerm)}`)
        if (response.ok) {
          const data = await response.json()
          setProducts(data.products || [])
        }
      } catch (error) {
        console.error("Search error:", error)
      } finally {
        setLoading(false)
      }
    }

    const debounceTimer = setTimeout(searchProducts, 300)
    return () => clearTimeout(debounceTimer)
  }, [searchTerm])

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`
  }

  const handleAddToCart = (product: Product) => {
    console.log("[v0] ProductSearch: Product selected:", product.name, product._id)
    console.log("[v0] ProductSearch: Product details:", {
      _id: product._id,
      name: product.name,
      price: product.price,
      stock: product.stock,
      sku: product.sku,
    })
    onAddToCart(product)
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search products by name, SKU, or barcode..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading && <div className="text-center py-4 text-gray-500">Searching...</div>}

      <div className="grid gap-2 max-h-96 overflow-y-auto">
        {products.map((product) => (
          <Card key={product._id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{product.name}</h3>
                    <Badge variant="secondary">{product.category}</Badge>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    SKU: {product.sku} | Stock: {product.stock}
                  </div>
                  <div className="text-lg font-semibold text-green-600 mt-1">{formatPrice(product.price)}</div>
                </div>
                <Button
                  onClick={() => handleAddToCart(product)}
                  disabled={product.stock === 0}
                  size="sm"
                  className="ml-4"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {searchTerm.length >= 2 && !loading && products.length === 0 && (
        <div className="text-center py-8 text-gray-500">No products found for "{searchTerm}"</div>
      )}
    </div>
  )
}
