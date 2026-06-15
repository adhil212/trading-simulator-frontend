"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function AdminCommissions() {
  const [commissions, setCommissions] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const limit = 50;

  const fetchCommissions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${API}/api/admin/commissions?limit=${limit}&offset=${offset}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
        setError(data.error);
        return;
      }
      setCommissions(data.commissions || []);
      setTotal(data.total || 0);
    } catch {
      toast.error("Failed to fetch commissions");
      setError("Failed to fetch commissions. Check your connection.");
    } finally {
      setLoading(false);
    }
  }, [offset]);

  useEffect(() => {
    fetchCommissions();
  }, [fetchCommissions]);

  const totalPages = useMemo(() => Math.ceil(total / limit), [total, limit]);
  const currentPage = useMemo(() => Math.floor(offset / limit) + 1, [offset, limit]);

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-white">Commission History</h1>

      <div className="rounded-xl border border-zinc-800 overflow-hidden bg-[#111318]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-zinc-500 border-b border-zinc-800 bg-zinc-900/50">
                <th className="text-left py-2.5 sm:py-3 px-3 sm:px-4 hidden md:table-cell">ID</th>
                <th className="text-left py-2.5 sm:py-3 px-3 sm:px-4 hidden md:table-cell">Trade ID</th>
                <th className="text-left py-2.5 sm:py-3 px-3 sm:px-4">User</th>
                <th className="text-left py-2.5 sm:py-3 px-3 sm:px-4">Symbol</th>
                <th className="text-center py-2.5 sm:py-3 px-3 sm:px-4">Type</th>
                <th className="text-right py-2.5 sm:py-3 px-3 sm:px-4">Amount</th>
                <th className="text-right py-2.5 sm:py-3 px-3 sm:px-4 hidden sm:table-cell">Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 hidden md:table-cell"><div className="h-4 w-8 bg-zinc-800/50 rounded" /></td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 hidden md:table-cell"><div className="h-4 w-10 bg-zinc-800/50 rounded" /></td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4"><div className="h-4 w-28 bg-zinc-800/50 rounded" /></td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4"><div className="h-4 w-16 bg-zinc-800/50 rounded" /></td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4"><div className="h-5 w-14 bg-zinc-800/50 rounded-full mx-auto" /></td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4"><div className="h-4 w-16 bg-zinc-800/50 rounded ml-auto" /></td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 hidden sm:table-cell"><div className="h-4 w-24 bg-zinc-800/50 rounded ml-auto" /></td>
                  </tr>
                ))
              ) : commissions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-6 sm:py-8 text-zinc-500">
                    {error || "No commissions yet"}
                  </td>
                </tr>
              ) : (
                commissions.map((c: any) => (
                  <tr
                    key={c.id}
                    className="border-b border-zinc-800/50 hover:bg-zinc-800/20"
                  >
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-zinc-400 hidden md:table-cell">{c.id}</td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-zinc-400 hidden md:table-cell">{c.trade_id}</td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4">
                      <span className="text-white">{c.username}</span>
                      <span className="text-zinc-600 text-xs ml-1 hidden sm:inline">
                        (ID: {c.user_id})
                      </span>
                    </td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-white font-medium">
                      {c.symbol}
                    </td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-center">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          c.type === "BUY"
                            ? "text-green-500 bg-green-500/10"
                            : "text-red-500 bg-red-500/10"
                        }`}
                      >
                        {c.type}
                      </span>
                    </td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-right text-yellow-500 font-medium">
                      ₹{Number(c.amount).toFixed(2)}
                    </td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-right text-zinc-400 text-xs hidden sm:table-cell">
                      {new Date(c.created_at).toLocaleString()}
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
