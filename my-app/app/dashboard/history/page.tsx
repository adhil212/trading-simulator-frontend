"use client"

import { useState } from "react"
import { History, Download } from "lucide-react"


const trades = [
  { asset: "BTC/USD", type: "Buy", qty: "0.25", price: "64,234.56", time: "Apr 30, 2026, 10:30 AM EST" },
  { asset: "XAU/USD", type: "Sell", qty: "10", price: "2,350.12", time: "Apr 29, 2026, 09:15 AM EST" },
  { asset: "BTC/USD", type: "Buy", qty: "0.10", price: "63,100.00", time: "Apr 28, 2026, 02:20 PM EST" },
  { asset: "XAG/USD", type: "Buy", qty: "100", price: "28.50", time: "Apr 27, 2026, 04:45 PM EST" },
  { asset: "XAU/USD", type: "Buy", qty: "5", price: "2,345.00", time: "Apr 25, 2026, 11:10 AM EST" },
  { asset: "XAG/USD", type: "Sell", qty: "50", price: "28.20", time: "Apr 22, 2026, 08:05 AM EST" },
  { asset: "BTC/USD", type: "Sell", qty: "0.15", price: "62,800.00", time: "Apr 18, 2026, 03:30 PM EST" },
  { asset: "XAU/USD", type: "Buy", qty: "8", price: "2,320.00", time: "Apr 15, 2026, 09:45 AM EST" },
  { asset: "XAG/USD", type: "Buy", qty: "200", price: "27.80", time: "Apr 10, 2026, 01:20 PM EST" },
  { asset: "BTC/USD", type: "Buy", qty: "0.30", price: "61,500.00", time: "Apr 05, 2026, 11:00 AM EST" },
  { asset: "XAU/USD", type: "Sell", qty: "3", price: "2,380.00", time: "Mar 28, 2026, 04:15 PM EST" },
  { asset: "XAG/USD", type: "Buy", qty: "150", price: "27.50", time: "Mar 20, 2026, 10:30 AM EST" },
  { asset: "BTC/USD", type: "Sell", qty: "0.20", price: "60,200.00", time: "Mar 15, 2026, 02:45 PM EST" },
  { asset: "XAU/USD", type: "Buy", qty: "12", price: "2,290.00", time: "Mar 10, 2026, 09:00 AM EST" },
  { asset: "XAG/USD", type: "Sell", qty: "80", price: "27.00", time: "Mar 05, 2026, 03:30 PM EST" },
  { asset: "BTC/USD", type: "Buy", qty: "0.40", price: "58,000.00", time: "Feb 25, 2026, 01:15 PM EST" },
  { asset: "XAU/USD", type: "Sell", qty: "6", price: "2,250.00", time: "Feb 18, 2026, 11:45 AM EST" },
  { asset: "XAG/USD", type: "Buy", qty: "300", price: "26.50", time: "Feb 05, 2026, 08:30 AM EST" },
]

const filters = [
  { label: "1 Day", val: 1 },
  { label: "1 Week", val: 7 },
  { label: "1 Month", val: 30 },
  { label: "3 Months", val: 90 },
  { label: "All", val: 0 },
]

export default function HistoryPage() {
  const [filter, setFilter] = useState(0)

  const filtered = trades.filter(t => {
    if (filter === 0) return true
    
    const tradeDate = new Date(t.time.replace(" EST", ""))
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const diffTime = today.getTime() - tradeDate.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    return diffDays >= 0 && diffDays <= filter
  })
    
  const download = () => {
    let csv = "Asset,Type,Quantity,Price,Time\n"
    filtered.forEach(t => {
      csv += `${t.asset},${t.type},${t.qty},$${t.price},${t.time}\n`
    })

    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `trades_${filter}_${new Date().toISOString().slice(0,10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
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
          {filters.map(f => (
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
                  <th className="px-8 py-6 text-center">Type</th>
                  <th className="px-8 py-6">Qty</th>
                  <th className="px-8 py-6">Price</th>
                  <th className="px-8 py-6">Time</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {filtered.map((t, i) => (
                  <tr key={i} className="border-b border-zinc-800/50 hover:bg-zinc-800/20">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${t.type === "Buy" ? "bg-green-500" : "bg-red-500"}`} />
                        <span className="text-white font-bold">{t.asset}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className={`px-4 py-1 rounded-full text-xs font-bold border ${
                        t.type === "Buy"
                          ? "bg-green-500/10 border-green-500/30 text-green-400"
                          : "bg-red-500/10 border-red-500/30 text-red-400"
                      }`}>
                        {t.type}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-zinc-300">{t.qty}</td>
                    <td className="px-8 py-6 text-zinc-300">${t.price}</td>
                    <td className="px-8 py-6 text-zinc-500 text-xs">{t.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-6 border-t border-zinc-800 bg-[#0d0f14]">
            <p className="text-xs text-zinc-600">Showing {filtered.length} of {trades.length} trades</p>
          </div>
        </div>
      </div>
    </div>
  )
}

