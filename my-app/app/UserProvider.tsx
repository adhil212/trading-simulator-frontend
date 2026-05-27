"use client"

import { createContext, useContext, useState, ReactNode } from "react"

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

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(() => {
    if (typeof window === "undefined") return null

    const token = localStorage.getItem("token")
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
