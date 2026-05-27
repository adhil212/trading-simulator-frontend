"use client"

import { useState, useEffect } from "react"
import { Wallet, ArrowDownLeft, ArrowUpRight, Download, Loader2 } from "lucide-react"

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

export default function WalletPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      setError("Not authenticated")
      setLoading(false)
      return
    }

    fetch("http://localhost:5000/api/wallet/transactions?limit=100", {
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
      <div className="min-h-screen bg-[#09090b] text-zinc-400 p-6 md:p-12 flex items-center justify-center">
        <Loader2 className="animate-spin text-green-500" size={32} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#09090b] text-zinc-400 p-6 md:p-12 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-2">Failed to load transactions</p>
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
            <Wallet className="text-green-500" size={20} />
            <span className="text-zinc-500 uppercase tracking-widest text-xs font-bold">Wallet</span>
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight">Transaction History</h1>
        </div>

        <div className="flex flex-wrap gap-3 mb-6 items-center">
          {typeFilters.map((f) => (
            <button
              key={f.val}
              onClick={() => setTypeFilter(f.val)}
              className={`px-3 py-1.5 text-xs rounded-lg ${
                typeFilter === f.val
                  ? "bg-green-500/20 text-green-400 border border-green-500/30"
                  : "bg-[#111318] text-zinc-500 border border-zinc-800 hover:text-white"
              }`}
            >
              {f.label}
            </button>
          ))}
          {filtered.length > 0 && (
            <button onClick={downloadCSV} className="ml-auto p-2 bg-[#111318] border border-zinc-800 rounded-xl hover:bg-zinc-800">
              <Download size={20} />
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="bg-[#111318] border border-zinc-800 rounded-[2rem] p-12 text-center">
            <Wallet className="mx-auto text-zinc-600 mb-3" size={40} />
            <p className="text-zinc-500 text-lg">No transactions yet</p>
            <p className="text-zinc-600 text-sm mt-1">
              {typeFilter === "all"
                ? "Deposit money to see your transaction history here"
                : `No ${typeFilter.toLowerCase()} transactions found`}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block bg-[#111318] border border-zinc-800 rounded-[2rem] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-zinc-500 text-xs uppercase tracking-wider border-b border-zinc-800">
                      <th className="px-6 py-5">Type</th>
                      <th className="px-6 py-5">Amount</th>
                      <th className="px-6 py-5">Status</th>
                      <th className="px-6 py-5">Order ID</th>
                      <th className="px-6 py-5">Date</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {filtered.map((tx) => (
                      <tr key={tx.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              tx.type === "DEPOSIT"
                                ? "bg-green-500/20 text-green-400"
                                : "bg-red-500/20 text-red-400"
                            }`}>
                              {tx.type === "DEPOSIT" ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                            </div>
                            <span className={`font-bold ${
                              tx.type === "DEPOSIT" ? "text-green-400" : "text-red-400"
                            }`}>
                              {tx.type === "DEPOSIT" ? "Deposit" : "Withdrawal"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className={`font-bold ${
                            tx.type === "DEPOSIT" ? "text-green-400" : "text-red-400"
                          }`}>
                            {tx.type === "DEPOSIT" ? "+" : "-"}₹{parseFloat(tx.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            tx.status === "COMPLETED"
                              ? "bg-green-500/20 text-green-400"
                              : tx.status === "PENDING"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-red-500/20 text-red-400"
                          }`}>
                            {tx.status}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <span className="text-zinc-500 font-mono text-xs">
                            {tx.razorpay_order_id
                              ? `${tx.razorpay_order_id.slice(0, 12)}...`
                              : "—"}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-zinc-500 text-xs">
                          {formatDate(tx.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-5 border-t border-zinc-800 bg-[#0d0f14]">
                <p className="text-xs text-zinc-600">
                  Showing {filtered.length} of {transactions.length} transactions
                </p>
              </div>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {filtered.map((tx) => (
                <div key={tx.id} className="bg-[#111318] border border-zinc-800 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        tx.type === "DEPOSIT"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-red-500/20 text-red-400"
                      }`}>
                        {tx.type === "DEPOSIT" ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                      </div>
                      <span className={`font-bold ${
                        tx.type === "DEPOSIT" ? "text-green-400" : "text-red-400"
                      }`}>
                        {tx.type === "DEPOSIT" ? "Deposit" : "Withdrawal"}
                      </span>
                    </div>
                    <span className={`font-bold text-lg ${
                      tx.type === "DEPOSIT" ? "text-green-400" : "text-red-400"
                    }`}>
                      {tx.type === "DEPOSIT" ? "+" : "-"}₹{parseFloat(tx.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        tx.status === "COMPLETED"
                          ? "bg-green-500/20 text-green-400"
                          : tx.status === "PENDING"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-red-500/20 text-red-400"
                      }`}>
                        {tx.status}
                      </span>
                      <span className="text-zinc-600 font-mono">
                        {tx.razorpay_order_id
                          ? tx.razorpay_order_id.slice(0, 10)
                          : "—"}
                      </span>
                    </div>
                    <span className="text-zinc-500">{formatDate(tx.created_at)}</span>
                  </div>
                </div>
              ))}
              <div className="text-center text-xs text-zinc-600 pt-2 pb-1">
                Showing {filtered.length} of {transactions.length} transactions
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
