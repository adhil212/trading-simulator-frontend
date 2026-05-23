"use client"

import { useEffect, useState } from "react"
import { TrendingUp, TrendingDown, Loader2 } from "lucide-react"
import { io, Socket } from "socket.io-client"

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
  const [growth, setGrowth] = useState<any>(null)

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      setError("Not authenticated")
      setLoading(false)
      return
    }

    const socket: Socket = io("http://localhost:5000", {
      transports: ["websocket"],
    })

    socket.on("connect", () => {
      socket.emit("getPortfolioData", { token }, (res: any) => {
        if (res.error) {
          setError(res.error)
        } else {
          setData(res)
        }
        setLoading(false)
      })
    })

    socket.on("priceUpdate", (updates: Record<string, { last: number }>) => {
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
    })

    socket.on("connect_error", (err) => {
      setError(err.message)
      setLoading(false)
    })

    return () => { socket.disconnect() }
  }, [])

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) return
    fetch("http://localhost:5000/api/portfolio/growth?days=1", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => { if (d.growthData) setGrowth(d) })
      .catch(() => {})
  }, [])

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
          <p className="text-red-400 text-lg mb-2">Failed to load portfolio</p>
          <p className="text-zinc-500 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  const positions = data?.portfolio?.positions || []
  const summary = data?.portfolio?.summary
  const totalValue = summary ? parseFloat(summary.totalValue) : 0
  const totalPnl = summary ? parseFloat(summary.totalUnrealizedPnL) : 0
  const pnlUp = totalPnl >= 0

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-400 p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-10">My Portfolio</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="bg-[#111318] border border-zinc-800 rounded-2xl p-8">
            <p className="text-zinc-500 text-sm mb-2">Total Value</p>
            <div className="flex items-baseline gap-3">
              <span className="text-5xl font-bold text-green-400">₹{totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div className="bg-[#111318] border border-zinc-800 rounded-2xl p-8">
            <p className="text-zinc-500 text-sm mb-2">Daily P&L</p>
            <div className="flex items-center gap-3">
              <span className={`text-5xl font-bold ${pnlUp ? "text-green-400" : "text-red-400"}`}>
                {pnlUp ? "+" : ""}₹{totalPnl.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              {pnlUp ? <TrendingUp className="text-green-400" size={32} /> : <TrendingDown className="text-red-400" size={32} />}
            </div>
          </div>
        </div>

        {/* Growth chart - temporarily disabled
        {growth?.growthData && growth.growthData.length > 1 && (
          <div className="bg-[#111318] border border-zinc-800 rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-bold text-lg">Portfolio Growth</h2>
              <span className="text-zinc-500 text-sm">{growth.period}</span>
            </div>
            <svg viewBox="0 0 600 200" className="w-full h-48" preserveAspectRatio="none">
              <defs>
                <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                </linearGradient>
              </defs>
              {(() => {
                const vals = growth.growthData.map((d: any) => d.balance)
                const mn = Math.min(...vals); const mx = Math.max(...vals)
                const rng = mx - mn || 1; const pad = 10; const w = 600; const h = 200
                const pw = w - pad * 2; const ph = h - pad * 2
                const pts = growth.growthData.map((d: any, i: number) => ({
                  x: pad + (i / (growth.growthData.length - 1)) * pw,
                  y: pad + ph - ((d.balance - mn) / rng) * ph,
                }))
                const line = pts.map((p: any, i: number) => `${i === 0 ? 'M' : 'L'}${p.x} ${p.y}`).join(' ')
                return (
                  <>
                    <path d={`${line} L${pts[pts.length - 1].x} ${h} L${pts[0].x} ${h} Z`} fill="url(#growthGrad)" />
                    <path d={line} fill="none" stroke="#22c55e" strokeWidth="2" strokeLinejoin="round" />
                    {[pts[0], pts[pts.length - 1]].map((p, i) => (
                      <circle key={i} cx={p.x} cy={p.y} r="4" fill="#22c55e" stroke="#09090b" strokeWidth="2" />
                    ))}
                  </>
                )
              })()}
            </svg>
          </div>
        )}
        */}

        <div className="bg-[#111318] border border-zinc-800 rounded-2xl overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="text-zinc-500 text-xs uppercase tracking-wider border-b border-zinc-800">
                <th className="px-8 py-5">Asset</th>
                <th className="px-8 py-5">Qty</th>
                <th className="px-8 py-5">Avg Price</th>
                <th className="px-8 py-5">Current</th>
                <th className="px-8 py-5 text-right">P&L</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {positions.map((a, i) => (
                <tr key={i} className="border-b border-zinc-800/50 hover:bg-zinc-800/20">
                  <td className="px-8 py-6 text-white font-medium">{a.symbol.replace(/_/g, "/")}</td>
                  <td className="px-8 py-6 text-zinc-300">{a.quantity.toLocaleString()}</td>
                  <td className="px-8 py-6 text-zinc-300">₹{a.entryPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td className="px-8 py-6 text-zinc-300">₹{a.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td className={`px-8 py-6 text-right font-bold flex justify-end items-center gap-2 ${a.unrealizedPnL >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {a.unrealizedPnL >= 0 ? "+" : ""}₹{a.unrealizedPnL.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    {a.unrealizedPnL >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  </td>
                </tr>
              ))}
              {positions.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-8 py-12 text-center text-zinc-500">No open positions</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
