"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Wallet, Layers, History, Trash2, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import toast from "react-hot-toast";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function AdminUserDetail() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchUserDetail = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await res.json();
      if (d.error) {
        toast.error(d.error);
        setError(d.error);
        return;
      }
      setData(d);
    } catch {
      toast.error("Failed to fetch user details");
      setError("Failed to fetch user details. Check your connection.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUserDetail();
  }, [fetchUserDetail]);

  const handleDelete = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await res.json();
      if (d.success) {
        toast.success("User deleted successfully");
        router.push("/admin/users");
      } else {
        toast.error(d.error || "Failed to delete user");
      }
    } catch {
      toast.error("Failed to delete user");
    } finally {
      setDeleteLoading(false);
    }
  }, [userId, router]);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 animate-pulse">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="h-9 w-9 rounded-lg bg-zinc-800/50" />
          <div className="space-y-1.5">
            <div className="h-6 w-40 bg-zinc-800/50 rounded" />
            <div className="h-4 w-56 bg-zinc-800/50 rounded" />
          </div>
          <div className="h-5 w-12 bg-zinc-800/50 rounded-full" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-xl border border-zinc-800 p-5 bg-[#111318] space-y-3">
              <div className="h-4 w-28 bg-zinc-800/50 rounded" />
              <div className="h-7 w-20 bg-zinc-800/50 rounded" />
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-zinc-800 p-5 bg-[#111318]">
          <div className="h-5 w-32 bg-zinc-800/50 rounded mb-4" />
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-8 bg-zinc-800/30 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data || !data.user) {
    return (
      <div className="p-4 sm:p-6 text-center text-zinc-500">{error || "User not found"}</div>
    );
  }

  const { user, wallet, portfolio, trades, transactions } = data;

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex items-center gap-4 flex-wrap">
        <Link
          href="/admin/users"
          className="p-2 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">{user.username}</h1>
          <p className="text-sm text-zinc-500">{user.email}</p>
        </div>
        {user.is_admin && (
          <span className="text-xs font-medium text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">
            Admin
          </span>
        )}
        {!user.is_admin && (
          <button
            onClick={() => setShowDelete(true)}
            className="ml-auto p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
            title="Delete user"
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-zinc-800 p-5 bg-[#111318]">
          <span className="text-sm text-zinc-500 flex items-center gap-2 mb-2">
            <Wallet size={16} /> Wallet Balance
          </span>
          <p className="text-2xl font-bold text-white">
            ₹{Number(wallet?.balance || 0).toLocaleString()}
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800 p-5 bg-[#111318]">
          <div className="flex items-center gap-2 mb-2">
            <Layers size={16} className="text-zinc-500" />
            <span className="text-sm text-zinc-500">Positions</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {portfolio?.length || 0}
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800 p-5 bg-[#111318]">
          <div className="flex items-center gap-2 mb-2">
            <History size={16} className="text-zinc-500" />
            <span className="text-sm text-zinc-500">Total Trades</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {trades?.total || 0}
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800 p-5 bg-[#111318]">
          <div className="flex items-center gap-2 mb-2">
            <ArrowDownLeft size={16} className="text-zinc-500" />
            <span className="text-sm text-zinc-500">Transactions</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {transactions?.total || 0}
          </p>
        </div>
      </div>

      {portfolio && portfolio.length > 0 && (
        <div className="rounded-xl border border-zinc-800 p-5 bg-[#111318]">
          <h2 className="text-lg font-semibold text-white mb-4">Positions</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-zinc-500 border-b border-zinc-800">
                  <th className="text-left py-2.5 sm:py-3 px-3 sm:px-4">Symbol</th>
                  <th className="text-right py-2.5 sm:py-3 px-3 sm:px-4">Quantity</th>
                  <th className="text-right py-2.5 sm:py-3 px-3 sm:px-4">Entry Price</th>
                  <th className="text-right py-2.5 sm:py-3 px-3 sm:px-4">Current Price</th>
                  <th className="text-right py-2.5 sm:py-3 px-3 sm:px-4">Value</th>
                  <th className="text-right py-2.5 sm:py-3 px-3 sm:px-4">P&L</th>
                </tr>
              </thead>
              <tbody>
                {portfolio.map((pos: any) => (
                  <tr
                    key={pos.symbol}
                    className="border-b border-zinc-800/50"
                  >
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-white font-medium">
                      {pos.symbol}
                    </td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-right">
                      {Number(pos.quantity).toFixed(4)}
                    </td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-right">
                      ₹{Number(pos.entryPrice).toFixed(2)}
                    </td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-right">
                      ₹{Number(pos.currentPrice).toFixed(2)}
                    </td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-right">
                      ₹{Number(pos.positionValue).toFixed(2)}
                    </td>
                    <td
                      className={`py-2.5 sm:py-3 px-3 sm:px-4 text-right font-medium ${
                        Number(pos.unrealizedPnL) >= 0
                          ? "text-green-500"
                          : "text-red-500"
                      }`}
                    >
                      ₹{Number(pos.unrealizedPnL).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {trades?.trades?.length > 0 && (
        <div className="rounded-xl border border-zinc-800 p-5 bg-[#111318]">
          <h2 className="text-lg font-semibold text-white mb-4">
            Recent Trades
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-zinc-500 border-b border-zinc-800">
                  <th className="text-left py-2.5 sm:py-3 px-3 sm:px-4">Symbol</th>
                  <th className="text-center py-2.5 sm:py-3 px-3 sm:px-4">Type</th>
                  <th className="text-right py-2.5 sm:py-3 px-3 sm:px-4">Quantity</th>
                  <th className="text-right py-2.5 sm:py-3 px-3 sm:px-4 hidden sm:table-cell">Price</th>
                  <th className="text-right py-2.5 sm:py-3 px-3 sm:px-4">Total</th>
                  <th className="text-right py-2.5 sm:py-3 px-3 sm:px-4">Date</th>
                </tr>
              </thead>
              <tbody>
                {trades.trades.map((trade: any) => (
                  <tr
                    key={trade.id}
                    className="border-b border-zinc-800/50"
                  >
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-white">{trade.symbol}</td>
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
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-right text-zinc-400 text-xs">
                      {new Date(trade.executed_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}      {transactions?.transactions?.length > 0 && (
        <div className="rounded-xl border border-zinc-800 p-5 bg-[#111318]">
          <h2 className="text-lg font-semibold text-white mb-4">
            Recent Transactions
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-zinc-500 border-b border-zinc-800">
                  <th className="text-left py-2.5 sm:py-3 px-3 sm:px-4">Type</th>
                  <th className="text-right py-2.5 sm:py-3 px-3 sm:px-4">Amount</th>
                  <th className="text-center py-2.5 sm:py-3 px-3 sm:px-4">Status</th>
                  <th className="text-right py-2.5 sm:py-3 px-3 sm:px-4">Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.transactions.map((tx: any) => (
                  <tr key={tx.id} className="border-b border-zinc-800/50">
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          tx.type === "DEPOSIT"
                            ? "bg-green-500/20 text-green-400"
                            : "bg-red-500/20 text-red-400"
                        }`}>
                          {tx.type === "DEPOSIT" ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}
                        </div>
                        <span className="text-white">{tx.type}</span>
                      </div>
                    </td>
                    <td className={`py-2.5 sm:py-3 px-3 sm:px-4 text-right font-medium ${
                      tx.type === "DEPOSIT" ? "text-green-500" : "text-red-500"
                    }`}>
                      {tx.type === "DEPOSIT" ? "+" : "-"}₹{Number(tx.amount).toLocaleString()}
                    </td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-center">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        tx.status === "COMPLETED"
                          ? "text-green-500 bg-green-500/10"
                          : tx.status === "PENDING"
                          ? "text-yellow-500 bg-yellow-500/10"
                          : "text-red-500 bg-red-500/10"
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-right text-zinc-400 text-xs">
                      {new Date(tx.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => !deleteLoading && setShowDelete(false)}>
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-white mb-2">Delete User</h2>
            <p className="text-sm text-zinc-400 mb-6">
              Are you sure you want to delete <span className="text-white font-medium">{user.username}</span>?
              This will permanently remove their wallet, portfolio, trades, and all associated data.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm disabled:opacity-50 transition-all"
              >
                {deleteLoading ? "Deleting..." : "Delete"}
              </button>
              <button
                onClick={() => setShowDelete(false)}
                disabled={deleteLoading}
                className="px-4 py-3 rounded-xl bg-zinc-700 hover:bg-zinc-600 text-white text-sm transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
