"use client"

import { useState, useEffect } from "react"
import { ArrowDownLeft, ArrowUpRight, Download, Loader2 } from "lucide-react"

type Transaction = {
  id: number
  type: "DEPOSIT" | "WITHDRAWAL"
  amount: string
  status: string
  razorpay_order_id: string | null
  razorpay_payment_id: string | null
  created_at: string
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const typeFilters = [
  { label: "All", val: "all" },
  { label: "Deposits", val: "DEPOSIT" },
  { label: "Withdrawals", val: "WITHDRAWAL" },
]

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    COMPLETED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    PENDING:   "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    FAILED:    "bg-red-500/10 text-red-400 border-red-500/20",
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${map[status] ?? "bg-zinc-800 text-zinc-400 border-zinc-700"}`}>
      {status}
    </span>
  )
}

export default function WalletPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) { setError("Not authenticated"); setLoading(false); return }

    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/wallet/transactions?limit=100`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error)
        setTransactions(d.transactions || [])
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const filtered = typeFilter === "all"
    ? transactions
    : transactions.filter((t) => t.type === typeFilter)

  // Summary stats
  const totalDeposited = transactions
    .filter((t) => t.type === "DEPOSIT" && t.status === "COMPLETED")
    .reduce((s, t) => s + parseFloat(t.amount), 0)
  const totalWithdrawn = transactions
    .filter((t) => t.type === "WITHDRAWAL" && t.status === "COMPLETED")
    .reduce((s, t) => s + parseFloat(t.amount), 0)

  const downloadCSV = () => {
    let csv = "Type,Amount,Status,Order ID,Date\n"
    filtered.forEach((tx) => {
      const type = tx.type === "DEPOSIT" ? "Deposit" : "Withdrawal"
      const sign = tx.type === "DEPOSIT" ? "+" : "-"
      csv += `${type},${sign}₹${parseFloat(tx.amount).toFixed(2)},${tx.status},${tx.razorpay_order_id || ""},${tx.created_at}\n`
    })
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `transactions_${typeFilter}_${new Date().toISOString().slice(0, 10)}.csv`
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
          <p className="text-red-400 font-semibold mb-1">Failed to load transactions</p>
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
          <p className="text-zinc-600 text-xs uppercase tracking-widest font-semibold mb-1">Transaction history</p>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Wallet</h1>
        </div>

        {/* ── Summary cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <div className="bg-[#111114] border border-zinc-800 rounded-2xl p-5 sm:p-6">
            <p className="text-zinc-600 text-[10px] uppercase tracking-widest font-semibold mb-3">Total deposited</p>
            <p className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight">
              ₹{totalDeposited.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-zinc-700 text-xs mt-2 font-mono">
              {transactions.filter(t => t.type === "DEPOSIT").length} deposit{transactions.filter(t => t.type === "DEPOSIT").length !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="bg-[#111114] border border-zinc-800 rounded-2xl p-5 sm:p-6">
            <p className="text-zinc-600 text-[10px] uppercase tracking-widest font-semibold mb-3">Total withdrawn</p>
            <p className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight">
              ₹{totalWithdrawn.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-zinc-700 text-xs mt-2 font-mono">
              {transactions.filter(t => t.type === "WITHDRAWAL").length} withdrawal{transactions.filter(t => t.type === "WITHDRAWAL").length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* ── Filter row ── */}
        <div className="flex flex-wrap gap-2 mb-4 items-center">
          {typeFilters.map((f) => (
            <button
              key={f.val}
              onClick={() => setTypeFilter(f.val)}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${
                typeFilter === f.val
                  ? "bg-zinc-100 text-black"
                  : "bg-zinc-800/60 text-zinc-500 border border-zinc-700/60 hover:text-white hover:bg-zinc-700"
              }`}
            >
              {f.label}
            </button>
          ))}
          {filtered.length > 0 && (
            <button
              onClick={downloadCSV}
              title="Export CSV"
              className="ml-auto flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-zinc-800/60 border border-zinc-700/60 text-zinc-500 hover:text-white hover:bg-zinc-700 text-xs font-bold transition-all"
            >
              <Download size={13} />
              Export
            </button>
          )}
        </div>

        {/* ── Empty state ── */}
        {filtered.length === 0 ? (
          <div className="bg-[#111114] border border-zinc-800 rounded-2xl flex flex-col items-center justify-center py-24 px-8 text-center">
            <div className="flex items-end gap-2 mb-6 opacity-20">
              {[40, 24, 56, 32, 48, 20, 44].map((h, i) => (
                <div key={i} className={`w-4 rounded-t-sm ${i % 2 === 0 ? "bg-emerald-400" : "bg-red-400"}`} style={{ height: h }} />
              ))}
            </div>
            <p className="text-zinc-400 font-semibold text-base mb-1">No transactions</p>
            <p className="text-zinc-700 text-sm max-w-xs">
              {typeFilter === "all"
                ? "Deposit funds from the dashboard to get started."
                : `No ${typeFilter.toLowerCase()} transactions yet.`}
            </p>
          </div>
        ) : (
          <>
            {/* ── Desktop table ── */}
            <div className="hidden md:block bg-[#111114] border border-zinc-800 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-zinc-800/60 flex items-center justify-between">
                <p className="text-zinc-600 text-[10px] uppercase tracking-widest font-semibold">Transactions</p>
                <span className="text-zinc-700 text-xs font-mono">{filtered.length} records</span>
              </div>

              <table className="w-full text-left">
                <thead>
                  <tr className="text-zinc-700 text-[10px] uppercase tracking-widest border-b border-zinc-800/60">
                    <th className="px-6 py-3 font-semibold">Type</th>
                    <th className="px-6 py-3 font-semibold">Amount</th>
                    <th className="px-6 py-3 font-semibold">Status</th>
                    <th className="px-6 py-3 font-semibold">Reference</th>
                    <th className="px-6 py-3 font-semibold text-right">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((tx) => {
                    const isDeposit = tx.type === "DEPOSIT"
                    const amt = parseFloat(tx.amount)
                    return (
                      <tr key={tx.id} className="border-b border-zinc-800/40 last:border-0 hover:bg-zinc-800/20 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isDeposit ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                              {isDeposit ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                            </div>
                            <span className={`font-bold text-sm ${isDeposit ? "text-emerald-400" : "text-red-400"}`}>
                              {isDeposit ? "Deposit" : "Withdrawal"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`font-black font-mono text-sm ${isDeposit ? "text-emerald-400" : "text-red-400"}`}>
                            {isDeposit ? "+" : "−"}₹{amt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={tx.status} />
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-zinc-600 font-mono text-xs">
                            {tx.razorpay_order_id ? `${tx.razorpay_order_id.slice(0, 14)}…` : "—"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-zinc-500 text-xs font-mono">{formatDate(tx.created_at)}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              <div className="px-6 py-3 border-t border-zinc-800/60">
                <p className="text-zinc-700 text-xs font-mono">
                  {filtered.length} of {transactions.length} transactions
                </p>
              </div>
            </div>

            {/* ── Mobile cards ── */}
            <div className="md:hidden space-y-2">
              {filtered.map((tx) => {
                const isDeposit = tx.type === "DEPOSIT"
                const amt = parseFloat(tx.amount)
                return (
                  <div key={tx.id} className="bg-[#111114] border border-zinc-800 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isDeposit ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                          {isDeposit ? <ArrowDownLeft size={15} /> : <ArrowUpRight size={15} />}
                        </div>
                        <div>
                          <p className={`font-bold text-sm leading-none ${isDeposit ? "text-emerald-400" : "text-red-400"}`}>
                            {isDeposit ? "Deposit" : "Withdrawal"}
                          </p>
                          <p className="text-zinc-600 text-[10px] mt-0.5 font-mono">{formatDate(tx.created_at)}</p>
                        </div>
                      </div>
                      <span className={`font-black font-mono text-base ${isDeposit ? "text-emerald-400" : "text-red-400"}`}>
                        {isDeposit ? "+" : "−"}₹{amt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <StatusBadge status={tx.status} />
                      <span className="text-zinc-700 font-mono text-[10px]">
                        {tx.razorpay_order_id ? tx.razorpay_order_id.slice(0, 12) + "…" : "—"}
                      </span>
                    </div>
                  </div>
                )
              })}
              <p className="text-center text-zinc-700 text-xs font-mono pt-2">
                {filtered.length} of {transactions.length} transactions
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}