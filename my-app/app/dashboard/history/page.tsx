"use client"

import { useState, useEffect } from "react"
import { Download, Loader2 } from "lucide-react"

type ApiClosedTrade = {
  id: number
  symbol: string
  entry_price: string
  exit_price: string
  quantity: string
  realized_pnl: string
  realized_pnl_percent: string
  entry_date: string
  exit_date: string
}

function formatPrice(val: string | number): string {
  const n = typeof val === "string" ? parseFloat(val) : val
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  })
}

const filters = [
  { label: "1D", val: 1 },
  { label: "1W", val: 7 },
  { label: "1M", val: 30 },
  { label: "3M", val: 90 },
  { label: "All", val: 0 },
]

export default function HistoryPage() {
  const [filter, setFilter] = useState(1)
  const [trades, setTrades] = useState<ApiClosedTrade[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) { setError("Not authenticated"); setLoading(false); return }

    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/trading/closed?limit=1000`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error)
        setTrades(d.closedTrades || [])
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const filtered = trades.filter((t) => {
    if (filter === 0) return true
    const tradeDate = new Date(t.exit_date)
    tradeDate.setHours(0, 0, 0, 0)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const diffDays = Math.round((today.getTime() - tradeDate.getTime()) / (1000 * 60 * 60 * 24))
    return diffDays >= 0 && diffDays < filter
  })

  const displayTrades = filtered.map((t) => {
    const pnl = parseFloat(t.realized_pnl)
    return {
      asset: t.symbol.replace(/_/g, "/"),
      qty: formatPrice(t.quantity),
      entryPrice: formatPrice(t.entry_price),
      exitPrice: formatPrice(t.exit_price),
      pnl,
      pnlFormatted: formatPrice(t.realized_pnl),
      pnlPercent: parseFloat(t.realized_pnl_percent).toFixed(2),
      time: `${formatShortDate(t.entry_date)} → ${formatShortDate(t.exit_date)}`,
    }
  })

  const totalPnl = displayTrades.reduce((sum, t) => sum + t.pnl, 0)
  const winTrades = displayTrades.filter((t) => t.pnl >= 0).length
  const lossTrades = displayTrades.filter((t) => t.pnl < 0).length
  const winRate = displayTrades.length > 0 ? ((winTrades / displayTrades.length) * 100).toFixed(0) : "0"

  const download = () => {
    let csv = "Asset,Quantity,Entry Price,Exit Price,P&L,P&L%,Period\n"
    displayTrades.forEach((t) => {
      csv += `${t.asset},${t.qty},₹${t.entryPrice},₹${t.exitPrice},₹${t.pnlFormatted},${t.pnlPercent}%,${t.time}\n`
    })
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `trades_${filter}_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <Loader2 className="animate-spin text-emerald-500" size={24} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 font-semibold mb-1">Failed to load trade history</p>
          <p className="text-zinc-600 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-400">
      <div className="px-4 sm:px-6 lg:px-10 py-8 md:py-12">

        {/* ── Header ── */}
        <div className="mb-8">
          <p className="text-zinc-600 text-xs uppercase tracking-widest font-semibold mb-1">Trading activity</p>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">History</h1>
        </div>

        {/* ── Summary cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-[#111114] border border-zinc-800 rounded-2xl p-4 sm:p-5">
            <p className="text-zinc-600 text-[10px] uppercase tracking-widest font-semibold mb-2">Total P&L</p>
            <p className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${totalPnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {totalPnl >= 0 ? "+" : ""}₹{formatPrice(totalPnl)}
            </p>
          </div>
          <div className="bg-[#111114] border border-zinc-800 rounded-2xl p-4 sm:p-5">
            <p className="text-zinc-600 text-[10px] uppercase tracking-widest font-semibold mb-2">Win rate</p>
            <p className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight">{winRate}%</p>
          </div>
          <div className="bg-[#111114] border border-zinc-800 rounded-2xl p-4 sm:p-5">
            <p className="text-zinc-600 text-[10px] uppercase tracking-widest font-semibold mb-2">Trades</p>
            <p className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight">{displayTrades.length}</p>
          </div>
          <div className="bg-[#111114] border border-zinc-800 rounded-2xl p-4 sm:p-5">
            <p className="text-zinc-600 text-[10px] uppercase tracking-widest font-semibold mb-2">Win / Loss</p>
            <p className="text-2xl sm:text-3xl font-black font-mono tracking-tight">
              <span className="text-emerald-400">{winTrades}</span>
              <span className="text-zinc-700 font-bold"> / </span>
              <span className="text-red-400">{lossTrades}</span>
            </p>
          </div>
        </div>

        {/* ── Filter + export row ── */}
        <div className="flex flex-wrap gap-2 mb-4 items-center">
          {filters.map((f) => (
            <button
              key={f.val}
              onClick={() => setFilter(f.val)}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${
                filter === f.val
                  ? "bg-zinc-100 text-black"
                  : "bg-zinc-800/60 text-zinc-500 border border-zinc-700/60 hover:text-white hover:bg-zinc-700"
              }`}
            >
              {f.label}
            </button>
          ))}
          {displayTrades.length > 0 && (
            <button
              onClick={download}
              title="Export CSV"
              className="ml-auto flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-zinc-800/60 border border-zinc-700/60 text-zinc-500 hover:text-white hover:bg-zinc-700 text-xs font-bold transition-all"
            >
              <Download size={13} />
              Export
            </button>
          )}
        </div>

        {/* ── Empty state ── */}
        {displayTrades.length === 0 ? (
          <div className="bg-[#111114] border border-zinc-800 rounded-2xl flex flex-col items-center justify-center py-24 px-8 text-center">
            <div className="flex items-end gap-1.5 mb-6 opacity-20">
              {[28, 44, 20, 52, 36, 60, 40, 56, 32, 48].map((h, i) => (
                <div
                  key={i}
                  className={`w-3 rounded-t-sm ${i % 3 !== 1 ? "bg-emerald-400" : "bg-red-400"}`}
                  style={{ height: h }}
                />
              ))}
            </div>
            <p className="text-zinc-400 font-semibold text-base mb-1">No trades found</p>
            <p className="text-zinc-700 text-sm max-w-xs">
              {filter === 0 ? "Close a position from your portfolio to see it here." : "No trades closed in this period."}
            </p>
          </div>
        ) : (
          <>
            {/* ── Desktop table ── */}
            <div className="hidden md:block bg-[#111114] border border-zinc-800 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-zinc-800/60 flex items-center justify-between">
                <p className="text-zinc-600 text-[10px] uppercase tracking-widest font-semibold">Closed trades</p>
                <span className="text-zinc-700 text-xs font-mono">{displayTrades.length} trades</span>
              </div>

              <table className="w-full text-left">
                <thead>
                  <tr className="text-zinc-700 text-[10px] uppercase tracking-widest border-b border-zinc-800/60">
                    <th className="px-6 py-3 font-semibold">Asset</th>
                    <th className="px-6 py-3 font-semibold">Qty</th>
                    <th className="px-6 py-3 font-semibold">Entry</th>
                    <th className="px-6 py-3 font-semibold">Exit</th>
                    <th className="px-6 py-3 font-semibold">Period</th>
                    <th className="px-6 py-3 font-semibold text-right">P&L</th>
                  </tr>
                </thead>
                <tbody>
                  {displayTrades.map((t, i) => {
                    const trade = filtered[i]
                    const up = t.pnl >= 0
                    return (
                      <tr key={trade?.id || i} className="border-b border-zinc-800/40 last:border-0 hover:bg-zinc-800/20 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white font-black text-xs shrink-0">
                              {t.asset[0]}
                            </div>
                            <span className="text-white font-bold text-sm">{t.asset}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-zinc-400 font-mono text-sm">{t.qty}</td>
                        <td className="px-6 py-4 text-zinc-500 font-mono text-sm">₹{t.entryPrice}</td>
                        <td className="px-6 py-4 text-zinc-300 font-mono text-sm">₹{t.exitPrice}</td>
                        <td className="px-6 py-4 text-zinc-600 text-xs font-mono">{t.time}</td>
                        <td className="px-6 py-4 text-right">
                          <div className={`inline-flex flex-col items-end ${up ? "text-emerald-400" : "text-red-400"}`}>
                            <span className="font-black font-mono text-sm">
                              {up ? "+" : ""}₹{t.pnlFormatted}
                            </span>
                            <span className="text-[10px] font-bold opacity-70">
                              {up ? "▲" : "▼"} {Math.abs(parseFloat(t.pnlPercent)).toFixed(2)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              {/* Table footer */}
              <div className="px-6 py-4 border-t border-zinc-800/60 bg-zinc-950/40 flex items-center justify-between">
                <p className="text-zinc-700 text-xs font-mono">{displayTrades.length} of {trades.length} trades</p>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-zinc-700 text-[10px] uppercase tracking-wider font-semibold mb-0.5">Period P&L</p>
                    <p className={`text-base font-black font-mono ${totalPnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {totalPnl >= 0 ? "+" : ""}₹{formatPrice(totalPnl)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Mobile cards ── */}
            <div className="md:hidden space-y-2">
              {displayTrades.map((t, i) => {
                const trade = filtered[i]
                const up = t.pnl >= 0
                return (
                  <div key={trade?.id || i} className="bg-[#111114] border border-zinc-800 rounded-2xl p-4">
                    {/* Top */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white font-black text-sm">
                          {t.asset[0]}
                        </div>
                        <div>
                          <p className="text-white font-bold text-sm leading-none">{t.asset}</p>
                          <p className="text-zinc-600 text-[10px] mt-0.5 font-mono">{t.qty} units</p>
                        </div>
                      </div>
                      <div className={`text-right ${up ? "text-emerald-400" : "text-red-400"}`}>
                        <p className="font-black font-mono text-sm">
                          {up ? "+" : ""}₹{t.pnlFormatted}
                        </p>
                        <p className="text-[10px] font-bold opacity-70">
                          {up ? "▲" : "▼"} {Math.abs(parseFloat(t.pnlPercent)).toFixed(2)}%
                        </p>
                      </div>
                    </div>

                    {/* Price row */}
                    <div className="grid grid-cols-3 gap-3 text-xs">
                      <div>
                        <p className="text-zinc-600 mb-0.5">Entry</p>
                        <p className="text-zinc-300 font-mono">₹{t.entryPrice}</p>
                      </div>
                      <div>
                        <p className="text-zinc-600 mb-0.5">Exit</p>
                        <p className="text-zinc-300 font-mono">₹{t.exitPrice}</p>
                      </div>
                      <div>
                        <p className="text-zinc-600 mb-0.5">Period</p>
                        <p className="text-zinc-500 font-mono text-[10px]">{t.time}</p>
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* Mobile footer */}
              <div className="flex items-center justify-between px-1 pt-3 pb-1 text-xs">
                <span className="text-zinc-700 font-mono">{displayTrades.length} of {trades.length}</span>
                <div className="flex items-center gap-4">
                  <span className={`font-black font-mono ${totalPnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {totalPnl >= 0 ? "+" : ""}₹{formatPrice(totalPnl)}
                  </span>
                  <span className="font-mono">
                    <span className="text-emerald-400">{winTrades}</span>
                    <span className="text-zinc-700">/</span>
                    <span className="text-red-400">{lossTrades}</span>
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}