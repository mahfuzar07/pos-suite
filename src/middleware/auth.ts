import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "../lib/auth"

export function withAuth(handler: Function, allowedRoles?: ("manager" | "cashier")[]) {
  return async (req: NextRequest, ...args: any[]) => {
    try {
      const token = req.cookies.get("auth-token")?.value

      if (!token) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 })
      }

      const user = verifyToken(token)
      if (!user) {
        return NextResponse.json({ error: "Invalid token" }, { status: 401 })
      }

      if (allowedRoles && !allowedRoles.includes(user.role)) {
        return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
      }
      // Add user to request context
      ;(req as any).user = user

      return handler(req, ...args)
    } catch (error) {
      return NextResponse.json({ error: "Authentication failed" }, { status: 401 })
    }
  }
}
