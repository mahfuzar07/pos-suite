import { type NextRequest, NextResponse } from "next/server"
import { connectDatabase, Product } from "../../../../src/db"
import { getCurrentUser } from "../../../../src/lib/auth"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    await connectDatabase()
    const product = await Product.findById(params.id)

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    if (product.branchId !== (user.branchId || "default")) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    return NextResponse.json({ product })
  } catch (error) {
    console.error("Get product error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    if (user.role !== "manager") {
      return NextResponse.json({ error: "Manager role required" }, { status: 403 })
    }

    const updates = await req.json()
    const { sku, name, price, stock, barcode, category } = updates

    if (price !== undefined && (typeof price !== "number" || price < 0)) {
      return NextResponse.json({ error: "Price must be a non-negative number (in cents)" }, { status: 400 })
    }

    if (stock !== undefined && (typeof stock !== "number" || stock < 0)) {
      return NextResponse.json({ error: "Stock must be a non-negative number" }, { status: 400 })
    }

    await connectDatabase()

    const existingProduct = await Product.findById(params.id)
    if (!existingProduct || existingProduct.branchId !== (user.branchId || "default")) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    const product = await Product.findByIdAndUpdate(
      params.id,
      { sku, name, price, stock, barcode, category },
      { new: true },
    )

    return NextResponse.json({
      product,
      message: "Product updated successfully",
    })
  } catch (error) {
    console.error("Update product error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    if (user.role !== "manager") {
      return NextResponse.json({ error: "Manager role required" }, { status: 403 })
    }

    await connectDatabase()

    const existingProduct = await Product.findById(params.id)
    if (!existingProduct || existingProduct.branchId !== (user.branchId || "default")) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    await Product.findByIdAndDelete(params.id)

    return NextResponse.json({ message: "Product deleted successfully" })
  } catch (error) {
    console.error("Delete product error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
