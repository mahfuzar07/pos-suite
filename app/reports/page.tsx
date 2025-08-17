"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Calendar, Download } from "lucide-react"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { ProductSalesChart } from "../../components/reports/product-sales-chart"
import { DailySalesChart } from "../../components/reports/daily-sales-chart"
import { LowStockTable } from "../../components/reports/low-stock-table"
import { TopCustomersTable } from "../../components/reports/top-customers-table"
import { SalesSummaryCards } from "../../components/reports/sales-summary-cards"

export default function ReportsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 30 days ago
    endDate: new Date().toISOString().split("T")[0], // today
  })

  // Report data states
  const [productSalesData, setProductSalesData] = useState<any[]>([])
  const [dailySalesData, setDailySalesData] = useState<any>(null)
  const [topCustomersData, setTopCustomersData] = useState<any[]>([])
  const [lowStockData, setLowStockData] = useState<any>(null)
  const [reportsLoading, setReportsLoading] = useState(false)

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

  // Load reports data
  const loadReports = async () => {
    if (!user) return

    setReportsLoading(true)
    try {
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      })

      // Load all reports in parallel
      const [productSalesRes, dailySalesRes, topCustomersRes, lowStockRes] = await Promise.all([
        fetch(`/api/reports/product-sales?${params}`),
        fetch(`/api/reports/daily-sales?${params}`),
        fetch(`/api/reports/top-customers?${params}`), // Added date params
        fetch(`/api/reports/low-stock?${params}`), // Added date params
      ])

      if (productSalesRes.ok) {
        const data = await productSalesRes.json()
        setProductSalesData(data.report || [])
      }

      if (dailySalesRes.ok) {
        const data = await dailySalesRes.json()
        setDailySalesData(data)
      }

      if (topCustomersRes.ok) {
        const data = await topCustomersRes.json()
        setTopCustomersData(data.report || [])
      }

      if (lowStockRes.ok) {
        const data = await lowStockRes.json()
        setLowStockData(data)
      }
    } catch (error) {
      console.error("Failed to load reports:", error)
    } finally {
      setReportsLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      loadReports()
    }
  }, [user, dateRange])

  const handleDateRangeChange = (field: string, value: string) => {
    setDateRange((prev) => ({ ...prev, [field]: value }))
  }

  const exportReport = (reportType: string) => {
    // Simple CSV export functionality
    let csvContent = ""
    let filename = ""

    switch (reportType) {
      case "product-sales":
        csvContent = [
          "Product,SKU,Total Quantity,Total Sales,Average Price",
          ...productSalesData.map(
            (item) => `"${item.name}","${item.sku}",${item.totalQty},${item.totalSales / 100},${item.avgPrice / 100}`,
          ),
        ].join("\n")
        filename = "product-sales-report.csv"
        break

      case "daily-sales":
        csvContent = [
          "Date,Total Sales,Total Transactions,Average Transaction Value",
          ...(dailySalesData?.report || []).map(
            (item: any) =>
              `"${item.dateFormatted}",${item.totalSales / 100},${item.totalTransactions},${item.avgTransactionValue / 100}`,
          ),
        ].join("\n")
        filename = "daily-sales-report.csv"
        break

      case "top-customers":
        csvContent = [
          "Customer Name,Email,Total Spent,Total Transactions,Average Order Value",
          ...topCustomersData.map(
            (item) =>
              `"${item.customerName}","${item.customerEmail}",${item.totalSpent / 100},${item.totalTransactions},${item.avgTransactionValue / 100}`,
          ),
        ].join("\n")
        filename = "top-customers-report.csv"
        break

      case "low-stock":
        csvContent = [
          "Product Name,SKU,Category,Current Stock,Price,Status",
          ...(lowStockData?.report || []).map(
            (item: any) =>
              `"${item.name}","${item.sku}","${item.category}",${item.stock},${item.price / 100},"${item.stockStatus}"`,
          ),
        ].join("\n")
        filename = "low-stock-report.csv"
        break
    }

    if (csvContent) {
      const blob = new Blob([csvContent], { type: "text/csv" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      a.click()
      window.URL.revokeObjectURL(url)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
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
              <h1 className="text-xl font-semibold">Reports & Analytics</h1>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {user.name} ({user.role})
              </span>
              <Button variant="outline" size="sm" onClick={() => router.push("/login")}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          {/* Date Range Filter */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Date Range Filter
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 items-end">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => handleDateRangeChange("startDate", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => handleDateRangeChange("endDate", e.target.value)}
                  />
                </div>
                <Button onClick={loadReports} disabled={reportsLoading}>
                  {reportsLoading ? "Loading..." : "Update Reports"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Summary Cards */}
          <SalesSummaryCards
            dailySalesData={dailySalesData}
            productSalesData={productSalesData}
            loading={reportsLoading}
          />

          {/* Reports Tabs */}
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="products">Products</TabsTrigger>
              <TabsTrigger value="customers">Customers</TabsTrigger>
              <TabsTrigger value="inventory">Inventory</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <DailySalesChart data={dailySalesData?.report || []} loading={reportsLoading} />
                <ProductSalesChart data={productSalesData} loading={reportsLoading} />
              </div>
            </TabsContent>

            <TabsContent value="products" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Product Sales Analysis</h2>
                <Button variant="outline" onClick={() => exportReport("product-sales")}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
              <ProductSalesChart data={productSalesData} loading={reportsLoading} />
            </TabsContent>

            <TabsContent value="customers" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Customer Analysis</h2>
                <Button variant="outline" onClick={() => exportReport("top-customers")}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
              <TopCustomersTable data={topCustomersData} loading={reportsLoading} />
            </TabsContent>

            <TabsContent value="inventory" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Inventory Status</h2>
                <Button variant="outline" onClick={() => exportReport("low-stock")}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
              <LowStockTable data={lowStockData} loading={reportsLoading} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
