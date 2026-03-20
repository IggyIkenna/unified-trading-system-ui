"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

export interface AuthUser {
  email: string
  org: string
  role?: string
  services?: string[]
  entitlements?: string[]
}

export function useAuth() {
  const [user, setUser] = React.useState<AuthUser | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem("portal_user") || localStorage.getItem("odum_user")
      setUser(raw ? JSON.parse(raw) : null)
    } catch {
      setUser(null)
    }
    setLoading(false)
  }, [])

  function logout() {
    localStorage.removeItem("portal_user")
    localStorage.removeItem("odum_user")
    setUser(null)
  }

  return { user, loading, logout }
}
