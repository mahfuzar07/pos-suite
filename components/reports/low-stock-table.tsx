"use client"

import { AlertTriangle, Package } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import { Badge } from "../ui/badge"

interface LowStockTableProps {
  data: any
  loading?: boolean
}

export function LowStockTable({ data, loading }: LowStockTableProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Low Stock Alert
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading...</div>
        </CardContent>
      </Card>
    )
  }

  if (!data || !data.report || data.report.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Low Stock Alert
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">All products are well stocked!</div>
        </CardContent>
      </Card>
    )
  }

  const getStatusBadge = (product: any) => {
    if (product.stock === 0) {
      return <Badge variant="destructive">Out of Stock</Badge>
    }
    if (product.stock <= 5) {
      return <Badge variant="destructive">Critical</Badge>
    }
    return <Badge variant="secondary">Low</Badge>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Low Stock Alert ({data.summary?.total || 0} items)
        </CardTitle>
        {data.summary && (
          <div className="flex gap-4 text-sm">
            <span className="text-red-600">Out of Stock: {data.summary.outOfStock}</span>
            <span className="text-orange-600">Critical: {data.summary.critical}</span>
            <span className="text-yellow-600">Low: {data.summary.low}</span>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Current Stock</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.report.map((product: any) => (
                <TableRow key={product._id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.sku}</TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell className="font-medium">{product.stock}</TableCell>
                  <TableCell>{product.priceFormatted}</TableCell>
                  <TableCell>{getStatusBadge(product)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
