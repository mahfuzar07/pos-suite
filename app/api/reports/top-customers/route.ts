import { type NextRequest, NextResponse } from "next/server"
import { connectDatabase, Sale, Customer } from "../../../../src/db"
import { getCurrentUser } from "../../../../src/lib/auth"
import mongoose from "mongoose"

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    await connectDatabase()

    console.log("[v0] Top customers report - limit:", limit, "dateRange:", startDate, "to", endDate)

    const matchStage: any = {
      customerId: { $exists: true, $ne: null },
      $expr: {
        $and: [
          { $ne: ["$customerId", null] },
          { $ne: ["$customerId", ""] },
          { $regexMatch: { input: { $toString: "$customerId" }, regex: /^[0-9a-fA-F]{24}$/ } },
        ],
      },
    }

    // Add date filtering if provided
    if (startDate || endDate) {
      matchStage.createdAt = {}
      if (startDate) {
        matchStage.createdAt.$gte = new Date(startDate)
      }
      if (endDate) {
        const endDateTime = new Date(endDate)
        endDateTime.setHours(23, 59, 59, 999) // End of day
        matchStage.createdAt.$lte = endDateTime
      }
    }

    const report = await Sale.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$customerId",
          totalSpent: { $sum: "$total" },
          totalTransactions: { $sum: 1 },
        },
      },
      { $sort: { totalSpent: -1 } },
      { $limit: limit },
    ])

    console.log("[v0] Top customers report result:", report)

    const formattedReport = await Promise.all(
      report.map(async (item) => {
        let customer = null
        try {
          // Validate ObjectId before querying
          if (mongoose.Types.ObjectId.isValid(item._id)) {
            customer = await Customer.findById(item._id)
          }
        } catch (error) {
          console.log("[v0] Invalid customer ID:", item._id, error)
        }

        return {
          customerId: item._id,
          customerName: customer?.name || "Unknown Customer",
          customerEmail: customer?.email || "",
          totalSpent: item.totalSpent,
          totalSpentFormatted: `$${(item.totalSpent / 100).toFixed(2)}`,
          totalTransactions: item.totalTransactions,
          avgTransactionValue: item.totalTransactions > 0 ? item.totalSpent / item.totalTransactions : 0,
          avgTransactionValueFormatted:
            item.totalTransactions > 0 ? `$${(item.totalSpent / item.totalTransactions / 100).toFixed(2)}` : "$0.00",
        }
      }),
    )

    return NextResponse.json({
      report: formattedReport,
      total: formattedReport.length,
    })
  } catch (error) {
    console.error("Top customers report error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
