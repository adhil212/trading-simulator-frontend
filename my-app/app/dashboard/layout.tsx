"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  History,
  Wallet,
  LogOut,
  UserCircle,
  Menu,
  X,
  Shield,
} from "lucide-react";
import { useUser } from "../UserProvider";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Portfolio", href: "/dashboard/portfolio", icon: Briefcase },
  { name: "Wallet", href: "/dashboard/wallet", icon: Wallet },
  { name: "History", href: "/dashboard/history", icon: History },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, setUser } = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const closeSidebar = () => setSidebarOpen(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("username");
    setUser(null);
    router.push("/auth");
  };

  return (
    <div className="flex min-h-screen bg-[#09090b] text-zinc-400">

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Mobile menu toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-3.5 left-3.5 z-50 md:hidden p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
        aria-label={sidebarOpen ? "Close menu" : "Open menu"}
      >
        {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* ── Sidebar ── */}
      <aside
        className={`
          w-56 shrink-0 border-r border-zinc-800/60
          fixed md:static inset-y-0 left-0 z-50
          flex flex-col
          bg-[#09090b]
          transform transition-transform duration-200 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
      >
        {/* Brand */}
        <div className="px-5 pt-6 pb-5 border-b border-zinc-800/60">
          <Link href="/" className="flex items-center gap-2.5 group">
            {/* Logo mark — a small candlestick glyph */}
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" className="shrink-0">
              <rect x="9" y="1" width="4" height="3" rx="1" fill="#10b981"/>
              <rect x="9" y="7" width="4" height="8" rx="1" fill="#10b981"/>
              <rect x="10.5" y="4" width="1" height="3" fill="#10b981"/>
              <rect x="10.5" y="15" width="1" height="3" fill="#10b981"/>
              <rect x="2" y="6" width="4" height="6" rx="1" fill="#3f3f46"/>
              <rect x="3.5" y="3" width="1" height="3" fill="#3f3f46"/>
              <rect x="3.5" y="12" width="1" height="3" fill="#3f3f46"/>
              <rect x="16" y="5" width="4" height="7" rx="1" fill="#3f3f46"/>
              <rect x="17.5" y="2" width="1" height="3" fill="#3f3f46"/>
              <rect x="17.5" y="12" width="1" height="3" fill="#3f3f46"/>
            </svg>
            <span className="text-white font-black tracking-tight text-base">
              Trade<span className="text-emerald-400">Sim</span>
            </span>
          </Link>
        </div>

        {/* User info */}
        <div className="px-4 py-4 border-b border-zinc-800/60">
          <div className="flex items-center gap-3 px-1">
            <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
              {mounted && user?.username
                ? <span className="text-white font-bold text-sm">{user.username[0].toUpperCase()}</span>
                : <UserCircle size={16} className="text-zinc-500" />
              }
            </div>
            <div className="min-w-0">
              {mounted && user?.username
                ? <>
                    <p className="text-white text-sm font-semibold truncate leading-none">{user.username}</p>
                    <p className="text-zinc-600 text-[10px] mt-0.5 uppercase tracking-wider font-medium">Trader</p>
                  </>
                : <Link href="/auth" className="text-zinc-500 text-xs hover:text-white transition-colors">Sign in</Link>
              }
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
          <p className="text-[9px] text-zinc-700 uppercase tracking-widest font-bold px-2 mb-2">Navigation</p>

          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeSidebar}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
                  ${isActive
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "text-zinc-500 hover:text-white hover:bg-zinc-800/60"
                  }
                `}
              >
                <Icon size={16} className={isActive ? "text-emerald-400" : "text-zinc-600"} />
                {item.name}
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400" />
                )}
              </Link>
            );
          })}

          {/* Admin — only if admin */}
          {mounted && user?.is_admin && (
            <>
              <div className="my-3 border-t border-zinc-800/60" />
              <p className="text-[9px] text-zinc-700 uppercase tracking-widest font-bold px-2 mb-2">Admin</p>
              <Link
                href="/admin"
                onClick={closeSidebar}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-500 hover:text-white hover:bg-zinc-800/60 transition-all"
              >
                <Shield size={16} className="text-emerald-500" />
                <span className="text-emerald-500">Admin Panel</span>
              </Link>
            </>
          )}
        </nav>

        {/* Bottom — logout */}
        <div className="px-3 pb-5 border-t border-zinc-800/60 pt-3">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-600 hover:text-red-400 hover:bg-red-500/5 transition-all duration-150 group"
          >
            <LogOut size={16} className="group-hover:text-red-400 transition-colors" />
            Logout
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 min-w-0 overflow-y-auto pt-14 md:pt-0">
        {children}
      </main>
    </div>
  );
}