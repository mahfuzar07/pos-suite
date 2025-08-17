import { type NextRequest, NextResponse } from "next/server"
import { clearAuthCookie } from "../../../../src/lib/auth"

export async function POST(req: NextRequest) {
  try {
    await clearAuthCookie()
    return NextResponse.json({ message: "Logout successful" })
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
