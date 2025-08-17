"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to POS page by default
    router.push("/pos")
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div>Redirecting to POS...</div>
    </div>
  )
}
