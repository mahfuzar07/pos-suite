import { type NextRequest, NextResponse } from "next/server"
import { connectDatabase, User } from "../../../../src/db"
import { setAuthCookie } from "../../../../src/lib/auth"
import bcrypt from "bcryptjs"

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    await connectDatabase()
    const user = await User.findOne({ email })

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

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
      message: "Login successful",
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
