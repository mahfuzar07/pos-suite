import { type NextRequest, NextResponse } from "next/server"
import { connectDatabase, Sale } from "../../../../src/db"
import { getCurrentUser } from "../../../../src/lib/auth"

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const limit = Number.parseInt(searchParams.get("limit") || "20")

    await connectDatabase()

    const startDateObj = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const endDateObj = endDate ? new Date(endDate) : new Date()

    console.log("[v0] Product sales report - Date range:", startDateObj, "to", endDateObj)

    const report = await Sale.aggregate([
      {
        $match: {
          createdAt: { $gte: startDateObj, $lte: endDateObj },
        },
      },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId",
          productName: { $first: "$items.name" },
          totalQty: { $sum: "$items.quantity" },
          totalSales: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
        },
      },
      { $sort: { totalSales: -1 } },
      { $limit: limit },
    ])

    console.log("[v0] Product sales report result:", report)

    // Limit results and add additional formatting
    const formattedReport = report.map((item) => ({
      _id: item._id,
      productName: item.productName,
      totalQty: item.totalQty,
      totalSales: item.totalSales,
      totalSalesFormatted: `$${(item.totalSales / 100).toFixed(2)}`,
      avgPrice: item.totalQty > 0 ? item.totalSales / item.totalQty : 0,
      avgPriceFormatted: item.totalQty > 0 ? `$${(item.totalSales / item.totalQty / 100).toFixed(2)}` : "$0.00",
    }))

    return NextResponse.json({
      report: formattedReport,
      total: report.length,
      dateRange: {
        startDate: startDateObj?.toISOString(),
        endDate: endDateObj?.toISOString(),
      },
    })
  } catch (error) {
    console.error("Product sales report error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
