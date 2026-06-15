"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const limit = 50;

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      });
      if (search) params.set("search", search);

      const res = await fetch(`${API}/api/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
        setError(data.error);
        return;
      }
      setUsers(data.users || []);
      setTotal(data.total || 0);
    } catch {
      toast.error("Failed to fetch users");
      setError("Failed to fetch users. Check your connection.");
    } finally {
      setLoading(false);
    }
  }, [search, offset]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const totalPages = useMemo(() => Math.ceil(total / limit), [total, limit]);
  const currentPage = useMemo(() => Math.floor(offset / limit) + 1, [offset, limit]);

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-white">User Management</h1>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
          />
          <input
            type="text"
            placeholder="Search by username or email..."
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setOffset(0);
            }}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-green-500/50 text-sm"
          />
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 overflow-hidden bg-[#111318]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-zinc-500 border-b border-zinc-800 bg-zinc-900/50">
                <th className="text-left py-2.5 sm:py-3 px-3 sm:px-4 hidden md:table-cell">ID</th>
                <th className="text-left py-2.5 sm:py-3 px-3 sm:px-4">Username</th>
                <th className="text-left py-2.5 sm:py-3 px-3 sm:px-4 hidden sm:table-cell">Email</th>
                <th className="text-right py-2.5 sm:py-3 px-3 sm:px-4">Balance</th>
                <th className="text-right py-2.5 sm:py-3 px-3 sm:px-4">Trades</th>
                <th className="text-center py-2.5 sm:py-3 px-3 sm:px-4">Admin</th>
                <th className="text-right py-2.5 sm:py-3 px-3 sm:px-4 hidden sm:table-cell">Joined</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 hidden md:table-cell"><div className="h-4 w-8 bg-zinc-800/50 rounded" /></td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4"><div className="h-4 w-28 bg-zinc-800/50 rounded" /></td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 hidden sm:table-cell"><div className="h-4 w-36 bg-zinc-800/50 rounded" /></td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4"><div className="h-4 w-16 bg-zinc-800/50 rounded ml-auto" /></td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4"><div className="h-4 w-10 bg-zinc-800/50 rounded ml-auto" /></td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4"><div className="h-5 w-8 bg-zinc-800/50 rounded-full mx-auto" /></td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 hidden sm:table-cell"><div className="h-4 w-20 bg-zinc-800/50 rounded ml-auto" /></td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-zinc-500">
                    {error || "No users found"}
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-zinc-800/50 hover:bg-zinc-800/20"
                  >
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-zinc-400 hidden md:table-cell">{user.id}</td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4">
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="text-white hover:text-green-500 transition-colors"
                      >
                        {user.username}
                      </Link>
                    </td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-zinc-400 hidden sm:table-cell">{user.email}</td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-right text-white">
                      ₹{Number(user.balance).toLocaleString()}
                    </td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-right text-zinc-400">
                      {user.trades_count}
                    </td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-center">
                      {user.is_admin ? (
                        <span className="text-green-500 text-xs font-medium bg-green-500/10 px-2 py-0.5 rounded-full">
                          Yes
                        </span>
                      ) : (
                        <span className="text-zinc-600 text-xs">No</span>
                      )}
                    </td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-right text-zinc-400 text-xs hidden sm:table-cell">
                      {user.created_at
                        ? new Date(user.created_at).toLocaleDateString()
                        : "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm flex-col sm:flex-row gap-3">
          <span className="text-zinc-500">
            Showing {offset + 1}-{Math.min(offset + limit, total)} of {total}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setOffset(Math.max(0, offset - limit))}
              disabled={offset === 0}
              className="p-2 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-zinc-400">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setOffset(offset + limit)}
              disabled={offset + limit >= total}
              className="p-2 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
