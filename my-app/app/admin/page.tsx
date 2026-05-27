"use client";

import { useState, useEffect } from "react";
import {
  Users,
  ArrowLeftRight,
  DollarSign,
  TrendingUp,
  Activity,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error("Failed to fetch admin stats:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500" />
      </div>
    );
  }

  const statCards = [
    {
      label: "Total Users",
      value: stats?.users?.total ?? 0,
      icon: <Users size={24} />,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "Total Trades",
      value: stats?.trades?.total ?? 0,
      icon: <ArrowLeftRight size={24} />,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
    {
      label: "Total Volume",
      value: `$${Number(stats?.trades?.totalVolume ?? 0).toLocaleString()}`,
      icon: <DollarSign size={24} />,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      label: "Active Today",
      value: stats?.users?.activeToday ?? 0,
      icon: <Activity size={24} />,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
        <button
          onClick={fetchStats}
          className="px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 transition-colors text-sm"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-zinc-800 p-5 bg-[#111318]"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-zinc-500">{card.label}</span>
              <div className={`p-2 rounded-lg ${card.bg}`}>
                <span className={card.color}>{card.icon}</span>
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-zinc-800 p-5 bg-[#111318]">
          <h2 className="text-lg font-semibold text-white mb-4">
            User Signups (30 days)
          </h2>
          {stats?.charts?.usersOverTime?.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={stats.charts.usersOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="date" stroke="#71717a" fontSize={12} />
                <YAxis stroke="#71717a" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "#1c1f26",
                    border: "1px solid #27272a",
                    borderRadius: "8px",
                    color: "#e4e4e7",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-zinc-500 text-sm">No data yet</p>
          )}
        </div>

        <div className="rounded-xl border border-zinc-800 p-5 bg-[#111318]">
          <h2 className="text-lg font-semibold text-white mb-4">
            Trade Volume (30 days)
          </h2>
          {stats?.charts?.volumeOverTime?.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.charts.volumeOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="date" stroke="#71717a" fontSize={12} />
                <YAxis stroke="#71717a" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "#1c1f26",
                    border: "1px solid #27272a",
                    borderRadius: "8px",
                    color: "#e4e4e7",
                  }}
                />
                <Bar dataKey="volume" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-zinc-500 text-sm">No data yet</p>
          )}
        </div>
      </div>

      {stats?.topTraders?.length > 0 && (
        <div className="rounded-xl border border-zinc-800 p-5 bg-[#111318]">
          <h2 className="text-lg font-semibold text-white mb-4">
            Top Traders by P&L
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-zinc-500 border-b border-zinc-800">
                  <th className="text-left py-3 px-2">#</th>
                  <th className="text-left py-3 px-2">Username</th>
                  <th className="text-right py-3 px-2">Closed Trades</th>
                  <th className="text-right py-3 px-2">Total P&L</th>
                </tr>
              </thead>
              <tbody>
                {stats.topTraders.map((trader: any, i: number) => (
                  <tr
                    key={trader.id}
                    className="border-b border-zinc-800/50 hover:bg-zinc-800/20"
                  >
                    <td className="py-3 px-2 text-zinc-500">{i + 1}</td>
                    <td className="py-3 px-2 text-white">{trader.username}</td>
                    <td className="py-3 px-2 text-right">
                      {trader.closed_trades}
                    </td>
                    <td
                      className={`py-3 px-2 text-right font-medium ${
                        Number(trader.total_pnl) >= 0
                          ? "text-green-500"
                          : "text-red-500"
                      }`}
                    >
                      ${Number(trader.total_pnl).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {stats?.engineStatus && (
        <div className="rounded-xl border border-zinc-800 p-5 bg-[#111318]">
          <h2 className="text-lg font-semibold text-white mb-4">
            <TrendingUp size={18} className="inline mr-2" />
            Engine Status
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-zinc-500">Running:</span>{" "}
              <span
                className={
                  stats.engineStatus.isRunning
                    ? "text-green-500"
                    : "text-red-500"
                }
              >
                {stats.engineStatus.isRunning ? "Yes" : "No"}
              </span>
            </div>
            <div>
              <span className="text-zinc-500">Update Interval:</span>{" "}
              <span className="text-white">
                {stats.engineStatus.updateInterval}ms
              </span>
            </div>
            <div>
              <span className="text-zinc-500">Assets:</span>{" "}
              <span className="text-white">
                {stats.engineStatus.assetsCount}
              </span>
            </div>
            <div>
              <span className="text-zinc-500">Uptime:</span>{" "}
              <span className="text-white">
                {Math.floor(stats.engineStatus.uptime / 60)}m
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
