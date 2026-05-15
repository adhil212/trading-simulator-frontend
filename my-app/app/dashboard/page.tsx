"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { io, Socket } from "socket.io-client"

type AssetInfo = {
  symbol: string
  name: string
  type: string
}

type PriceData = {
  last: number
  changePercent: number
}

type PricesState = {
  [key: string]: PriceData
}

export default function DashboardPage() {
  const [prices, setPrices] = useState<PricesState>({})
  const [assets, setAssets] = useState<AssetInfo[]>([])
  const [balance, setBalance] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch assets
  useEffect(() => {
    fetch("http://localhost:5000/api/market/assets")
      .then((r) => r.json())
      .then((d) => {
        console.log("ASSETS:", d)

        if (d.success) {
          setAssets(d.data)
        }
      })
      .catch((err) => {
        console.error("Assets fetch error:", err)
      })
  }, [])

  // Socket connection
  useEffect(() => {
    const socket: Socket = io("http://localhost:5000", {
      transports: ["websocket"],
    })

    socket.on("connect", () => {
      console.log("✅ Socket connected:", socket.id)
    })

    socket.on("priceUpdate", (data: PricesState) => {
      setPrices(data)
      setLoading(false)
    })

    socket.on("connect_error", (err) => {
      console.error("❌ Socket connection error:", err)
      setLoading(false)
    })

    socket.on("error", (err) => {
      console.error("❌ Socket error:", err)
    })

    socket.on("disconnect", () => {
      console.log("⚠️ Socket disconnected")
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  // Fetch portfolio positions
  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) return
    fetch("http://localhost:5000/api/trading/portfolio", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.positions) {
          const map: Record<string, number> = {}
          d.positions.forEach((p: { symbol: string; quantity: number }) => {
            map[p.symbol] = p.quantity
          })
          setPositions(map)
        }
      })
      .catch(() => {})
  }, [])

  // Fetch wallet balance
  useEffect(() => {
    const token = localStorage.getItem("token")

    if (!token) {
      console.warn("No token found")
      return
    }

    fetch("http://localhost:5000/api/wallet", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((r) => r.json())
      .then((d) => {
        console.log("WALLET:", d)

        setBalance(d.balance)
      })
      .catch((err) => {
        console.error("Wallet fetch error:", err)
      })
  }, [])

  const [positions, setPositions] = useState<Record<string, number>>({})
  const [trade, setTrade] = useState<{ symbol: string; type: "BUY" | "SELL"; quantity: string } | null>(null)
  const [trading, setTrading] = useState(false)

  async function executeTrade() {
    if (!trade) return
    const token = localStorage.getItem("token")
    if (!token) return
    setTrading(true)
    try {
      const res = await fetch(`http://localhost:5000/api/trading/${trade.type === "BUY" ? "buy" : "sell"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ symbol: trade.symbol, quantity: parseFloat(trade.quantity) }),
      })
      const data = await res.json()
      if (data.error) {
        alert(data.error)
      } else {
        const [balanceRes, portfolioRes] = await Promise.all([
          fetch("http://localhost:5000/api/wallet", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://localhost:5000/api/trading/portfolio", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ])
        const balanceData = await balanceRes.json()
        if (balanceData.balance !== undefined) setBalance(balanceData.balance)
        const portfolioData = await portfolioRes.json()
        if (portfolioData.positions) {
          const map: Record<string, number> = {}
          portfolioData.positions.forEach((p: { symbol: string; quantity: number }) => {
            map[p.symbol] = p.quantity
          })
          setPositions(map)
        }
        alert(`${trade.type} successful!`)
      }
    } catch (err) {
      alert("Trade failed")
    } finally {
      setTrading(false)
      setTrade(null)
    }
  }

  if (loading) {
    return (
      <div className="p-16 text-zinc-400">
        Loading market data...
      </div>
    )
  }

  return (
    <div className="p-6 md:p-16 max-w-7xl mx-auto min-h-screen bg-[#09090b]">
      <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight mb-12">
        Balance:{" "}
        <span className="text-green-400">
          {balance !== null
            ? `$${Number(balance).toLocaleString()}`
            : "$0"}
        </span>
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {assets.map((asset) => {
          const p = prices[asset.symbol]

          const last = p?.last ?? 0
          const change = p?.changePercent ?? 0

          const isUp = change >= 0

          return (
            <div
              key={asset.symbol}
              className="bg-[#1c1f26] border border-zinc-800 rounded-2xl p-6 shadow-xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700 font-bold text-white text-xs">
                  {asset.symbol[0]}
                </div>

                <div>
                  <h3 className="text-white font-bold text-lg">
                    {asset.symbol}
                  </h3>

                  <span className="text-[10px] text-zinc-500 uppercase">
                    {asset.name} · {asset.type}
                  </span>
                  {positions[asset.symbol] !== undefined && (
                    <div className="text-[10px] text-zinc-400 mt-0.5">
                      Qty: {positions[asset.symbol]}
                    </div>
                  )}
                </div>
              </div>

              <Link href={`/dashboard/${asset.symbol}`}>
                <div className="text-3xl font-bold text-white">
                  $
                  {last.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 4,
                  })}
                </div>

                <div
                  className={`flex items-center text-sm font-bold mt-1 ${
                    isUp ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {isUp ? "▲" : "▼"} {change.toFixed(2)}%
                </div>
              </Link>

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setTrade({ symbol: asset.symbol, type: "BUY", quantity: "0" })}
                  className="flex-1 py-2 rounded-xl border border-green-500/50 text-green-400 font-bold hover:bg-green-500/20 transition-all text-sm text-center"
                >
                  Buy
                </button>

                <button
                  onClick={() => setTrade({ symbol: asset.symbol, type: "SELL", quantity: "0" })}
                  className="flex-1 py-2 rounded-xl border border-red-500/50 text-red-400 font-bold hover:bg-red-500/20 transition-all text-sm text-center"
                >
                  Sell
                </button>
              </div>

              {trade && trade.symbol === asset.symbol && (
                <div className="mt-4 p-3 rounded-xl bg-zinc-800/50 border border-zinc-700">
                  {(() => {
                    const price = last || 1
                    const maxQty = trade.type === "BUY"
                      ? Math.floor((balance ?? 0) / price)
                      : Math.floor(positions[asset.symbol] ?? 0)
                    const qty = Math.min(parseFloat(trade.quantity || "0"), maxQty)

                    return (
                      <>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-zinc-400">Qty: {qty}</span>
                          <span className="text-xs text-zinc-400">
                            ~${(qty * price).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max={maxQty || 1}
                          step="1"
                          value={qty}
                          onChange={(e) => setTrade({ ...trade, quantity: e.target.value })}
                          className="w-full h-2 rounded-full appearance-none cursor-pointer bg-zinc-700 accent-zinc-400 mb-2"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={executeTrade}
                            disabled={trading || qty === 0}
                            className={`flex-1 py-2 rounded-lg text-sm font-bold text-white ${
                              trade.type === "BUY"
                                ? "bg-green-600 hover:bg-green-500"
                                : "bg-red-600 hover:bg-red-500"
                            } disabled:opacity-50 transition-all`}
                          >
                            {trading ? "Processing..." : `Confirm ${trade.type}`}
                          </button>
                          <button
                            onClick={() => setTrade(null)}
                            className="px-3 py-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-white text-sm transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      </>
                    )
                  })()}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}