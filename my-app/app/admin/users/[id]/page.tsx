"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Wallet, Layers, History } from "lucide-react";
import toast from "react-hot-toast";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function AdminUserDetail() {
  const params = useParams();
  const userId = params.id as string;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserDetail = async () => {
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
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUserDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500" />
      </div>
    );
  }

  if (!data || !data.user) {
    return (
      <div className="p-6 text-center text-zinc-500">{error || "User not found"}</div>
    );
  }

  const { user, wallet, portfolio, trades } = data;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-zinc-800 p-5 bg-[#111318]">
          <span className="text-sm text-zinc-500 flex items-center gap-2 mb-2">
            <Wallet size={16} /> Wallet Balance
          </span>
          <p className="text-2xl font-bold text-white">
            ${Number(wallet?.balance || 0).toLocaleString()}
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
      </div>

      {portfolio && portfolio.length > 0 && (
        <div className="rounded-xl border border-zinc-800 p-5 bg-[#111318]">
          <h2 className="text-lg font-semibold text-white mb-4">Positions</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-zinc-500 border-b border-zinc-800">
                  <th className="text-left py-3 px-2">Symbol</th>
                  <th className="text-right py-3 px-2">Quantity</th>
                  <th className="text-right py-3 px-2">Entry Price</th>
                  <th className="text-right py-3 px-2">Current Price</th>
                  <th className="text-right py-3 px-2">Value</th>
                  <th className="text-right py-3 px-2">P&L</th>
                </tr>
              </thead>
              <tbody>
                {portfolio.map((pos: any) => (
                  <tr
                    key={pos.symbol}
                    className="border-b border-zinc-800/50"
                  >
                    <td className="py-3 px-2 text-white font-medium">
                      {pos.symbol}
                    </td>
                    <td className="py-3 px-2 text-right">
                      {Number(pos.quantity).toFixed(4)}
                    </td>
                    <td className="py-3 px-2 text-right">
                      ${Number(pos.entryPrice).toFixed(2)}
                    </td>
                    <td className="py-3 px-2 text-right">
                      ${Number(pos.currentPrice).toFixed(2)}
                    </td>
                    <td className="py-3 px-2 text-right">
                      ${Number(pos.positionValue).toFixed(2)}
                    </td>
                    <td
                      className={`py-3 px-2 text-right font-medium ${
                        Number(pos.unrealizedPnL) >= 0
                          ? "text-green-500"
                          : "text-red-500"
                      }`}
                    >
                      ${Number(pos.unrealizedPnL).toFixed(2)}
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
                  <th className="text-left py-3 px-2">Symbol</th>
                  <th className="text-center py-3 px-2">Type</th>
                  <th className="text-right py-3 px-2">Quantity</th>
                  <th className="text-right py-3 px-2">Price</th>
                  <th className="text-right py-3 px-2">Total</th>
                  <th className="text-right py-3 px-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {trades.trades.map((trade: any) => (
                  <tr
                    key={trade.id}
                    className="border-b border-zinc-800/50"
                  >
                    <td className="py-3 px-2 text-white">{trade.symbol}</td>
                    <td className="py-3 px-2 text-center">
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
                    <td className="py-3 px-2 text-right">
                      {Number(trade.quantity).toFixed(4)}
                    </td>
                    <td className="py-3 px-2 text-right">
                      ${Number(trade.price).toFixed(2)}
                    </td>
                    <td className="py-3 px-2 text-right">
                      ${Number(trade.total_value).toFixed(2)}
                    </td>
                    <td className="py-3 px-2 text-right text-zinc-400 text-xs">
                      {new Date(trade.executed_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}



    </div>
  );
}
