import { type NextRequest, NextResponse } from "next/server"
import { connectDatabase, User } from "../../../../src/db"
import { setAuthCookie } from "../../../../src/lib/auth"

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, role = "cashier" } = await req.json()

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Email, password, and name are required" }, { status: 400 })
    }

    if (!["manager", "cashier"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    await connectDatabase()

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 409 })
    }

    const user = new User({
      email,
      password,
      name,
      role,
      branchId: "default", // TODO: Handle multi-branch setup
    })
    await user.save()

    const authUser = {
      id: user._id!.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
      branchId: user.branchId,
    }

    await setAuthCookie(authUser)

    return NextResponse.json({
      user: authUser,
      message: "Registration successful",
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
