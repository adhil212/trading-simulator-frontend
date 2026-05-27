"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ArrowLeftRight,
  BarChart3,
  LogOut,
  UserCircle,
  Menu,
  X,
  Shield,
} from "lucide-react";
import { useUser } from "../UserProvider";

const navItems = [
  {
    name: "Dashboard",
    href: "/admin",
    icon: <LayoutDashboard size={20} />,
  },
  {
    name: "Users",
    href: "/admin/users",
    icon: <Users size={20} />,
  },
  {
    name: "Trades",
    href: "/admin/trades",
    icon: <ArrowLeftRight size={20} />,
  },
  {
    name: "Market",
    href: "/admin/market",
    icon: <BarChart3 size={20} />,
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, setUser } = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (mounted && user && !user.is_admin) {
      router.replace("/dashboard");
    }
  }, [user, mounted]);

  useEffect(() => { setMounted(true); }, []);

  const closeSidebar = () => setSidebarOpen(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("username");
    setUser(null);
    router.push("/auth");
  };

  if (!mounted) return null;

  if (user && !user.is_admin) {
    return (
      <div className="flex min-h-screen bg-[#0d0f14] text-zinc-400 items-center justify-center">
        <div className="text-center">
          <Shield size={48} className="mx-auto mb-4 text-red-500" />
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="mb-4">You do not have admin privileges.</p>
          <Link
            href="/dashboard"
            className="text-green-500 hover:text-green-400 underline"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0d0f14] text-zinc-400">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={closeSidebar}
        />
      )}

      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-400 hover:text-white transition-colors"
        aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside
        className={`w-64 border-r border-zinc-800 p-6 flex flex-col gap-2 fixed md:static inset-y-0 left-0 z-50 transform transition-transform duration-200 ease-in-out bg-[#0d0f14] ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        <div className="flex flex-col items-center gap-1 mb-8 px-2">
          <Link href="/admin" className="flex items-center gap-2 px-2">
            <Shield size={20} className="text-green-500" />
            <span className="text-green-500 font-bold text-xl">Admin</span>
          </Link>
          <Link href="/dashboard">
            <UserCircle size={23} />
          </Link>
          {mounted && user?.username && <span>{user.username}</span>}
        </div>

        <nav className="flex flex-col gap-2 flex-1">
          {navItems.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeSidebar}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? "bg-green-500/10 text-green-400 border border-green-500/30"
                    : "hover:bg-zinc-800/50 hover:text-zinc-200"
                }`}
              >
                {item.icon}
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <Link
          href="/dashboard"
          className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:bg-zinc-800/50 hover:text-zinc-200 w-full"
        >
          <LayoutDashboard size={20} />
          <span className="font-medium">User Dashboard</span>
        </Link>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:bg-zinc-800/50 hover:text-zinc-200 w-full"
        >
          <LogOut size={20} />
          <span className="font-medium">Logout</span>
        </button>
      </aside>

      <main className="flex-1 overflow-y-auto pt-14 md:pt-0">{children}</main>
    </div>
  );
}
