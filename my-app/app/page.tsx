"use client"

import Link from "next/link"
import { Play, Rocket, BarChart3, LineChart, PieChart } from "lucide-react"

const features = [
  {
    icon: <BarChart3 className="text-blue-500" />,
    title: "Live Market Data",
    desc: "High-frequency updates from global exchanges. Experience the volatility of real markets in a safe sandbox."
  },
  {
    icon: <LineChart className="text-green-500" />,
    title: "Advanced Charts",
    desc: "Professional-grade technical analysis tools. Multi-timeframe analysis, indicators, and drawing tools at your fingertips."
  },
  {
    icon: <PieChart className="text-orange-500" />,
    title: "Portfolio Tracking",
    desc: "Comprehensive performance metrics and history. Monitor your Sharpe ratio, drawdown, and win rate over time."
  }
]

const stats = [
  { value: "$4.2B+", label: "SIMULATED VOLUME" },
  { value: "50k+", label: "ACTIVE TRADERS" },
  { value: "200+", label: "ASSETS SUPPORTED" },
  { value: "0.1ms", label: "LATENCY" }
]

export default function Home() {
  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-blue-500/30">
      <nav className="flex justify-between items-center px-8 py-6 max-w-7xl mx-auto border-b border-white/5">
        <div className="flex items-center gap-8">
          <h1 className="text-xl font-black tracking-tighter uppercase italic">Tradesim</h1>
          <div className="hidden md:flex gap-6 text-sm text-zinc-400 font-medium"></div>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/auth?mode=login" className="text-sm font-medium hover:text-blue-400 transition-colors">Login</Link>
          <Link href="/auth?mode=register" className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg text-sm font-bold transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)]">
            Register
          </Link>
        </div>
      </nav>

      <section className="max-w-7xl mx-auto px-8 py-24 grid lg:grid-cols-2 gap-16 items-center">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
            <Rocket size={12} /> Live Simulation Engine 
          </div>
          <h1 className="text-7xl font-bold leading-[1.1] tracking-tight">
            Master the Markets, <br />
            <span className="text-blue-500">Risk-Free.</span>
          </h1>
          <p className="text-zinc-400 text-lg max-w-lg leading-relaxed">
            Experience real-time trading with our institutional-grade simulator. 
            Practice with live data and build your portfolio without the financial risk.
          </p>
          <div className="flex gap-4">
            <Link href="/dashboard" className="bg-blue-600 hover:bg-blue-700 px-8 py-4 rounded-xl font-bold flex items-center gap-2 transition-all group shadow-xl shadow-blue-900/20">
              Start Trading Now
            </Link>
            <Link href="/dashboard">
            <button className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 px-8 py-4 rounded-xl font-bold flex items-center gap-2 transition-all">
              <Play size={18} fill="currentColor" /> Watch Demo
            </button>
             </Link>
          </div>
        </div>

        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-green-500 rounded-[2rem] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
          <div className="relative bg-[#111] border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl aspect-[3/2] p-6">
             <div className="flex items-center gap-2 mb-6">
               <span className="h-3 w-3 rounded-full bg-red-500/80"></span>
               <span className="h-3 w-3 rounded-full bg-yellow-500/80"></span>
               <span className="h-3 w-3 rounded-full bg-green-500/80"></span>
               <span className="ml-4 text-xs text-zinc-500 font-mono">TRADESIM / LIVE</span>
             </div>

             <div className="grid grid-cols-[1fr_0.7fr] gap-4 h-[calc(100%-2.25rem)]">
               <div className="relative rounded-2xl bg-black/40 border border-white/5 overflow-hidden p-4">
                 <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:44px_36px]"></div>
                 <div className="relative flex items-start justify-between mb-6">
                   <div>
                     <p className="text-xs text-zinc-500 font-mono">BTC/USD</p>
                     <p className="text-2xl font-black text-white">$68,421.30</p>
                   </div>
                   <span className="text-xs font-bold text-green-400 bg-green-500/10 px-2 py-1 rounded-md">+2.84%</span>
                 </div>
                 <div className="relative h-48">
                   <div className="absolute bottom-4 left-0 right-0 h-28 border-l-2 border-b-2 border-green-400/80 skew-y-[-10deg] rounded-bl-xl"></div>
                   <div className="absolute bottom-7 left-[18%] right-[12%] h-20 border-t-2 border-r-2 border-blue-400/80 skew-y-[8deg]"></div>
                   <div className="absolute bottom-4 left-0 right-0 flex items-end gap-2 opacity-60">
                     {[48, 72, 54, 96, 82, 118, 92, 132, 108, 150, 126, 166].map((height, index) => (
                       <span
                         key={index}
                         className="flex-1 rounded-t bg-green-500/30"
                         style={{ height }}
                       ></span>
                     ))}
                   </div>
                 </div>
               </div>

               <div className="grid gap-4">
                 <div className="rounded-2xl bg-black/40 border border-white/5 p-4">
                   <p className="text-xs text-zinc-500 font-mono mb-3">ORDER BOOK</p>
                   {["68,421.30", "68,420.10", "68,418.45", "68,415.20"].map((price) => (
                     <div key={price} className="flex justify-between text-xs font-mono py-1 border-b border-white/5 last:border-0">
                       <span className="text-green-400">{price}</span>
                       <span className="text-zinc-500">0.{Math.floor(Number(price.slice(-2)) + 31)} BTC</span>
                     </div>
                   ))}
                 </div>
                 <div className="rounded-2xl bg-blue-600/10 border border-blue-400/20 p-4">
                   <p className="text-xs text-blue-300 font-mono mb-2">PORTFOLIO</p>
                   <p className="text-3xl font-black">$124,908</p>
                   <div className="mt-4 h-2 rounded-full bg-white/10 overflow-hidden">
                     <div className="h-full w-3/4 bg-blue-500"></div>
                   </div>
                 </div>
               </div>
             </div>
             <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-transparent to-transparent pointer-events-none"></div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-8 py-20 border-t border-white/5">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Professional Trading Arsenal</h2>
          <p className="text-zinc-500 max-w-xl mx-auto italic font-light">Everything you need to simulate high-stakes trading environments with zero capital risk.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <div key={i} className="bg-[#111] border border-white/5 p-8 rounded-3xl hover:border-blue-500/30 transition-all group">
              <div className="bg-white/5 w-12 h-12 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                {f.icon}
              </div>
              <h3 className="text-xl font-bold mb-4">{f.title}</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-white/5 py-16">
        <div className="max-w-7xl mx-auto px-8 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((s, i) => (
            <div key={i}>
              <div className="text-4xl font-bold text-white mb-1 tracking-tight">{s.value}</div>
              <div className="text-[10px] text-zinc-500 font-bold tracking-[0.2em]">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-8 py-32">
        <div className="bg-gradient-to-br from-zinc-900 to-black border border-white/10 rounded-[3rem] p-16 text-center shadow-3xl">
          <h2 className="text-4xl font-bold mb-6">Ready to test your strategies?</h2>
          <p className="text-zinc-400 mb-10 max-w-md mx-auto">Join thousands of professional traders using TRADESIM to sharpen their edge every day.</p>
          <Link href="/dashboard" className="inline-block bg-white text-black px-10 py-4 rounded-xl font-black uppercase tracking-tighter hover:bg-zinc-200 transition-all">
            Get Started For Free
          </Link>
        </div>
      </section>

      <footer className="max-w-7xl mx-auto px-8 py-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-zinc-600 text-xs gap-6">
         <div className="flex flex-col gap-2 items-center md:items-start">
            <h1 className="text-white text-sm font-black uppercase italic">Tradesim</h1>
            <p>© 2026 TRADESIM. Institutional grade market simulation for professional growth.</p>
         </div>
         <div className="flex gap-8">
            <span className="hover:text-white cursor-pointer transition-colors">Terms of Service</span>
            <span className="hover:text-white cursor-pointer transition-colors">Privacy Policy</span>
            <span className="hover:text-white cursor-pointer transition-colors">Documentation</span>
         </div>
      </footer>
    </div>
  )
}

