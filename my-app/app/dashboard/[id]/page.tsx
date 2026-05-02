"use client";

import { useParams } from "next/navigation"
import { useState, useEffect } from "react"
import { ArrowLeft, TrendingUp, TrendingDown } from "lucide-react"
import Link from "next/link"

const ASSET_API_MAP: Record<string, string> = {
  BTC: "https://api.gold-api.com/price/BTC",
  XAG: "https://api.gold-api.com/price/XAG",
  XAU: "https://api.gold-api.com/price/XAU",
}

const ASSET_NAMES: Record<string, string> = {
  BTC: "BTC/USD",
  XAG: "XAG/USD",
  XAU: "XAU/USD",
}

const TRADINGVIEW_SYMBOLS: Record<string, string> = {
  BTC: "BINANCE:BTCUSDT",
  XAG: "FX:XAGUSD",
  XAU: "FX:XAUUSD",
}

export default function AssetDetailPage() {
  const params = useParams()
  const symbol = params.id as string
  const [price, setPrice] = useState<number | null>(null)
  const [prevPrice, setPrevPrice] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!symbol || !ASSET_API_MAP[symbol]) {
      setLoading(false)
      return
    }

    async function fetchPrice() {
      try {
        const res = await fetch(ASSET_API_MAP[symbol])
        if (!res.ok) return
        const data = await res.json()
        const newPrice = Number(data.price)
        if (isNaN(newPrice)) return

        setPrevPrice(price)
        setPrice(newPrice)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchPrice()
    const interval = setInterval(fetchPrice, 1000)
    return () => clearInterval(interval)
  }, [symbol])

  useEffect(() => {
    if (!symbol || !TRADINGVIEW_SYMBOLS[symbol]) return

    const script = document.createElement("script")
    script.src = "https://s3.tradingview.com/tv.js"
    script.async = true
    script.onload = () => {
      // @ts-expect-error TradingView is loaded globally
      if (window.TradingView) {
        // @ts-expect-error TradingView is loaded globally
        new window.TradingView.widget({
          width: "100%",
          height: 500,
          symbol: TRADINGVIEW_SYMBOLS[symbol],
          interval: "15",
          timezone: "Etc/UTC",
          theme: "dark",
          style: "1",
          locale: "en",
          toolbar_bg: "#1c1f26",
          enable_publishing: false,
          allow_symbol_change: false,
          container_id: "tradingview_chart",
          studies: ["RSI@tv-basicstudies", "MACD@tv-basicstudies"],
        })
      }
    }

    const container = document.getElementById("tradingview_chart")
    if (container) container.innerHTML = ""

    document.body.appendChild(script)

    return () => {
      if (script.parentNode) script.parentNode.removeChild(script)
    }
  }, [symbol])

  const assetName = ASSET_NAMES[symbol] || symbol
  const isUp = price !== null && prevPrice !== null ? price >= prevPrice : true

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-400 font-sans p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-zinc-500 hover:text-white mb-8 transition-colors">
          <ArrowLeft size={20} />
          Back to Dashboard
        </Link>

        <div className="bg-[#111318] border border-zinc-800 rounded-[2.5rem] p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700 font-bold text-white">
                {symbol?.[0] || "?"}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">{assetName}</h1>
                <p className="text-zinc-500 text-sm">Symbol: {symbol}</p>
              </div>
            </div>

            {price && (
              <div className="text-right">
                <div className="text-4xl font-bold text-white">
                  ${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                </div>
                <div className={`flex items-center justify-end text-sm font-bold mt-1 ${isUp ? "text-green-400" : "text-red-400"}`}>
                  {isUp ? <TrendingUp size={16} className="mr-1" /> : <TrendingDown size={16} className="mr-1" />}
                  {prevPrice ? ((price - prevPrice) / prevPrice * 100).toFixed(2) : "0.00"}%
                </div>
              </div>
            )}
          </div>

          {loading ? (
            <div className="h-[500px] flex items-center justify-center">
              <p className="text-zinc-500">Loading chart...</p>
            </div>
          ) : (
            <div className="rounded-2xl overflow-hidden border border-zinc-800">
              <div id="tradingview_chart" className="w-full" style={{ height: "500px" }} />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mt-6">
            <button className="py-3 rounded-2xl border border-green-500/50 text-green-400 font-bold hover:bg-green-500/20 transition-all">
              Buy
            </button>
            <button className="py-3 rounded-2xl border border-red-500/50 text-red-400 font-bold hover:bg-red-500/20 transition-all">
              Sell
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
