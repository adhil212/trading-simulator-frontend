"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

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

function logout() {
  localStorage.removeItem("token")
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
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      localStorage.removeItem("username")
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
