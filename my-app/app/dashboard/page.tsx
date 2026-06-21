"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState, memo } from "react"
import { Loader2, TrendingUp, TrendingDown, Lock } from "lucide-react"
import ChatPanel from "./ChatPanel"
import toast from "react-hot-toast"
import { getSocket } from "../../lib/socket"

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

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

// ─── Ticker bar ──────────────────────────────────────────────────────────────
function TickerBar({ prices, assets }: { prices: PricesState; assets: AssetInfo[] }) {
  if (!assets.length) return null
  const items = [...assets, ...assets]
  return (
    <div className="overflow-hidden border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm">
      <div
        className="flex gap-10 py-2.5 animate-ticker whitespace-nowrap"
        style={{ animationDuration: `${Math.max(items.length * 3, 20)}s` }}
      >
        {items.map((a, i) => {
          const p = prices[a.symbol]
          const up = (p?.changePercent ?? 0) >= 0
          return (
            <span key={i} className="inline-flex items-center gap-2 text-sm font-mono">
              <span className="text-zinc-400 font-bold tracking-wider text-xs">{a.symbol}</span>
              <span className="text-white font-semibold">
                ₹{(p?.last ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className={`text-xs font-bold ${up ? "text-emerald-400" : "text-red-400"}`}>
                {up ? "▲" : "▼"} {Math.abs(p?.changePercent ?? 0).toFixed(2)}%
              </span>
            </span>
          )
        })}
      </div>
    </div>
  )
}

// ─── Guest banner ─────────────────────────────────────────────────────────────
function GuestBanner() {
  return (
    <div className="bg-zinc-900/80 border-b border-zinc-800 px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 text-sm text-zinc-400">
          <Lock size={14} className="text-zinc-500 shrink-0" />
          <span>You're viewing live prices in read-only mode. Sign in to buy or sell.</span>
        </div>
        <div className="flex gap-2 shrink-0">
          <Link
            href="/auth?mode=login"
            className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all"
          >
            Sign in
          </Link>
          <Link
            href="/auth?mode=register"
            className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 font-semibold text-xs transition-all"
          >
            Register
          </Link>
        </div>
      </div>
    </div>
  )
}

// ─── Asset card ──────────────────────────────────────────────────────────────
const AssetCard = memo(function AssetCard({
  asset,
  last,
  change,
  isUp,
  qty,
  trade,
  setTrade,
  balance,
  trading,
  executeTrade,
  isLoggedIn,
  onGuestAction,
}: {
  asset: AssetInfo
  last: number
  change: number
  isUp: boolean
  qty: number | undefined
  trade: { symbol: string; type: "BUY" | "SELL"; quantity: string } | null
  setTrade: (t: { symbol: string; type: "BUY" | "SELL"; quantity: string } | null) => void
  balance: number | null
  trading: boolean
  executeTrade: () => void
  isLoggedIn: boolean
  onGuestAction: () => void
}) {
  const isActive = trade?.symbol === asset.symbol

  return (
    <div
      className={`bg-[#111114] border rounded-2xl p-5 transition-all duration-200 ${
        isActive ? "border-zinc-600 shadow-lg shadow-black/40" : "border-zinc-800/80 hover:border-zinc-700"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center font-black text-white text-sm">
            {asset.symbol[0]}
          </div>
          <div>
            <h3 className="text-white font-bold text-base leading-none">{asset.symbol}</h3>
            <p className="text-zinc-500 text-[10px] mt-0.5 uppercase tracking-wide">
              {asset.name} · {asset.type}
            </p>
            {isLoggedIn && qty !== undefined && qty > 0 && (
              <p className="text-zinc-400 text-[10px] mt-0.5">
                <span className="text-emerald-500 font-bold">{qty}</span> held
              </p>
            )}
          </div>
        </div>

        <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${
          isUp ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
        }`}>
          {isUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
          {change.toFixed(2)}%
        </div>
      </div>

      {/* Price — always links to chart */}
      <Link href={`/dashboard/${asset.symbol}`}>
        <div className="group mb-4">
          <p className="text-2xl md:text-3xl font-black text-white font-mono tracking-tight group-hover:text-zinc-200 transition-colors">
            ₹{last.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
          </p>
          <p className="text-zinc-600 text-[10px] mt-1 group-hover:text-zinc-500 transition-colors">
            Tap to view chart →
          </p>
        </div>
      </Link>

      {/* Buy / Sell — locked for guests */}
      {!isLoggedIn ? (
        <button
          onClick={onGuestAction}
          className="w-full py-2 rounded-xl border border-zinc-700 text-zinc-500 text-xs font-bold flex items-center justify-center gap-2 hover:border-zinc-600 hover:text-zinc-400 transition-all"
        >
          <Lock size={11} />
          Sign in to trade
        </button>
      ) : (
        <>
          <div className="flex gap-2">
            <button
              onClick={() => setTrade(isActive && trade?.type === "BUY" ? null : { symbol: asset.symbol, type: "BUY", quantity: "0" })}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                isActive && trade?.type === "BUY"
                  ? "bg-emerald-500 text-black"
                  : "border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
              }`}
            >
              Buy
            </button>
            <button
              onClick={() => setTrade(isActive && trade?.type === "SELL" ? null : { symbol: asset.symbol, type: "SELL", quantity: "0" })}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                isActive && trade?.type === "SELL"
                  ? "bg-red-500 text-white"
                  : "border border-red-500/40 text-red-400 hover:bg-red-500/10"
              }`}
            >
              Sell
            </button>
          </div>

          {/* Trade panel */}
          {isActive && (() => {
            const price = last || 1
            const maxQty =
              trade!.type === "BUY"
                ? Math.floor((balance ?? 0) / price)
                : Math.floor(qty ?? 0)
            const q = Math.min(parseFloat(trade!.quantity || "0"), maxQty)
            const total = q * price

            return (
              <div className="mt-4 pt-4 border-t border-zinc-800">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-zinc-500 text-xs">Quantity</span>
                  <span className="text-white text-xs font-bold font-mono">{q} units</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={maxQty || 1}
                  step="1"
                  value={q}
                  onChange={(e) => setTrade({ ...trade!, quantity: e.target.value })}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-zinc-700 accent-emerald-400 mb-3"
                />
                <div className="flex items-center justify-between mb-4">
                  <span className="text-zinc-500 text-xs">Total cost</span>
                  <span className={`text-sm font-bold font-mono ${trade!.type === "BUY" ? "text-emerald-400" : "text-red-400"}`}>
                    ₹{total.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={executeTrade}
                    disabled={trading || q === 0}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40 ${
                      trade!.type === "BUY"
                        ? "bg-emerald-600 hover:bg-emerald-500 active:scale-95"
                        : "bg-red-600 hover:bg-red-500 active:scale-95"
                    }`}
                  >
                    {trading ? "Processing…" : `Confirm ${trade!.type}`}
                  </button>
                  <button
                    onClick={() => setTrade(null)}
                    className="px-3 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm transition-all"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )
          })()}
        </>
      )}
    </div>
  )
})

// ─── Main dashboard ──────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter()
  const [prices, setPrices] = useState<PricesState>({})
  const [assets, setAssets] = useState<AssetInfo[]>([])
  const [balance, setBalance] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showDeposit, setShowDeposit] = useState(false)
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [depositAmount, setDepositAmount] = useState("")
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [processing, setProcessing] = useState(false)
  const [withdrawStep, setWithdrawStep] = useState(1)
  const [withdrawMethod, setWithdrawMethod] = useState<"bank" | "upi">("upi")
  const [withdrawAccountNo, setWithdrawAccountNo] = useState("")
  const [withdrawIfsc, setWithdrawIfsc] = useState("")
  const [withdrawUpi, setWithdrawUpi] = useState("")
  const [performance, setPerformance] = useState<any>(null)
  const [positions, setPositions] = useState<Record<string, number>>({})
  const [trade, setTrade] = useState<{ symbol: string; type: "BUY" | "SELL"; quantity: string } | null>(null)
  const [trading, setTrading] = useState(false)

  // Redirect guests who try to trade
  function onGuestAction() {
    router.push("/auth")
  }

  function getToken() {
    return localStorage.getItem("token")
  }

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem("token"))
  }, [])

  async function refetchBalance() {
    const token = getToken()
    if (!token) return
    try {
      const res = await fetch(`${API}/api/wallet`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const d = await res.json()
      if (d.balance !== undefined) setBalance(d.balance)
    } catch {
      console.error("Failed to fetch balance")
    }
  }

  function closeDepositModal() {
    setShowDeposit(false)
    setDepositAmount("")
    setProcessing(false)
  }

  function handleKeyDown(e: React.KeyboardEvent, close: () => void) {
    if (e.key === "Escape") close()
  }

  async function handleDeposit() {
    const token = getToken()
    if (!token || !depositAmount || parseFloat(depositAmount) <= 0) {
      toast.error("Please enter a valid positive amount")
      return
    }
    setProcessing(true)
    try {
      const orderRes = await fetch(`${API}/api/wallet/deposit/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount: parseFloat(depositAmount) }),
      })
      const orderData = await orderRes.json()
      if (!orderData.success) throw new Error(orderData.error)

      if (!(window as any).Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script")
          script.src = "https://checkout.razorpay.com/v1/checkout.js"
          script.onload = () => resolve()
          script.onerror = () => reject(new Error("Failed to load Razorpay"))
          document.body.appendChild(script)
        })
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        order_id: orderData.order_id,
        handler: async (response: any) => {
          try {
            const verifyRes = await fetch(`${API}/api/wallet/deposit/verify`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            })
            const verifyData = await verifyRes.json()
            if (verifyData.success) {
              toast.success("Deposit successful!")
              await refetchBalance()
            } else {
              toast.error(verifyData.error || "Verification failed")
            }
          } finally {
            closeDepositModal()
          }
        },
        modal: { ondismiss: () => setProcessing(false) },
      }

      const razorpay = new (window as any).Razorpay(options)
      razorpay.open()
    } catch (err: any) {
      toast.error(err.message || "Deposit failed")
      closeDepositModal()
    }
  }

  function resetWithdraw() {
    setShowWithdraw(false)
    setWithdrawAmount("")
    setWithdrawStep(1)
    setWithdrawMethod("upi")
    setWithdrawAccountNo("")
    setWithdrawIfsc("")
    setWithdrawUpi("")
    setProcessing(false)
  }

  async function handleWithdraw() {
    const token = getToken()
    if (!token || !withdrawAmount || parseFloat(withdrawAmount) <= 0) return
    setWithdrawStep(3)
    setProcessing(true)
    try {
      const body: Record<string, any> = { amount: parseFloat(withdrawAmount), method: withdrawMethod }
      if (withdrawMethod === "upi") {
        body.upi_id = withdrawUpi
      } else {
        body.account_no = withdrawAccountNo
        body.ifsc = withdrawIfsc
      }
      const res = await fetch(`${API}/api/wallet/withdraw`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (data.success) {
        setWithdrawStep(4)
      } else {
        toast.error(data.error || "Withdrawal request failed")
        resetWithdraw()
      }
    } catch {
      toast.error("Withdrawal request failed")
      resetWithdraw()
    } finally {
      setProcessing(false)
    }
  }

  useEffect(() => {
    fetch(`${API}/api/market/assets`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setAssets(d.data) })
      .catch(() => toast.error("Failed to load assets"))
  }, [])

  useEffect(() => {
    const socket = getSocket()
    socket.on("priceUpdate", (data: PricesState) => {
      setPrices(data)
      setLoading(false)
    })
    socket.on("connect_error", () => setLoading(false))
    return () => {
      socket.off("priceUpdate")
      socket.off("connect_error")
    }
  }, [])

  useEffect(() => {
    let pollId: ReturnType<typeof setInterval> | null = null
    const timeout = setTimeout(() => {
      setLoading(false)
      fetch(`${API}/api/market/prices`)
        .then((r) => r.json())
        .then((d) => { if (d.success) setPrices(d.data) })
        .catch(() => {})
      pollId = setInterval(() => {
        fetch(`${API}/api/market/prices`)
          .then((r) => r.json())
          .then((d) => { if (d.success) setPrices(d.data) })
          .catch(() => {})
      }, 15000)
    }, 8000)
    return () => {
      clearTimeout(timeout)
      if (pollId !== null) clearInterval(pollId)
    }
  }, [])

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) return
    fetch(`${API}/api/trading/portfolio`, { headers: { Authorization: `Bearer ${token}` } })
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
      .catch(() => console.error("Failed to fetch portfolio"))
  }, [])

  useEffect(() => { refetchBalance() }, [])

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) return
    fetch(`${API}/api/trading/performance`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { if (d.totalTrades !== undefined) setPerformance(d) })
      .catch(() => console.error("Failed to fetch performance"))
  }, [])

  async function executeTrade() {
    if (!trade) return
    const token = localStorage.getItem("token")
    if (!token) return
    const confirmed = await new Promise<boolean>((resolve) => {
      toast.custom(
        (t) => (
          <div className="bg-[#1c1f26] border border-zinc-700 rounded-xl p-4 shadow-2xl min-w-[260px]">
            <p className="text-white text-sm font-semibold mb-3 leading-relaxed">
              Confirm <span className={trade.type === "BUY" ? "text-emerald-400" : "text-red-400"}>{trade.type}</span>{" "}
              {parseFloat(trade.quantity)} units of <span className="text-zinc-300">{trade.symbol}</span>?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => { toast.dismiss(t.id); resolve(true) }}
                className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all"
              >
                ✓ Confirm
              </button>
              <button
                onClick={() => { toast.dismiss(t.id); resolve(false) }}
                className="flex-1 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition-all"
              >
                ✕ Cancel
              </button>
            </div>
          </div>
        ),
        { duration: Infinity }
      )
    })
    if (!confirmed) return
    setTrading(true)
    try {
      const res = await fetch(`${API}/api/trading/${trade.type === "BUY" ? "buy" : "sell"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ symbol: trade.symbol, quantity: parseFloat(trade.quantity) }),
      })
      const data = await res.json()
      if (data.error) {
        toast.error(data.error)
      } else {
        const [balanceRes, portfolioRes] = await Promise.all([
          fetch(`${API}/api/wallet`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API}/api/trading/portfolio`, { headers: { Authorization: `Bearer ${token}` } }),
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
        toast.success(`${trade.type} successful!`)
      }
    } catch {
      toast.error("Trade failed")
    } finally {
      setTrading(false)
      setTrade(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center text-zinc-500">
        <Loader2 className="animate-spin text-emerald-500 mr-3" size={20} />
        Loading market data…
      </div>
    )
  }

  return (
    <>
      <style>{`
        @keyframes ticker {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .animate-ticker { animation: ticker linear infinite; }
      `}</style>

      <div className="min-h-screen bg-[#09090b]">
        {/* Ticker */}
        <TickerBar prices={prices} assets={assets} />

        {/* Guest banner */}
        {!isLoggedIn && <GuestBanner />}

        <div className="px-4 md:px-8 lg:px-12 py-8 max-w-7xl mx-auto">

          {/* Header — balance for logged-in, tagline for guests */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
            <div className="flex-1">
              {isLoggedIn ? (
                <>
                  <p className="text-zinc-600 text-xs uppercase tracking-widest font-semibold mb-1">Portfolio balance</p>
                  <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                    {balance !== null ? (
                      <>
                        <span className="text-zinc-500 font-bold">₹</span>
                        <span className="text-emerald-400">{Number(balance).toLocaleString()}</span>
                      </>
                    ) : (
                      <span className="text-zinc-700">—</span>
                    )}
                  </h1>
                </>
              ) : (
                <>
                  <p className="text-zinc-600 text-xs uppercase tracking-widest font-semibold mb-1">Live markets</p>
                  <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                    Watch the market.{" "}
                    <Link href="/auth" className="text-emerald-400 hover:text-emerald-300 transition-colors">
                      Trade to win.
                    </Link>
                  </h1>
                </>
              )}
            </div>

            {/* Deposit / Withdraw — logged-in only */}
            {isLoggedIn && (
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDeposit(true)}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all"
                >
                  Deposit
                </button>
                <button
                  onClick={() => setShowWithdraw(true)}
                  className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white font-semibold text-sm transition-all"
                >
                  Withdraw
                </button>
              </div>
            )}
          </div>

          {/* Performance metrics — logged-in only */}
          {isLoggedIn && performance && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
              {[
                { label: "Win rate", value: performance.winRate, color: "text-emerald-400" },
                { label: "Total trades", value: performance.totalTrades, color: "text-white" },
                {
                  label: "Realized P&L",
                  value: `${(parseFloat(performance.totalRealizedPnL) || 0) >= 0 ? "+" : ""}₹${(parseFloat(performance.totalRealizedPnL) || 0).toLocaleString()}`,
                  color: (parseFloat(performance.totalRealizedPnL) || 0) >= 0 ? "text-emerald-400" : "text-red-400",
                },
                { label: "Best trade", value: `+₹${(parseFloat(performance.bestTrade) || 0).toLocaleString()}`, color: "text-emerald-400" },
              ].map((m) => (
                <div key={m.label} className="bg-[#111114] border border-zinc-800 rounded-2xl p-4">
                  <p className="text-zinc-600 text-[10px] uppercase tracking-wider font-semibold mb-1.5">{m.label}</p>
                  <p className={`text-xl font-black font-mono ${m.color}`}>{m.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Asset grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {assets.map((asset) => {
              const p = prices[asset.symbol]
              return (
                <AssetCard
                  key={asset.symbol}
                  asset={asset}
                  last={p?.last ?? 0}
                  change={p?.changePercent ?? 0}
                  isUp={(p?.changePercent ?? 0) >= 0}
                  qty={positions[asset.symbol]}
                  trade={trade}
                  setTrade={setTrade}
                  balance={balance}
                  trading={trading}
                  executeTrade={executeTrade}
                  isLoggedIn={isLoggedIn}
                  onGuestAction={onGuestAction}
                />
              )
            })}
          </div>
        </div>

        {/* ── Deposit modal ── */}
        {showDeposit && (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            onClick={() => setShowDeposit(false)}
            onKeyDown={(e) => handleKeyDown(e, closeDepositModal)}
            tabIndex={-1}
          >
            <div
              className="bg-[#111114] border border-zinc-800 rounded-t-3xl sm:rounded-2xl p-6 w-full sm:max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-lg font-bold text-white mb-1">Deposit funds</h2>
              <p className="text-zinc-500 text-sm mb-5">Add virtual money to your trading account.</p>
              <input
                type="number"
                min="0"
                step="any"
                placeholder="Amount (₹)"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="w-full mb-4 rounded-xl bg-zinc-900 border border-zinc-700 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500 transition-colors"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleDeposit}
                  disabled={processing || !depositAmount || parseFloat(depositAmount) <= 0}
                  className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm disabled:opacity-40 transition-all"
                >
                  {processing ? "Processing…" : "Proceed to pay"}
                </button>
                <button
                  onClick={() => { setShowDeposit(false); setDepositAmount("") }}
                  className="px-4 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Withdraw modal ── */}
        {showWithdraw && (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            onClick={() => { if (withdrawStep < 3) resetWithdraw() }}
            onKeyDown={(e) => { if (e.key === "Escape" && withdrawStep < 3) resetWithdraw() }}
            tabIndex={-1}
          >
            <div
              className="bg-[#111114] border border-zinc-800 rounded-t-3xl sm:rounded-2xl p-6 w-full sm:max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              {withdrawStep === 1 && (
                <>
                  <h2 className="text-lg font-bold text-white mb-1">Withdraw funds</h2>
                  <p className="text-zinc-500 text-sm mb-5">Request a withdrawal to your account.</p>
                  <input
                    type="number" min="0" step="any" placeholder="Amount (₹)"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="w-full mb-4 rounded-xl bg-zinc-900 border border-zinc-700 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500 transition-colors"
                  />
                  <p className="text-zinc-600 text-xs mb-3 uppercase tracking-wider font-semibold">Withdrawal method</p>
                  <div className="flex gap-2 mb-5">
                    {(["upi", "bank"] as const).map((m) => (
                      <button
                        key={m}
                        onClick={() => setWithdrawMethod(m)}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                          withdrawMethod === m
                            ? "bg-emerald-600 text-white"
                            : "bg-zinc-800 text-zinc-400 border border-zinc-700 hover:text-white"
                        }`}
                      >
                        {m === "upi" ? "UPI" : "Bank transfer"}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setWithdrawStep(2)}
                    disabled={!withdrawAmount || parseFloat(withdrawAmount) <= 0}
                    className="w-full py-3 rounded-xl bg-zinc-200 hover:bg-white text-black font-bold text-sm disabled:opacity-40 transition-all"
                  >
                    Continue
                  </button>
                  <button onClick={resetWithdraw} className="w-full mt-2 py-2 text-xs text-zinc-600 hover:text-zinc-400 transition-all">
                    Cancel
                  </button>
                </>
              )}

              {withdrawStep === 2 && (
                <>
                  <h2 className="text-lg font-bold text-white mb-5">
                    {withdrawMethod === "upi" ? "UPI details" : "Bank details"}
                  </h2>
                  {withdrawMethod === "upi" ? (
                    <input
                      type="text" placeholder="UPI ID (e.g. name@upi)"
                      value={withdrawUpi}
                      onChange={(e) => setWithdrawUpi(e.target.value)}
                      className="w-full mb-5 rounded-xl bg-zinc-900 border border-zinc-700 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500 transition-colors"
                    />
                  ) : (
                    <>
                      <input
                        type="text" placeholder="Account number"
                        value={withdrawAccountNo}
                        onChange={(e) => setWithdrawAccountNo(e.target.value)}
                        className="w-full mb-3 rounded-xl bg-zinc-900 border border-zinc-700 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500 transition-colors"
                      />
                      <input
                        type="text" placeholder="IFSC code"
                        value={withdrawIfsc}
                        onChange={(e) => setWithdrawIfsc(e.target.value)}
                        className="w-full mb-5 rounded-xl bg-zinc-900 border border-zinc-700 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500 transition-colors"
                      />
                    </>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={handleWithdraw}
                      disabled={processing}
                      className="flex-1 py-3 rounded-xl bg-zinc-200 hover:bg-white text-black font-bold text-sm transition-all"
                    >
                      Confirm withdrawal
                    </button>
                    <button
                      onClick={() => setWithdrawStep(1)}
                      className="px-4 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm transition-all"
                    >
                      Back
                    </button>
                  </div>
                </>
              )}

              {withdrawStep === 3 && (
                <div className="flex flex-col items-center py-10">
                  <div className="w-12 h-12 border-2 border-zinc-700 border-t-emerald-500 rounded-full animate-spin mb-4" />
                  <p className="text-white font-bold">Processing withdrawal</p>
                  <p className="text-zinc-500 text-sm mt-1">Please wait…</p>
                </div>
              )}

              {withdrawStep === 4 && (
                <div className="flex flex-col items-center py-10">
                  <div className="w-14 h-14 rounded-full bg-yellow-500/15 border border-yellow-500/40 flex items-center justify-center mb-4">
                    <svg className="w-7 h-7 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-white font-bold text-lg">Withdrawal submitted</p>
                  <p className="text-yellow-400 text-sm mt-1 font-mono">
                    ₹{parseFloat(withdrawAmount || "0").toLocaleString()} requested
                  </p>
                  <p className="text-zinc-600 text-xs mt-2">Pending admin approval</p>
                  <button
                    onClick={resetWithdraw}
                    className="mt-5 px-5 py-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white text-sm transition-all"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        <ChatPanel />
      </div>
    </>
  )
}