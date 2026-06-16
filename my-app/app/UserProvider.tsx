"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

type User = {
  id?: number
  username?: string
  email?: string
  is_admin?: boolean
} | null

type UserContextType = {
  user: User
  setUser: (user: User) => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

function decodeJwtPayload(token: string) {
  try {
    const parts = token.split(".")
    if (parts.length !== 3) return null
    const payload = parts[1]
    const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
    return JSON.parse(decoded)
  } catch {
    return null
  }
}

export function isTokenExpired(token: string): boolean {
  const decoded = decodeJwtPayload(token)
  if (!decoded || !decoded.exp) return true
  return Date.now() >= decoded.exp * 1000
}

let refreshPromise: Promise<boolean> | null = null

async function tryRefreshToken(): Promise<boolean> {
  const refreshToken = localStorage.getItem("refreshToken")
  if (!refreshToken) return false

  try {
    const res = await fetch(`${API_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    })
    if (!res.ok) return false
    const data = await res.json()
    localStorage.setItem("token", data.token)
    localStorage.setItem("refreshToken", data.refreshToken)
    if (data.user) {
      localStorage.setItem("user", JSON.stringify(data.user))
    }
    return true
  } catch {
    return false
  }
}

function logout() {
  localStorage.removeItem("token")
  localStorage.removeItem("refreshToken")
  localStorage.removeItem("user")
  localStorage.removeItem("username")
  if (typeof window !== "undefined") {
    window.location.href = "/auth"
  }
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(() => {
    if (typeof window === "undefined") return null

    const token = localStorage.getItem("token")
    if (token && isTokenExpired(token)) {
      const refreshToken = localStorage.getItem("refreshToken")
      if (!refreshToken) {
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        localStorage.removeItem("username")
        return null
      }
      return null
    }

    const decoded = token ? decodeJwtPayload(token) : null

    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser) as User
        return { ...parsed, is_admin: decoded?.is_admin || parsed?.is_admin || false }
      } catch {
        localStorage.removeItem("user")
      }
    }

    const username = localStorage.getItem("username")
    if (username) {
      return { username, is_admin: decoded?.is_admin || false }
    }

    return null
  })

  useEffect(() => {
    if (typeof window === "undefined") return

    const originalFetch = window.fetch.bind(window)

    window.fetch = async (input, init) => {
      const response = await originalFetch(input, init)

      if (response.status === 401) {
        const urlStr = typeof input === "string" ? input : (input instanceof Request ? input.url : "")
        if (urlStr.includes("/api/auth/")) return response

        if (!refreshPromise) {
          refreshPromise = tryRefreshToken()
        }

        const refreshed = await refreshPromise
        refreshPromise = null

        if (refreshed) {
          const newToken = localStorage.getItem("token")
          const newUser = localStorage.getItem("user")
          if (newUser) {
            try { setUser(JSON.parse(newUser)) } catch { /* ignore */ }
          }
          const headers = new Headers(init?.headers)
          headers.set("Authorization", `Bearer ${newToken}`)
          return originalFetch(input, { ...init, headers })
        }

        logout()
      }

      return response
    }

    const refreshInterval = setInterval(() => {
      const token = localStorage.getItem("token")
      if (!token) return
      const decoded = decodeJwtPayload(token)
      if (!decoded?.exp) return
      if (decoded.exp * 1000 - Date.now() < 60 * 1000) {
        tryRefreshToken().then((ok) => {
          if (ok) {
            const newUser = localStorage.getItem("user")
            if (newUser) {
              try { setUser(JSON.parse(newUser)) } catch { /* ignore */ }
            }
          }
        })
      }
    }, 5 * 60 * 1000)

    return () => {
      window.fetch = originalFetch
      clearInterval(refreshInterval)
    }
  }, [])

  useEffect(() => {
    function handleStorage(e: StorageEvent) {
      if (e.key === "token" && !e.newValue) {
        setUser(null)
      }
      if (e.key === "token" && e.newValue) {
        const decoded = decodeJwtPayload(e.newValue)
        const storedUser = localStorage.getItem("user")
        if (storedUser) {
          try {
            const parsed = JSON.parse(storedUser)
            setUser({ ...parsed, is_admin: decoded?.is_admin || false })
          } catch {
            setUser(null)
          }
        }
      }
    }
    window.addEventListener("storage", handleStorage)
    return () => window.removeEventListener("storage", handleStorage)
  }, [])

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error("useUser must be used within UserProvider")
  return ctx
}

export { logout, decodeJwtPayload }
