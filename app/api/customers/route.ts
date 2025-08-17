import { type NextRequest, NextResponse } from "next/server"
import { connectDatabase, Customer } from "../../../src/db"
import { getCurrentUser } from "../../../src/lib/auth"

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    await connectDatabase()
    const customers = await Customer.find({ branchId: user.branchId || "default" })

    return NextResponse.json({ customers })
  } catch (error) {
    console.error("Get customers error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const customerData = await req.json()
    const { name, email, phone, address } = customerData

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Customer name is required" }, { status: 400 })
    }

    await connectDatabase()

    const customer = new Customer({
      name: name.trim(),
      email: email?.trim() || undefined,
      phone: phone?.trim() || undefined,
      address: address?.trim() || undefined,
      branchId: user.branchId || "default",
    })
    await customer.save()

    return NextResponse.json({
      customer,
      message: "Customer created successfully",
    })
  } catch (error) {
    console.error("Create customer error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
