"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Activity, BarChart3 } from "lucide-react";
import toast from "react-hot-toast";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function AdminMarket() {
  const [prices, setPrices] = useState<any>(null);
  const [status, setStatus] = useState<any>(null);
  const [assetTypes, setAssetTypes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMarketData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");

      const [statusRes, assetsRes] = await Promise.all([
        fetch(`${API}/api/admin/market/status`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API}/api/market/assets`),
      ]);

      const statusData = await statusRes.json();
      if (statusData.error) {
        toast.error(statusData.error);
        setError(statusData.error);
        return;
      }
      setPrices(statusData.prices || {});
      setStatus(statusData.status || null);

      const assetsData = await assetsRes.json();
      if (assetsData.success) {
        const map: Record<string, string> = {};
        assetsData.data.forEach((a: any) => { map[a.symbol] = a.type; });
        setAssetTypes(map);
      }
    } catch {
      toast.error("Failed to fetch market data");
      setError("Failed to fetch market data. Check your connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMarketData();
  }, [fetchMarketData]);


  const typeIcons: Record<string, string> = {
    forex: "💶",
    commodity: "🥇",
    crypto: "₿",
    index: "📈",
  };

  const getSymbolIcon = (symbol: string) => {
    return typeIcons[assetTypes[symbol]] || "📊";
  };

  if (loading && !error) {
    return (
      <div className="p-4 sm:p-6 flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500" />
      </div>
    );
  }

  const symbols = prices ? Object.keys(prices) : [];

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Market Controls</h1>
        <button
          onClick={fetchMarketData}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 transition-colors text-sm"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {error && !status && (
        <div className="rounded-xl border border-red-900/50 p-4 bg-red-950/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {status && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-zinc-800 p-4 bg-[#111318]">
            <div className="flex items-center gap-2 mb-1">
              <Activity size={14} className="text-zinc-500" />
              <span className="text-xs text-zinc-500">Engine</span>
            </div>
            <span
              className={`text-lg font-bold ${
                status.isRunning ? "text-green-500" : "text-red-500"
              }`}
            >
              {status.isRunning ? "Running" : "Stopped"}
            </span>
          </div>
          <div className="rounded-xl border border-zinc-800 p-4 bg-[#111318]">
            <span className="text-xs text-zinc-500">Update Interval</span>
            <p className="text-lg font-bold text-white">
              {status.updateInterval}ms
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800 p-4 bg-[#111318]">
            <span className="text-xs text-zinc-500">Total Assets</span>
            <p className="text-lg font-bold text-white">
              {status.assetsCount}
            </p>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-zinc-800 p-5 bg-[#111318]">
        <h2 className="text-lg font-semibold text-white mb-4">
          <BarChart3 size={18} className="inline mr-2" />
          Asset Prices
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-zinc-500 border-b border-zinc-800">
                <th className="text-left py-2.5 sm:py-3 px-3 sm:px-4">Symbol</th>
                <th className="text-right py-2.5 sm:py-3 px-3 sm:px-4">Bid</th>
                <th className="text-right py-2.5 sm:py-3 px-3 sm:px-4">Ask</th>
                <th className="text-right py-2.5 sm:py-3 px-3 sm:px-4">Last</th>
                <th className="text-right py-2.5 sm:py-3 px-3 sm:px-4 hidden sm:table-cell">Change</th>
                <th className="text-right py-2.5 sm:py-3 px-3 sm:px-4 hidden sm:table-cell">Volume</th>
              </tr>
            </thead>
            <tbody>
              {symbols.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-zinc-500">
                    {error || "No assets available."}
                  </td>
                </tr>
              ) : (symbols.map((symbol) => {
                const p = prices[symbol];
                const isPositive = p.change >= 0;
                return (
                  <tr
                    key={symbol}
                    className="border-b border-zinc-800/50 hover:bg-zinc-800/20"
                  >
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4">
                      <span className="mr-2">{getSymbolIcon(symbol)}</span>
                      <span className="text-white font-medium">
                        {p.name || symbol}
                      </span>
                    </td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-right">
                      ₹{p.bid?.toFixed?.(p.bid < 10 ? 4 : 2) ?? "-"}
                    </td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-right">
                      ₹{p.ask?.toFixed?.(p.ask < 10 ? 4 : 2) ?? "-"}
                    </td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-right text-white font-medium">
                      ₹{p.last?.toFixed?.(p.last < 10 ? 4 : 2) ?? "-"}
                    </td>
                    <td
                      className={`py-2.5 sm:py-3 px-3 sm:px-4 text-right hidden sm:table-cell ${
                        isPositive ? "text-green-500" : "text-red-500"
                      }`}
                    >
                      {isPositive ? "+" : ""}
                      {p.changePercent?.toFixed?.(2)}%
                    </td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-right text-zinc-400 hidden sm:table-cell">
                      {p.volume?.toLocaleString?.() || "-"}
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>



    </div>
  );
}
