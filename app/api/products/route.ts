import { type NextRequest, NextResponse } from "next/server"
import { connectDatabase, Product } from "../../../src/db"
import { getCurrentUser } from "../../../src/lib/auth"

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search")
    const category = searchParams.get("category")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "50")

    await connectDatabase()

    const filters: any = { branchId: user.branchId || "default" }
    if (search) {
      filters.$or = [
        { name: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } },
        { barcode: { $regex: search, $options: "i" } },
      ]
    }
    if (category) {
      filters.category = category
    }

    const products = await Product.find(filters)
      .skip((page - 1) * limit)
      .limit(limit)

    const total = await Product.countDocuments(filters)

    return NextResponse.json({
      products,
      total,
      page,
      limit,
    })
  } catch (error) {
    console.error("Get products error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    if (user.role !== "manager") {
      return NextResponse.json({ error: "Manager role required" }, { status: 403 })
    }

    const productData = await req.json()
    const { sku, name, price, stock, barcode, category } = productData

    if (!sku || !name || price === undefined || stock === undefined || !category) {
      return NextResponse.json({ error: "SKU, name, price, stock, and category are required" }, { status: 400 })
    }

    if (typeof price !== "number" || price < 0) {
      return NextResponse.json({ error: "Price must be a non-negative number (in cents)" }, { status: 400 })
    }

    if (typeof stock !== "number" || stock < 0) {
      return NextResponse.json({ error: "Stock must be a non-negative number" }, { status: 400 })
    }

    await connectDatabase()

    const product = new Product({
      sku,
      name,
      price,
      stock,
      barcode,
      category,
      branchId: user.branchId || "default",
    })
    await product.save()

    return NextResponse.json({
      product,
      message: "Product created successfully",
    })
  } catch (error) {
    console.error("Create product error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
