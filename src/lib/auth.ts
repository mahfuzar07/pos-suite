import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import { cookies } from "next/headers"
import { connectDatabase, User } from "../db"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export interface AuthUser {
  id: string
  email: string
  role: "manager" | "cashier"
  name: string
  branchId?: string
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: "7d" })
}

export function verifyToken(token: string): AuthUser | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthUser
  } catch {
    return null
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) return null

    const decoded = verifyToken(token)
    if (!decoded) return null

    await connectDatabase()
    const user = await User.findById(decoded.id)

    if (!user) return null

    return {
      id: user._id!.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
      branchId: user.branchId,
    }
  } catch {
    return null
  }
}

export async function setAuthCookie(user: AuthUser) {
  const token = generateToken(user)
  const cookieStore = await cookies()

  cookieStore.set("auth-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  })
}

export async function clearAuthCookie() {
  const cookieStore = await cookies()
  cookieStore.delete("auth-token")
}

export function requireAuth(allowedRoles?: ("manager" | "cashier")[]) {
  return async (user: AuthUser | null) => {
    if (!user) {
      throw new Error("Authentication required")
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      throw new Error("Insufficient permissions")
    }

    return user
  }
}
