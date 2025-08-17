"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Package } from "lucide-react"

interface ProductSalesChartProps {
  data: any[]
  loading?: boolean
}

export function ProductSalesChart({ data, loading }: ProductSalesChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Product Sales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">Loading...</div>
        </CardContent>
      </Card>
    )
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Product Sales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-gray-500">No data available</div>
        </CardContent>
      </Card>
    )
  }

  // Take top 10 products for better visualization
  const chartData = data.slice(0, 10).map((item) => ({
    name: item.name && item.name.length > 15 ? `${item.name.substring(0, 15)}...` : item.name || "Unknown Product",
    fullName: item.name || "Unknown Product",
    sales: item.totalSales / 100, // Convert to dollars
    quantity: item.totalQty,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Top Product Sales
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
            <YAxis />
            <Tooltip
              formatter={(value, name) => [
                name === "sales" ? `$${Number(value).toFixed(2)}` : value,
                name === "sales" ? "Sales" : "Quantity",
              ]}
              labelFormatter={(label) => {
                const item = chartData.find((d) => d.name === label)
                return item?.fullName || label
              }}
            />
            <Bar dataKey="sales" fill="#3b82f6" name="sales" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
