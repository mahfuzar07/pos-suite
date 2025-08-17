"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { TrendingUp } from "lucide-react"

interface DailySalesChartProps {
  data: any[]
  loading?: boolean
}

export function DailySalesChart({ data, loading }: DailySalesChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Daily Sales Trend
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
            <TrendingUp className="h-5 w-5" />
            Daily Sales Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-gray-500">No data available</div>
        </CardContent>
      </Card>
    )
  }

  const chartData = data.map((item) => ({
    date: item.dateFormatted,
    sales: item.totalSales / 100, // Convert to dollars
    transactions: item.totalTransactions,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Daily Sales Trend
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip
              formatter={(value, name) => [
                name === "sales" ? `$${Number(value).toFixed(2)}` : value,
                name === "sales" ? "Sales" : "Transactions",
              ]}
            />
            <Line type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={2} name="sales" />
            <Line type="monotone" dataKey="transactions" stroke="#10b981" strokeWidth={2} name="transactions" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
