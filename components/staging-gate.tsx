"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { Sparkles, Lock } from "lucide-react"

/**
 * Staging auth gate — wraps the entire app when NEXT_PUBLIC_STAGING_AUTH=true.
 * The landing page (/) is always accessible. Everything else requires
 * a simple username/password stored in localStorage.
 *
 * This is a temporary gate while real OAuth is being built.
 * Does NOT replace the app's persona/entitlement auth system.
 */

const STAGING_USER = "odum"
const STAGING_PASS = "QGeF2!@61"
const STORAGE_KEY = "staging-authenticated"

const IS_STAGING = process.env.NEXT_PUBLIC_STAGING_AUTH === "true"

// Public pages that don't require the staging password
const PUBLIC_PATHS = ["/"]

export function StagingGate({ children }: { children: React.ReactNode }) {
  if (!IS_STAGING) {
    return <>{children}</>
  }
  return <StagingAuthWall>{children}</StagingAuthWall>
}

/** Inner component — only mounted when staging auth is enabled */
function StagingAuthWall({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || ""
  const [authenticated, setAuthenticated] = React.useState(false)
  const [checking, setChecking] = React.useState(true)
  const [username, setUsername] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [error, setError] = React.useState("")

  React.useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === "true") {
      setAuthenticated(true)
    }
    setChecking(false)
  }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (username === STAGING_USER && password === STAGING_PASS) {
      localStorage.setItem(STORAGE_KEY, "true")
      setAuthenticated(true)
    } else {
      setError("Invalid credentials")
    }
  }

  if (checking) return null
  // Landing page is always accessible
  if (PUBLIC_PATHS.includes(pathname)) return <>{children}</>
  if (authenticated) return <>{children}</>

  return (
    <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-xl bg-white/5 border border-white/10">
            <Sparkles className="size-6 text-white/60" />
          </div>
          <h1 className="text-xl font-semibold text-white">Odum Research</h1>
          <p className="text-sm text-white/40 mt-1">Staging Environment</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
            autoFocus
            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 text-sm"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 text-sm"
          />
          {error && <p className="text-sm text-red-400 text-center">{error}</p>}
          <button
            type="submit"
            className="w-full py-3 rounded-lg bg-white text-black font-medium text-sm hover:bg-white/90 transition-colors"
          >
            Enter
          </button>
        </form>

        <p className="text-center text-[10px] text-white/20 mt-6">
          <Lock className="inline size-3 mr-1" />
          Internal staging — not for public access
        </p>
      </div>
    </div>
  )
}
