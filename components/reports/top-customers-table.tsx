"use client"

import { Users, Crown } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"

interface TopCustomersTableProps {
  data: any[]
  loading?: boolean
}

export function TopCustomersTable({ data, loading }: TopCustomersTableProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Top Customers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading...</div>
        </CardContent>
      </Card>
    )
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Top Customers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">No customer data available</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5" />
          Top Customers ({data.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Total Spent</TableHead>
                <TableHead>Transactions</TableHead>
                <TableHead>Avg Order</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((customer, index) => (
                <TableRow key={customer.customerId}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {index === 0 && <Crown className="h-4 w-4 text-yellow-500" />}#{index + 1}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{customer.customerName}</TableCell>
                  <TableCell>{customer.customerEmail || "-"}</TableCell>
                  <TableCell className="font-medium text-green-600">{customer.totalSpentFormatted}</TableCell>
                  <TableCell>{customer.totalTransactions}</TableCell>
                  <TableCell>{customer.avgTransactionValueFormatted}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
