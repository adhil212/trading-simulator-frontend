"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LayoutDashboard, Briefcase, History, LogOut } from "lucide-react"
import { useUser } from "../UserProvider"

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: <LayoutDashboard size={20} /> },
  { name: "Portfolio", href: "/dashboard/portfolio", icon: <Briefcase size={20} /> },
  { name: "History", href: "/dashboard/history", icon: <History size={20} /> },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = useUser()
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = () => {
    localStorage.removeItem("token")
    router.push("/auth")
  }

  return (
    <div className="flex min-h-screen bg-[#0d0f14] text-zinc-400">
      <aside className="w-64 border-r border-zinc-800 p-6 flex flex-col gap-2">
        <div className="flex flex-col items-center gap-1 mb-8 px-2">
          <Link href="/" className="flex items-center gap-2 px-2">
            <span className="text-green-500 font-bold text-xl">TradeSim</span>
          </Link>
          {user?.username && (
            <span className="text-sm text-zinc-500">{user.username}</span>
          )}
        </div>

        <nav className="flex flex-col gap-2 flex-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? "bg-green-500/10 text-green-400 border border-green-500/30"
                    : "hover:bg-zinc-800/50 hover:text-zinc-200"
                }`}
              >
                {item.icon}
                <span className="font-medium">{item.name}</span>
              </Link>
            )
          })}
        </nav>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:bg-zinc-800/50 hover:text-zinc-200 w-full"
        >
          <LogOut size={20} />
          <span className="font-medium">Logout</span>
        </button>
      </aside>

      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
