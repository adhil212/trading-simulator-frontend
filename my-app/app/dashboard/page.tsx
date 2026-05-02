"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { TrendingUp, TrendingDown } from "lucide-react"

const ASSETS = [
  { id: "BTC", name: "BTC/USD", label: "Bitcoin", api: "https://api.gold-api.com/price/BTC" },
  { id: "XAG", name: "XAG/USD", label: "Silver", api: "https://api.gold-api.com/price/XAG" },
  { id: "XAU", name: "XAU/USD", label: "Gold", api: "https://api.gold-api.com/price/XAU" },
]

export default function DashboardPage() {
  const [prices, setPrices] = useState<Record<string, number>>({})
  const [totalBalance, setTotalBalance] = useState<number | null>(null)

  const fetchPrices = async () => {
    const newPrices: Record<string, number> = {}
    for (const asset of ASSETS) {
      try {
        const res = await fetch(asset.api)
        const result = await res.json()
        newPrices[asset.id] = Number(result.price)
      } catch (err) {
        console.error(err)
      }
    }
    setPrices(newPrices)
  }

  useEffect(() => {
    fetchPrices()
    const interval = setInterval(fetchPrices, 15000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) return

    async function fetchWallet() {
      try {
        const res = await fetch("http://localhost:5000/api/wallet", {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        setTotalBalance(data.total || data.balance || 0)
      } catch (err) {
        console.error(err)
      }
    }

    fetchWallet()
  }, [])

  return (
    <div className="p-6 md:p-16 max-w-7xl mx-auto min-h-screen bg-[#09090b]">
       <div className="flex justify-between items-center mb-12">
        <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight">
          Total Balance:{" "}
          <span className="text-green-400 drop-shadow-[0_0_20px_rgba(74,222,128,0.8)]">
            {totalBalance !== null ? `$${totalBalance.toLocaleString()}` : ""}
          </span>
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {ASSETS.map((asset) => {
          const price = prices[asset.id] || 0
          const isUp = price > 0

          return (
            <Link key={asset.id} href={`/dashboard/${asset.id}`}>
              <div className="bg-[#1c1f26] border border-zinc-800 rounded-2xl p-6 shadow-xl cursor-pointer hover:scale-[1.02] transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700 font-bold text-white text-xs">
                    {asset.id[0]}
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">{asset.name}</h3>
                    <span className="text-[10px] text-zinc-500 uppercase">{asset.label}</span>
                  </div>
                </div>

                <div className="text-3xl font-bold text-white">
                  ${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                </div>
                <div className={`flex items-center text-sm font-bold mt-1 ${isUp ? 'text-green-400' : 'text-zinc-400'}`}>
                  {isUp ? <TrendingUp size={16} className="mr-1" /> : <TrendingDown size={16} className="mr-1" />}
                  Live
                </div>

                <div className="flex gap-3 mt-4">
                  <button className="flex-1 py-2 rounded-xl border border-green-500/50 text-green-400 font-bold hover:bg-green-500/20 transition-all text-sm">
                    Buy
                  </button>
                  <button className="flex-1 py-2 rounded-xl border border-red-500/50 text-red-400 font-bold hover:bg-red-500/20 transition-all text-sm">
                    Sell
                  </button>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}