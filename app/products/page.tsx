"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, ArrowLeft } from "lucide-react"
import { Button } from "../../components/ui/button"
import { ProductList } from "../../components/products/product-list"
import { ProductForm } from "../../components/products/product-form"
import { ImportDialog } from "../../components/products/import-dialog"
import type { Product } from "../../src/types"

export default function ProductsPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [user, setUser] = useState<any>(null)

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
      }
    }

    checkAuth()
  }, [router])

  // Load products
  const loadProducts = async () => {
    try {
      const response = await fetch("/api/products")
      if (response.ok) {
        const data = await response.json()
        setProducts(data.products || [])
      }
    } catch (error) {
      console.error("Failed to load products:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      loadProducts()
    }
  }, [user])

  const handleAddProduct = () => {
    setEditingProduct(null)
    setShowForm(true)
  }

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product)
    setShowForm(true)
  }

  const handleSubmitProduct = async (productData: any) => {
    try {
      const url = editingProduct ? `/api/products/${editingProduct._id}` : "/api/products"
      const method = editingProduct ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to save product")
      }

      await loadProducts()
      setShowForm(false)
      setEditingProduct(null)
    } catch (error) {
      throw error
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete product")
      }

      await loadProducts()
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to delete product")
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

  if (!user) {
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
              <Button variant="ghost" size="sm" onClick={() => router.push("/pos")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to POS
              </Button>
              <h1 className="text-xl font-semibold">Product Management</h1>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {user.name} ({user.role})
              </span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {showForm ? (
          <ProductForm
            product={editingProduct}
            onSubmit={handleSubmitProduct}
            onCancel={() => {
              setShowForm(false)
              setEditingProduct(null)
            }}
          />
        ) : (
          <div className="space-y-6">
            {/* Actions */}
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                {user.role === "manager" && (
                  <>
                    <Button onClick={handleAddProduct}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Product
                    </Button>
                    <ImportDialog onImportComplete={loadProducts} />
                  </>
                )}
              </div>
            </div>

            {/* Product List */}
            <ProductList
              products={products}
              onEdit={handleEditProduct}
              onDelete={handleDeleteProduct}
              loading={loading}
            />
          </div>
        )}
      </main>
    </div>
  )
}
