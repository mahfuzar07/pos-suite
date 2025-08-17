import { type NextRequest, NextResponse } from "next/server"
import { connectDatabase, Product } from "../../../../../src/db"
import { getCurrentUser } from "../../../../../src/lib/auth"

export async function GET(req: NextRequest, { params }: { params: { barcode: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    await connectDatabase()
    const product = await Product.findOne({
      barcode: params.barcode,
      branchId: user.branchId || "default",
    })

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    return NextResponse.json({ product })
  } catch (error) {
    console.error("Get product by barcode error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
