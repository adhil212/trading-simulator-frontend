"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { io, Socket } from "socket.io-client"
import { Loader2 } from "lucide-react"
import toast from "react-hot-toast"

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

  function getToken() {
    return localStorage.getItem("token")
  }

  async function refetchBalance() {
    const token = getToken()
    if (!token) return
    try {
      const res = await fetch("http://localhost:5000/api/wallet", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const d = await res.json()
      if (d.balance !== undefined) setBalance(d.balance)
    } catch {}
  }

  function closeDepositModal() {
    setShowDeposit(false)
    setDepositAmount("")
    setProcessing(false)
  }

  async function handleDeposit() {
    const token = getToken()
    if (!token || !depositAmount || parseFloat(depositAmount) <= 0) return
    setProcessing(true)
    try {
      const orderRes = await fetch("http://localhost:5000/api/wallet/deposit/create-order", {
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
            const verifyRes = await fetch("http://localhost:5000/api/wallet/deposit/verify", {
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
        modal: {
          ondismiss: () => setProcessing(false),
        },
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
    await new Promise(r => setTimeout(r, 2000))
    setWithdrawStep(4)
    setProcessing(true)
    try {
      const res = await fetch("http://localhost:5000/api/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount: parseFloat(withdrawAmount) }),
      })
      const data = await res.json()
      if (data.success) {
        await refetchBalance()
      }
    } catch {
    } finally {
      await new Promise(r => setTimeout(r, 1500))
      setProcessing(false)
      resetWithdraw()
    }
  }

  // Fetch assets
  useEffect(() => {
    fetch("http://localhost:5000/api/market/assets")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setAssets(d.data)
        }
      })
      .catch(() => {})
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

    socket.on("connect_error", () => {
      setLoading(false)
    })

    socket.on("error", () => {})

    socket.on("disconnect", (reason) => {
      if (reason === "io server disconnect" || reason === "transport close") {
        toast.error("Disconnected from server")
      }
    })

    socket.on("reconnect", () => {
      toast.success("Reconnected to server")
    })

    socket.on("reconnect_failed", () => {
      toast.error("Could not reconnect to server")
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
    refetchBalance()
  }, [])

  // Fetch performance metrics
  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) return
    fetch("http://localhost:5000/api/trading/performance", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => {
        if (d.totalTrades !== undefined) setPerformance(d)
      })
      .catch(() => {})
  }, [])
   
  const [performance, setPerformance] = useState<any>(null)
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
        toast.error(data.error)
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
        toast.success(`${trade.type} successful!`)
      }
    } catch (err) {
      toast.error("Trade failed")
    } finally {
      setTrading(false)
      setTrade(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-16 text-zinc-400">
        <Loader2 className="animate-spin text-green-500 mr-3" size={20} />
        Loading market data...
      </div>
    )
  }

  return (
    <div className="p-6 md:p-16 max-w-7xl mx-auto min-h-screen bg-[#09090b]">
      <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4 mb-8 md:mb-12">
        <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold text-white tracking-tight">
          Balance:{" "}
          <span className="text-green-400">
            {balance !== null
              ? `₹${Number(balance).toLocaleString()}`
              : "₹0"}
          </span>
        </h1>
        <div className="flex gap-2 sm:pb-1">
          <button
            onClick={() => setShowDeposit(true)}
            className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all"
          >
            Deposit
          </button>
          <button
            onClick={() => setShowWithdraw(true)}
            className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-zinc-700 hover:bg-zinc-600 text-white font-bold text-sm transition-all"
          >
            Withdraw
          </button>
        </div>
      </div>

      {showDeposit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowDeposit(false)}>
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-white mb-4">Deposit Money</h2>
            <input
              type="number"
              min="0"
              step="any"
placeholder="Amount (₹)"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              className="w-full mb-4 rounded-lg bg-zinc-800 border border-zinc-600 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
            />
            <div className="flex gap-2">
              <button
                onClick={handleDeposit}
                disabled={processing || !depositAmount || parseFloat(depositAmount) <= 0}
                className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm disabled:opacity-50 transition-all"
              >
                {processing ? "Processing..." : "Proceed to Pay"}
              </button>
              <button
                onClick={() => { setShowDeposit(false); setDepositAmount("") }}
                className="px-4 py-3 rounded-xl bg-zinc-700 hover:bg-zinc-600 text-white text-sm transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showWithdraw && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => { if (withdrawStep < 3) resetWithdraw() }}>
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>

            {withdrawStep === 1 && (
              <>
                <h2 className="text-xl font-bold text-white mb-4">Withdraw Money</h2>
                <input
                  type="number" min="0" step="any" placeholder="Amount in USD"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full mb-4 rounded-lg bg-zinc-800 border border-zinc-600 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
                />
                <p className="text-xs text-zinc-500 mb-4">Select withdrawal method</p>
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setWithdrawMethod("upi")}
                    className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                      withdrawMethod === "upi"
                        ? "bg-blue-600 text-white"
                        : "bg-zinc-800 text-zinc-400 border border-zinc-700 hover:text-white"
                    }`}
                  >
                    UPI
                  </button>
                  <button
                    onClick={() => setWithdrawMethod("bank")}
                    className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                      withdrawMethod === "bank"
                        ? "bg-blue-600 text-white"
                        : "bg-zinc-800 text-zinc-400 border border-zinc-700 hover:text-white"
                    }`}
                  >
                    Bank Transfer
                  </button>
                </div>
                <button
                  onClick={() => setWithdrawStep(2)}
                  disabled={!withdrawAmount || parseFloat(withdrawAmount) <= 0}
                  className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm disabled:opacity-50 transition-all"
                >
                  Continue
                </button>
                <button onClick={resetWithdraw} className="w-full mt-2 py-2 text-xs text-zinc-500 hover:text-white transition-all">
                  Cancel
                </button>
              </>
            )}

            {withdrawStep === 2 && (
              <>
                <h2 className="text-xl font-bold text-white mb-4">
                  {withdrawMethod === "upi" ? "UPI Details" : "Bank Details"}
                </h2>
                {withdrawMethod === "upi" ? (
                  <input
                    type="text" placeholder="UPI ID (e.g. name@upi)"
                    value={withdrawUpi}
                    onChange={(e) => setWithdrawUpi(e.target.value)}
                    className="w-full mb-4 rounded-lg bg-zinc-800 border border-zinc-600 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
                  />
                ) : (
                  <>
                    <input
                      type="text" placeholder="Account Number"
                      value={withdrawAccountNo}
                      onChange={(e) => setWithdrawAccountNo(e.target.value)}
                      className="w-full mb-3 rounded-lg bg-zinc-800 border border-zinc-600 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
                    />
                    <input
                      type="text" placeholder="IFSC Code"
                      value={withdrawIfsc}
                      onChange={(e) => setWithdrawIfsc(e.target.value)}
                      className="w-full mb-4 rounded-lg bg-zinc-800 border border-zinc-600 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
                    />
                  </>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={handleWithdraw}
                    disabled={processing}
                    className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm transition-all"
                  >
                    Confirm Withdrawal
                  </button>
                  <button
                    onClick={() => setWithdrawStep(1)}
                    className="px-4 py-3 rounded-xl bg-zinc-700 hover:bg-zinc-600 text-white text-sm transition-all"
                  >
                    Back
                  </button>
                </div>
              </>
            )}

            {withdrawStep === 3 && (
              <div className="flex flex-col items-center py-8">
                <div className="w-12 h-12 border-4 border-red-500/30 border-t-red-500 rounded-full animate-spin mb-4" />
                <p className="text-white font-bold text-lg">Processing Withdrawal</p>
                <p className="text-zinc-500 text-sm mt-1">Please wait...</p>
              </div>
            )}

            {withdrawStep === 4 && (
              <div className="flex flex-col items-center py-8">
                <div className="w-14 h-14 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center mb-4">
                  <svg className="w-7 h-7 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-white font-bold text-lg">Withdrawal Complete</p>
                <p className="text-green-400 text-sm mt-1">
                  ${parseFloat(withdrawAmount || "0").toLocaleString()} sent to{" "}
                  {withdrawMethod === "upi" ? withdrawUpi : `Account ${withdrawAccountNo}`}
                </p>
                <p className="text-zinc-600 text-xs mt-3">Funds will arrive in 2-3 business days</p>
              </div>
            )}

          </div>
        </div>
      )}

      {performance && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
          <div className="bg-[#1c1f26] border border-zinc-800 rounded-2xl p-4 md:p-5">
            <p className="text-zinc-500 text-[10px] md:text-xs uppercase tracking-wider mb-1">Win Rate</p>
            <p className="text-xl md:text-2xl font-bold text-white">{performance.winRate}</p>
          </div>
          <div className="bg-[#1c1f26] border border-zinc-800 rounded-2xl p-4 md:p-5">
            <p className="text-zinc-500 text-[10px] md:text-xs uppercase tracking-wider mb-1">Total Trades</p>
            <p className="text-xl md:text-2xl font-bold text-white">{performance.totalTrades}</p>
          </div>
          <div className="bg-[#1c1f26] border border-zinc-800 rounded-2xl p-4 md:p-5">
            <p className="text-zinc-500 text-[10px] md:text-xs uppercase tracking-wider mb-1">Realized P&L</p>
            <p className={`text-xl md:text-2xl font-bold ${parseFloat(performance.totalRealizedPnL) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {parseFloat(performance.totalRealizedPnL) >= 0 ? '+' : ''}₹{parseFloat(performance.totalRealizedPnL).toLocaleString()}
            </p>
          </div>
          <div className="bg-[#1c1f26] border border-zinc-800 rounded-2xl p-4 md:p-5">
            <p className="text-zinc-500 text-[10px] md:text-xs uppercase tracking-wider mb-1">Best Trade</p>
            <p className="text-xl md:text-2xl font-bold text-green-400">+₹{parseFloat(performance.bestTrade).toLocaleString()}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
        {assets.map((asset) => {
          const p = prices[asset.symbol]

          const last = p?.last ?? 0
          const change = p?.changePercent ?? 0

          const isUp = change >= 0

          return (
            <div
              key={asset.symbol}
              className="bg-[#1c1f26] border border-zinc-800 rounded-2xl p-4 md:p-6 shadow-xl"
            >
              <div className="flex items-center gap-3 mb-3 md:mb-4">
                <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700 font-bold text-white text-xs">
                  {asset.symbol[0]}
                </div>

                <div>
                  <h3 className="text-white font-bold text-base md:text-lg">
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
                <div className="text-2xl md:text-3xl font-bold text-white">
                  ₹
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

              <div className="flex gap-3 mt-3 md:mt-4">
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
                <div className="mt-3 md:mt-4 p-3 rounded-xl bg-zinc-800/50 border border-zinc-700">
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
                            ~₹{(qty * price).toLocaleString(undefined, { maximumFractionDigits: 2 })}
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