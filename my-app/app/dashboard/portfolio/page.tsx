"use client"

import { useEffect, useState } from "react"
import { TrendingUp, TrendingDown, Loader2 } from "lucide-react"
import { getSocket } from "../../../lib/socket"

type Position = {
  symbol: string
  quantity: number
  entryPrice: number
  currentPrice: number
  positionValue: number
  unrealizedPnL: number
  unrealizedPnLPercent: number
}

type Summary = {
  totalPositions: number
  totalValue: string
  totalUnrealizedPnL: string
  totalUnrealizedPercent: string
}

type PortfolioData = {
  portfolio: { positions: Position[]; summary: Summary }
  wallet: { balance: number }
}

export default function PortfolioPage() {
  const [data, setData] = useState<PortfolioData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      setError("Not authenticated")
      setLoading(false)
      return
    }

    const socket = getSocket()

    const onConnect = () => {
      socket.emit("getPortfolioData", {}, (res: any) => {
        if (res.error) setError(res.error)
        else setData(res)
        setLoading(false)
      })
    }

    const onPriceUpdate = (updates: Record<string, { last: number }>) => {
      setData((prev) => {
        if (!prev) return prev
        const positions = prev.portfolio.positions.map((pos) => {
          const update = updates[pos.symbol]
          if (!update) return pos
          const currentPrice = update.last
          const positionValue = pos.quantity * currentPrice
          const unrealizedPnL = (currentPrice - pos.entryPrice) * pos.quantity
          const unrealizedPnLPercent =
            pos.entryPrice > 0 ? ((currentPrice - pos.entryPrice) / pos.entryPrice) * 100 : 0
          return { ...pos, currentPrice, positionValue, unrealizedPnL, unrealizedPnLPercent }
        })
        const totalValue = positions.reduce((s, p) => s + p.positionValue, 0)
        const totalUnrealizedPnL = positions.reduce((s, p) => s + p.unrealizedPnL, 0)
        const totalUnrealizedPercent =
          totalValue > 0 ? (totalUnrealizedPnL / (totalValue - totalUnrealizedPnL)) * 100 : 0
        return {
          ...prev,
          portfolio: {
            positions,
            summary: {
              ...prev.portfolio.summary,
              totalValue: totalValue.toFixed(2),
              totalUnrealizedPnL: totalUnrealizedPnL.toFixed(2),
              totalUnrealizedPercent: totalUnrealizedPercent.toFixed(2),
            },
          },
        }
      })
    }

    const onReconnect = () => {
      socket.emit("getPortfolioData", {}, (res: any) => {
        if (res.error) setError(res.error)
        else setData(res)
        setLoading(false)
      })
    }

    socket.on("connect", onConnect)
    socket.on("priceUpdate", onPriceUpdate)
    socket.on("reconnect", onReconnect)
    if (socket.connected) onConnect()

    return () => {
      socket.off("connect", onConnect)
      socket.off("priceUpdate", onPriceUpdate)
      socket.off("reconnect", onReconnect)
    }
  }, [])

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
          <p className="text-red-400 font-semibold mb-1">Failed to load portfolio</p>
          <p className="text-zinc-600 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  const positions = data?.portfolio?.positions || []
  const summary = data?.portfolio?.summary
  const totalValue = summary ? parseFloat(summary.totalValue) : 0
  const totalPnl = summary ? parseFloat(summary.totalUnrealizedPnL) : 0
  const totalPct = summary ? parseFloat(summary.totalUnrealizedPercent) : 0
  const pnlUp = totalPnl >= 0

  // Largest position by value (for bar widths)
  const maxValue = Math.max(...positions.map((p) => p.positionValue), 1)

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-400">
      <div className="px-4 sm:px-6 lg:px-10 py-8 md:py-12">

        {/* ── Header ── */}
        <div className="mb-8">
          <p className="text-zinc-600 text-xs uppercase tracking-widest font-semibold mb-1">Open positions</p>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Portfolio</h1>
        </div>

        {/* ── Summary cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">

          {/* Total value */}
          <div className="bg-[#111114] border border-zinc-800 rounded-2xl p-5 sm:p-6">
            <p className="text-zinc-600 text-[10px] uppercase tracking-widest font-semibold mb-3">Holdings value</p>
            <p className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight">
              ₹{totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-zinc-700 text-xs mt-2 font-mono">
              {summary?.totalPositions ?? 0} position{(summary?.totalPositions ?? 0) !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Unrealized P&L */}
          <div className={`bg-[#111114] border rounded-2xl p-5 sm:p-6 ${pnlUp ? "border-emerald-500/20" : "border-red-500/20"}`}>
            <p className="text-zinc-600 text-[10px] uppercase tracking-widest font-semibold mb-3">Unrealized P&L</p>
            <div className="flex items-end gap-3">
              <p className={`text-3xl sm:text-4xl font-black font-mono tracking-tight ${pnlUp ? "text-emerald-400" : "text-red-400"}`}>
                {pnlUp ? "+" : ""}₹{totalPnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <span className={`text-sm font-bold mb-1 ${pnlUp ? "text-emerald-500" : "text-red-500"}`}>
                {pnlUp ? "▲" : "▼"} {Math.abs(totalPct).toFixed(2)}%
              </span>
            </div>
            <div className="mt-3 h-1 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${pnlUp ? "bg-emerald-500" : "bg-red-500"}`}
                style={{ width: `${Math.min(Math.abs(totalPct) * 5, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* ── Positions ── */}
        {positions.length === 0 ? (
          <div className="bg-[#111114] border border-zinc-800 rounded-2xl flex flex-col items-center justify-center py-24 px-8 text-center">
            {/* Mini candlestick illustration */}
            <div className="flex items-end gap-1.5 mb-6 opacity-20">
              {[32, 48, 28, 56, 40, 64, 44].map((h, i) => (
                <div key={i} className="flex flex-col items-center gap-0.5">
                  <div className="w-0.5 bg-zinc-400 rounded-full" style={{ height: h * 0.3 }} />
                  <div className="w-3 rounded-sm bg-zinc-400" style={{ height: h * 0.5 }} />
                  <div className="w-0.5 bg-zinc-400 rounded-full" style={{ height: h * 0.2 }} />
                </div>
              ))}
            </div>
            <p className="text-zinc-400 font-semibold text-base mb-1">No open positions</p>
            <p className="text-zinc-700 text-sm max-w-xs">Head to the dashboard, pick an asset, and place your first trade.</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block bg-[#111114] border border-zinc-800 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-zinc-800/60 flex items-center justify-between">
                <p className="text-zinc-600 text-[10px] uppercase tracking-widest font-semibold">Positions</p>
                <span className="text-zinc-700 text-xs font-mono">{positions.length} assets</span>
              </div>
              <table className="w-full text-left">
                <thead>
                  <tr className="text-zinc-700 text-[10px] uppercase tracking-widest border-b border-zinc-800/60">
                    <th className="px-6 py-3 font-semibold">Asset</th>
                    <th className="px-6 py-3 font-semibold">Qty</th>
                    <th className="px-6 py-3 font-semibold">Avg price</th>
                    <th className="px-6 py-3 font-semibold">Current</th>
                    <th className="px-6 py-3 font-semibold">Value</th>
                    <th className="px-6 py-3 font-semibold text-right">P&L</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map((a, i) => {
                    const up = a.unrealizedPnL >= 0
                    const barW = Math.round((a.positionValue / maxValue) * 100)
                    return (
                      <tr
                        key={a.symbol}
                        className="border-b border-zinc-800/40 last:border-0 hover:bg-zinc-800/20 transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white font-black text-xs shrink-0">
                              {a.symbol[0]}
                            </div>
                            <div>
                              <p className="text-white font-bold text-sm">{a.symbol.replace(/_/g, "/")}</p>
                              {/* allocation bar */}
                              <div className="mt-1 h-0.5 w-16 bg-zinc-800 rounded-full overflow-hidden">
                                <div className="h-full bg-zinc-500 rounded-full" style={{ width: `${barW}%` }} />
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-zinc-300 font-mono text-sm">{a.quantity.toLocaleString()}</td>
                        <td className="px-6 py-4 text-zinc-500 font-mono text-sm">
                          ₹{a.entryPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                        </td>
                        <td className="px-6 py-4 text-zinc-300 font-mono text-sm">
                          ₹{a.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                        </td>
                        <td className="px-6 py-4 text-zinc-400 font-mono text-sm">
                          ₹{a.positionValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className={`inline-flex flex-col items-end ${up ? "text-emerald-400" : "text-red-400"}`}>
                            <span className="font-black font-mono text-sm">
                              {up ? "+" : ""}₹{a.unrealizedPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            <span className="text-[10px] font-bold opacity-70">
                              {up ? "▲" : "▼"} {Math.abs(a.unrealizedPnLPercent).toFixed(2)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {positions.map((a) => {
                const up = a.unrealizedPnL >= 0
                const barW = Math.round((a.positionValue / maxValue) * 100)
                return (
                  <div key={a.symbol} className="bg-[#111114] border border-zinc-800 rounded-2xl p-4">
                    {/* Top row */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white font-black text-sm">
                          {a.symbol[0]}
                        </div>
                        <div>
                          <p className="text-white font-bold text-sm leading-none">{a.symbol.replace(/_/g, "/")}</p>
                          <p className="text-zinc-600 text-[10px] mt-0.5">{a.quantity.toLocaleString()} units</p>
                        </div>
                      </div>
                      <div className={`text-right ${up ? "text-emerald-400" : "text-red-400"}`}>
                        <p className="font-black font-mono text-sm">
                          {up ? "+" : ""}₹{a.unrealizedPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <p className="text-[10px] font-bold opacity-70">
                          {up ? "▲" : "▼"} {Math.abs(a.unrealizedPnLPercent).toFixed(2)}%
                        </p>
                      </div>
                    </div>

                    {/* Allocation bar */}
                    <div className="h-0.5 bg-zinc-800 rounded-full mb-3 overflow-hidden">
                      <div className="h-full bg-zinc-600 rounded-full" style={{ width: `${barW}%` }} />
                    </div>

                    {/* Price grid */}
                    <div className="grid grid-cols-3 gap-3 text-xs">
                      <div>
                        <p className="text-zinc-600 mb-0.5">Avg price</p>
                        <p className="text-zinc-300 font-mono font-medium">₹{a.entryPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      </div>
                      <div>
                        <p className="text-zinc-600 mb-0.5">Current</p>
                        <p className="text-zinc-300 font-mono font-medium">₹{a.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      </div>
                      <div>
                        <p className="text-zinc-600 mb-0.5">Value</p>
                        <p className="text-zinc-300 font-mono font-medium">₹{a.positionValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}