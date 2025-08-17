import { type NextRequest, NextResponse } from "next/server"
import { connectDatabase, Product } from "../../../../src/db"
import { getCurrentUser } from "../../../../src/lib/auth"

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const threshold = Number.parseInt(searchParams.get("threshold") || "10")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    await connectDatabase()

    console.log("[v0] Low stock report - threshold:", threshold, "dateRange:", startDate, "to", endDate)

    const report = await Product.find({
      stock: { $lte: threshold },
    }).sort({ stock: 1, name: 1 })

    console.log("[v0] Low stock report result:", report.length, "products")

    // Format the report
    const formattedReport = report.map((product) => ({
      _id: product._id,
      sku: product.sku,
      name: product.name,
      price: product.price,
      stock: product.stock,
      category: product.category,
      barcode: product.barcode,
      priceFormatted: `$${(product.price / 100).toFixed(2)}`,
      stockStatus: product.stock === 0 ? "Out of Stock" : product.stock <= 5 ? "Critical" : "Low",
      stockStatusColor: product.stock === 0 ? "red" : product.stock <= 5 ? "orange" : "yellow",
    }))

    // Group by status
    const grouped = {
      outOfStock: formattedReport.filter((p) => p.stock === 0),
      critical: formattedReport.filter((p) => p.stock > 0 && p.stock <= 5),
      low: formattedReport.filter((p) => p.stock > 5 && p.stock <= threshold),
    }

    return NextResponse.json({
      report: formattedReport,
      grouped,
      summary: {
        total: formattedReport.length,
        outOfStock: grouped.outOfStock.length,
        critical: grouped.critical.length,
        low: grouped.low.length,
      },
      threshold,
      startDate,
      endDate,
    })
  } catch (error) {
    console.error("Low stock report error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
