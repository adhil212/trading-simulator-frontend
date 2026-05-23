"use client"

import { useState, useEffect } from "react"
import { History, Download, Loader2 } from "lucide-react"

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
  { label: "1 Day", val: 1 },
  { label: "1 Week", val: 7 },
  { label: "1 Month", val: 30 },
  { label: "3 Months", val: 90 },
  { label: "All", val: 0 },
]

export default function HistoryPage() {
  const [filter, setFilter] = useState(1)
  const [trades, setTrades] = useState<ApiClosedTrade[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      setError("Not authenticated")
      setLoading(false)
      return
    }

    fetch("http://localhost:5000/api/trading/closed?limit=1000", {
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
    const diffTime = today.getTime() - tradeDate.getTime()
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))
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
      time: `${formatShortDate(t.entry_date)}  →  ${formatShortDate(t.exit_date)}`,
    }
  })

  const totalPnl = displayTrades.reduce((sum, t) => sum + t.pnl, 0)
  const winTrades = displayTrades.filter((t) => t.pnl >= 0).length
  const lossTrades = displayTrades.filter((t) => t.pnl < 0).length

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
      <div className="min-h-screen bg-[#09090b] text-zinc-400 p-6 md:p-12 flex items-center justify-center">
        <Loader2 className="animate-spin text-green-500" size={32} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#09090b] text-zinc-400 p-6 md:p-12 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-2">Failed to load trade history</p>
          <p className="text-zinc-500 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-400 p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-2">
            <History className="text-green-500" size={20} />
            <span className="text-zinc-500 uppercase tracking-widest text-xs font-bold">Trading Activity</span>
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight">Trade History</h1>
        </div>

        <div className="flex gap-3 mb-6">
          {filters.map((f) => (
            <button
              key={f.val}
              onClick={() => setFilter(f.val)}
              className={`px-3 py-1.5 text-xs rounded-lg ${
                filter === f.val
                  ? "bg-green-500/20 text-green-400 border border-green-500/30"
                  : "bg-[#111318] text-zinc-500 border border-zinc-800 hover:text-white"
              }`}
            >
              {f.label}
            </button>
          ))}
          <button onClick={download} className="ml-auto p-2 bg-[#111318] border border-zinc-800 rounded-xl hover:bg-zinc-800">
            <Download size={20} />
          </button>
        </div>

        <div className="bg-[#111318] border border-zinc-800 rounded-[2rem] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-zinc-500 text-xs uppercase tracking-wider border-b border-zinc-800">
                  <th className="px-8 py-6">Asset</th>
                  <th className="px-8 py-6">Qty</th>
                  <th className="px-8 py-6">Entry</th>
                  <th className="px-8 py-6">Exit</th>
                  <th className="px-8 py-6">P&L</th>
                  <th className="px-8 py-6">Time</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {displayTrades.map((t, i) => (
                  <tr key={i} className="border-b border-zinc-800/50 hover:bg-zinc-800/20">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${t.pnl >= 0 ? "bg-green-500" : "bg-red-500"}`} />
                        <span className="text-white font-bold">{t.asset}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-zinc-300">{t.qty}</td>
                    <td className="px-8 py-6 text-zinc-300">₹{t.entryPrice}</td>
                    <td className="px-8 py-6 text-zinc-300">₹{t.exitPrice}</td>
                    <td className="px-8 py-6">
                      <span className={`font-bold ${t.pnl >= 0 ? "text-green-400" : "text-red-400"}`}>
                        {t.pnl >= 0 ? "+" : ""}₹{t.pnlFormatted}
                      </span>
                      <span className={`ml-2 text-xs ${t.pnl >= 0 ? "text-green-400/70" : "text-red-400/70"}`}>
                        ({t.pnl >= 0 ? "+" : ""}{t.pnlPercent}%)
                      </span>
                    </td>
                    <td className="px-8 py-6 text-zinc-500 text-xs">{t.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-6 border-t border-zinc-800 bg-[#0d0f14]">
            <div className="flex items-center justify-between">
              <p className="text-xs text-zinc-600">Showing {displayTrades.length} of {trades.length} trades</p>
              <div className="flex items-center gap-8">
                <div className="text-right">
                  <p className="text-xs text-zinc-600 uppercase tracking-wider">Total P&L</p>
                  <p className={`text-lg font-bold ${totalPnl >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {totalPnl >= 0 ? "+" : ""}₹{formatPrice(totalPnl)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-zinc-600 uppercase tracking-wider">Win / Loss</p>
                  <p className="text-lg font-bold">
                    <span className="text-green-400">{winTrades}</span>
                    <span className="text-zinc-600"> / </span>
                    <span className="text-red-400">{lossTrades}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
