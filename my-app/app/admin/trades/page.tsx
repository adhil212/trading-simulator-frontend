"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Search, ChevronLeft, ChevronRight, Download } from "lucide-react";
import toast from "react-hot-toast";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function AdminTrades() {
  const [trades, setTrades] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    symbol: "",
    type: "",
    user_id: "",
    date_from: "",
    date_to: "",
  });
  const [symbolInput, setSymbolInput] = useState("");
  const [userIdInput, setUserIdInput] = useState("");
  const [offset, setOffset] = useState(0);
  const limit = 50;

  useEffect(() => {
    const timer = setTimeout(() => setFilters(prev => ({ ...prev, symbol: symbolInput })), 300);
    return () => clearTimeout(timer);
  }, [symbolInput]);

  useEffect(() => {
    const timer = setTimeout(() => setFilters(prev => ({ ...prev, user_id: userIdInput })), 300);
    return () => clearTimeout(timer);
  }, [userIdInput]);

  const fetchTrades = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      });
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.set(key, value);
      });

      const res = await fetch(`${API}/api/admin/trades?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
        setError(data.error);
        return;
      }
      setTrades(data.trades || []);
      setTotal(data.total || 0);
    } catch {
      toast.error("Failed to fetch trades");
      setError("Failed to fetch trades. Check your connection.");
    } finally {
      setLoading(false);
    }
  }, [filters, offset]);

  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  const exportCsv = useCallback(() => {
    const headers = [
      "ID", "User", "Symbol", "Type", "Quantity",
      "Price", "Total Value", "Commission", "Date",
    ];
    const rows = trades.map((t) => [
      t.id,
      t.username,
      t.symbol,
      t.type,
      t.quantity,
      t.price,
      t.total_value,
      t.commission,
      new Date(t.executed_at).toISOString(),
    ]);
    const csv = [headers, ...rows].map((r) => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trades-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  }, [trades]);

  const totalPages = useMemo(() => Math.ceil(total / limit), [total, limit]);
  const currentPage = useMemo(() => Math.floor(offset / limit) + 1, [offset, limit]);

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-xl sm:text-2xl font-bold text-white">Trade Monitor</h1>
        <button
          onClick={exportCsv}
          disabled={trades.length === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 disabled:opacity-50 transition-colors text-sm"
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>

      <div className="overflow-x-auto">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3 min-w-[280px] sm:min-w-0">
        <input
          type="text"
          placeholder="Symbol..."
          value={symbolInput}
          onChange={(e) => {
            setSymbolInput(e.target.value);
            setOffset(0);
          }}
          className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-green-500/50 text-sm min-w-0"
        />
        <select
          value={filters.type}
          onChange={(e) => {
            setFilters({ ...filters, type: e.target.value });
            setOffset(0);
          }}
          className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-200 focus:outline-none focus:border-green-500/50 text-sm min-w-0"
        >
          <option value="">All Types</option>
          <option value="BUY">BUY</option>
          <option value="SELL">SELL</option>
        </select>
        <input
          type="text"
          placeholder="User ID..."
          value={userIdInput}
          onChange={(e) => {
            setUserIdInput(e.target.value);
            setOffset(0);
          }}
          className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-green-500/50 text-sm min-w-0"
        />
        <input
          type="date"
          value={filters.date_from}
          onChange={(e) => {
            setFilters({ ...filters, date_from: e.target.value });
            setOffset(0);
          }}
          className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-200 focus:outline-none focus:border-green-500/50 text-sm min-w-0"
        />
        <input
          type="date"
          value={filters.date_to}
          onChange={(e) => {
            setFilters({ ...filters, date_to: e.target.value });
            setOffset(0);
          }}
          className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-200 focus:outline-none focus:border-green-500/50 text-sm min-w-0"
        />
      </div>
      </div>

      <div className="rounded-xl border border-zinc-800 overflow-hidden bg-[#111318]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-zinc-500 border-b border-zinc-800 bg-zinc-900/50">
                <th className="text-left py-2.5 sm:py-3 px-3 sm:px-4 hidden md:table-cell">ID</th>
                <th className="text-left py-2.5 sm:py-3 px-3 sm:px-4">User</th>
                <th className="text-left py-2.5 sm:py-3 px-3 sm:px-4">Symbol</th>
                <th className="text-center py-2.5 sm:py-3 px-3 sm:px-4">Type</th>
                <th className="text-right py-2.5 sm:py-3 px-3 sm:px-4">Qty</th>
                <th className="text-right py-2.5 sm:py-3 px-3 sm:px-4 hidden sm:table-cell">Price</th>
                <th className="text-right py-2.5 sm:py-3 px-3 sm:px-4">Total</th>
                <th className="text-right py-2.5 sm:py-3 px-3 sm:px-4 hidden sm:table-cell">Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 hidden md:table-cell"><div className="h-4 w-8 bg-zinc-800/50 rounded" /></td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4"><div className="h-4 w-28 bg-zinc-800/50 rounded" /></td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4"><div className="h-4 w-16 bg-zinc-800/50 rounded" /></td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4"><div className="h-5 w-14 bg-zinc-800/50 rounded-full mx-auto" /></td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4"><div className="h-4 w-16 bg-zinc-800/50 rounded ml-auto" /></td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 hidden sm:table-cell"><div className="h-4 w-16 bg-zinc-800/50 rounded ml-auto" /></td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4"><div className="h-4 w-20 bg-zinc-800/50 rounded ml-auto" /></td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 hidden sm:table-cell"><div className="h-4 w-24 bg-zinc-800/50 rounded ml-auto" /></td>
                  </tr>
                ))
              ) : trades.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-6 sm:py-8 text-zinc-500">
                    {error || "No trades found"}
                  </td>
                </tr>
              ) : (
                trades.map((trade) => (
                  <tr
                    key={trade.id}
                    className="border-b border-zinc-800/50 hover:bg-zinc-800/20"
                  >
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-zinc-400 hidden md:table-cell">{trade.id}</td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4">
                      <span className="text-white">{trade.username}</span>
                      <span className="text-zinc-600 text-xs ml-1 hidden sm:inline">
                        (ID: {trade.user_id})
                      </span>
                    </td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-white font-medium">
                      {trade.symbol}
                    </td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-center">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          trade.type === "BUY"
                            ? "text-green-500 bg-green-500/10"
                            : "text-red-500 bg-red-500/10"
                        }`}
                      >
                        {trade.type}
                      </span>
                    </td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-right">
                      {Number(trade.quantity).toFixed(4)}
                    </td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-right hidden sm:table-cell">
                      ₹{Number(trade.price).toFixed(2)}
                    </td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-right">
                      ₹{Number(trade.total_value).toFixed(2)}
                    </td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-right text-zinc-400 text-xs hidden sm:table-cell">
                      {new Date(trade.executed_at).toLocaleString()}
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
