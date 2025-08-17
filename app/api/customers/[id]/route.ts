import { type NextRequest, NextResponse } from "next/server"
import { connectDatabase, Customer } from "../../../../src/db"
import { getCurrentUser } from "../../../../src/lib/auth"

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const updates = await req.json()
    const { name, email, phone, address } = updates

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Customer name is required" }, { status: 400 })
    }

    await connectDatabase()

    const existingCustomer = await Customer.findById(params.id)
    if (!existingCustomer || existingCustomer.branchId !== (user.branchId || "default")) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

    const customer = await Customer.findByIdAndUpdate(
      params.id,
      {
        name: name.trim(),
        email: email?.trim() || undefined,
        phone: phone?.trim() || undefined,
        address: address?.trim() || undefined,
      },
      { new: true },
    )

    return NextResponse.json({
      customer,
      message: "Customer updated successfully",
    })
  } catch (error) {
    console.error("Update customer error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    await connectDatabase()

    const existingCustomer = await Customer.findById(params.id)
    if (!existingCustomer || existingCustomer.branchId !== (user.branchId || "default")) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

    await Customer.findByIdAndDelete(params.id)

    return NextResponse.json({ message: "Customer deleted successfully" })
  } catch (error) {
    console.error("Delete customer error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
