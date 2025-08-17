import { type NextRequest, NextResponse } from "next/server"
import { connectDatabase, Product, Sale } from "../../../src/db"
import { getCurrentUser } from "../../../src/lib/auth"

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const saleData = await req.json()
    const { items, subtotal, tax, discount, total, customerId, paymentMethod } = saleData

    console.log("[v0] Sale data received:", { items, subtotal, tax, discount, total, customerId, paymentMethod })

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Sale must have at least one item" }, { status: 400 })
    }

    if (!["cash", "card", "other"].includes(paymentMethod)) {
      return NextResponse.json({ error: "Invalid payment method" }, { status: 400 })
    }

    await connectDatabase()

    // Verify all products exist and have sufficient stock
    for (const item of items) {
      console.log("[v0] Looking for product with ID:", item.productId)
      const product = await Product.findById(item.productId)
      if (!product) {
        console.log("[v0] Product not found in database:", item.productId)
        return NextResponse.json({ error: `Product not found: ${item.name} (ID: ${item.productId})` }, { status: 400 })
      }

      console.log("[v0] Found product:", { name: product.name, stock: product.stock, requested: item.quantity })
      if (product.stock < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}` },
          { status: 400 },
        )
      }
    }

    // Create the sale
    const sale = await Sale.create({
      items,
      subtotal,
      tax,
      discount,
      total,
      customerId,
      cashierId: user.id,
      branchId: user.branchId || "default",
      paymentMethod,
    })

    // Update product stock
    for (const item of items) {
      await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity } })
    }

    return NextResponse.json({
      sale,
      message: "Sale completed successfully",
    })
  } catch (error) {
    console.error("Sale creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    await connectDatabase()

    const filters: any = {}
    if (startDate) filters.createdAt = { $gte: new Date(startDate) }
    if (endDate) {
      filters.createdAt = { ...filters.createdAt, $lte: new Date(endDate) }
    }

    const sales = await Sale.find({
      branchId: user.branchId || "default",
      ...filters,
    })
      .populate("customerId", "name email phone")
      .populate("cashierId", "name email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)

    const total = await Sale.countDocuments({
      branchId: user.branchId || "default",
      ...filters,
    })

    return NextResponse.json({
      sales,
      total,
      page,
      limit,
    })
  } catch (error) {
    console.error("Get sales error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
