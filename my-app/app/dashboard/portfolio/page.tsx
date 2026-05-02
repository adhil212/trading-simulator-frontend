"use client"

import { TrendingUp, TrendingDown } from "lucide-react"

// my portfolio assets - will hook up to API later
const assets = [
  { name: "Bitcoin (BTC-USD)", qty: "0.5", avg: 30000.00, current: 31200.00, pnl: 600.00 },
  { name: "Gold (XAU-USD)", qty: "10", avg: 1950.00, current: 1985.30, pnl: 353.00 },
  { name: "Silver (XAG-USD)", qty: "100", avg: 28.00, current: 28.85, pnl: 85.00 },
]

// quick calc for total
const totalValue = assets.reduce((sum, a) => sum + (parseFloat(a.qty) * a.current), 0)
const totalPnl = assets.reduce((sum, a) => sum + a.pnl, 0)

export default function PortfolioPage() {
  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-400 p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-10">My Portfolio</h1>

        {/* summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="bg-[#111318] border border-zinc-800 rounded-2xl p-8">
            <p className="text-zinc-500 text-sm mb-2">Total Value</p>
            <div className="flex items-baseline gap-3">
              <span className="text-5xl font-bold text-lime-400">${totalValue.toLocaleString()}</span>
              <span className="text-lime-400 text-sm">(+3.5% today)</span>
            </div>
          </div>

          <div className="bg-[#111318] border border-zinc-800 rounded-2xl p-8">
            <p className="text-zinc-500 text-sm mb-2">Daily P&L</p>
            <div className="flex items-center gap-3">
              <span className="text-5xl font-bold text-lime-400">+${totalPnl.toLocaleString()}</span>
              <TrendingUp className="text-lime-400" size={32} />
            </div>
          </div>
        </div>

        {/* assets table */}
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
              {assets.map((a, i) => (
                <tr key={i} className="border-b border-zinc-800/50 hover:bg-zinc-800/20">
                  <td className="px-8 py-6 text-white font-medium">{a.name}</td>
                  <td className="px-8 py-6 text-zinc-300">{a.qty}</td>
                  <td className="px-8 py-6 text-zinc-300">${a.avg.toLocaleString()}</td>
                  <td className="px-8 py-6 text-zinc-300">${a.current.toLocaleString()}</td>
                  <td className={`px-8 py-6 text-right font-bold flex justify-end items-center gap-2 ${a.pnl >= 0 ? 'text-lime-400' : 'text-red-500'}`}>
                    {a.pnl >= 0 ? '+' : ''}${a.pnl.toLocaleString()}
                    {a.pnl >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
