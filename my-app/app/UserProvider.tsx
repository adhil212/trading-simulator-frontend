"use client"

import { createContext, useContext, useState, ReactNode } from "react"

type User = {
  id?: number
  username?: string
  email?: string
} | null

type UserContextType = {
  user: User
  setUser: (user: User) => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(() => {
    if (typeof window === "undefined") return null

    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      try {
        return JSON.parse(storedUser) as User
      } catch {
        localStorage.removeItem("user")
      }
    }

    const username = localStorage.getItem("username")
    if (username) {
      return { username }
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
