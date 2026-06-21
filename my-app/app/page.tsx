"use client"

import Link from "next/link"
import { useEffect, useState, useRef } from "react"
import { Play, Rocket, BarChart3, LineChart, PieChart } from "lucide-react"
import { getSocket } from "../lib/socket"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

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
  { value: 4.2, suffix: "B+", prefix: "₹", label: "SIMULATED VOLUME" },
  { value: 50, suffix: "k+", prefix: "", label: "ACTIVE TRADERS" },
  { value: 200, suffix: "+", prefix: "", label: "ASSETS SUPPORTED" },
  { value: 0.1, suffix: "ms", prefix: "", label: "LATENCY" }
]

function useCountUp(target: number, duration = 2000, start = false) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!start) return
    let startTime: number | null = null
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(parseFloat((eased * target).toFixed(target < 1 ? 1 : 0)))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [start, target, duration])
  return count
}

function StatCard({ stat, animate }: { stat: typeof stats[0], animate: boolean }) {
  const count = useCountUp(stat.value, 2000, animate)
  return (
    <div className="text-center stat-card">
      <div className="text-4xl font-bold text-white mb-1 tracking-tight tabular-nums">
        {stat.prefix}{typeof stat.value === "number" && stat.value < 1 ? count.toFixed(1) : Math.round(count as number).toLocaleString()}{stat.suffix}
      </div>
      <div className="text-[10px] text-zinc-500 font-bold tracking-[0.2em]">{stat.label}</div>
    </div>
  )
}

type PriceEntry = {
  symbol: string
  last: number
  changePercent: number
  bid: number
  ask: number
}

export default function Home() {
  const [prices, setPrices] = useState<Record<string, PriceEntry> | null>(null)
  const [statsVisible, setStatsVisible] = useState(false)
  const [heroVisible, setHeroVisible] = useState(false)
  const [featuresVisible, setFeaturesVisible] = useState(false)
  const [mousePos, setMousePos] = useState({ x: -200, y: -200 })
  const [orderFlash, setOrderFlash] = useState<number | null>(null)
  const statsRef = useRef<HTMLElement>(null)
  const featuresRef = useRef<HTMLElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<{ x: number; y: number; vx: number; vy: number; size: number; opacity: number }[]>([])
  const animFrameRef = useRef<number | null>(null)

  // ── Fetch initial prices via HTTP, then keep live via socket ──
  useEffect(() => {
    fetch(`${API_URL}/api/market/prices`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setPrices(d.data) })
      .catch(() => console.error("Failed to fetch market prices"))

    const socket = getSocket()
    socket.on("priceUpdate", (data: Record<string, PriceEntry>) => {
      setPrices(data)
    })
    return () => {
      socket.off("priceUpdate")
    }
  }, [])

  // Hero entrance
  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 100)
    return () => clearTimeout(t)
  }, [])

  // Scroll-triggered animations
  useEffect(() => {
    const observers: IntersectionObserver[] = []
    if (statsRef.current) {
      const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStatsVisible(true) }, { threshold: 0.3 })
      obs.observe(statsRef.current)
      observers.push(obs)
    }
    if (featuresRef.current) {
      const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setFeaturesVisible(true) }, { threshold: 0.2 })
      obs.observe(featuresRef.current)
      observers.push(obs)
    }
    return () => observers.forEach(o => o.disconnect())
  }, [])

  // Mouse cursor glow
  useEffect(() => {
    const handler = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY })
    window.addEventListener("mousemove", handler)
    return () => window.removeEventListener("mousemove", handler)
  }, [])

  // Particle canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    window.addEventListener("resize", resize)

    particlesRef.current = Array.from({ length: 40 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      size: Math.random() * 1.5 + 0.5,
      opacity: Math.random() * 0.4 + 0.1,
    }))

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particlesRef.current.forEach((p, i) => {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(59,130,246,${p.opacity})`
        ctx.fill()

        particlesRef.current.slice(i + 1).forEach(q => {
          const dist = Math.hypot(p.x - q.x, p.y - q.y)
          if (dist < 100) {
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(q.x, q.y)
            ctx.strokeStyle = `rgba(59,130,246,${0.05 * (1 - dist / 100)})`
            ctx.stroke()
          }
        })
      })
      animFrameRef.current = requestAnimationFrame(draw)
    }
    draw()
    return () => {
      window.removeEventListener("resize", resize)
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [])

  // Order book flash
  useEffect(() => {
    const id = setInterval(() => {
      setOrderFlash(Math.floor(Math.random() * 4))
      setTimeout(() => setOrderFlash(null), 600)
    }, 2000)
    return () => clearInterval(id)
  }, [])

  // ── Build live ticker items from prices state ──
  const tickerItems = prices
    ? Object.values(prices).map((p) => ({
        name: p.symbol.replace("_", "/"),
        price: p.last.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        change: `${p.changePercent >= 0 ? "+" : ""}${p.changePercent.toFixed(2)}%`,
        positive: p.changePercent >= 0,
      }))
    : []

  // Duplicate for seamless loop
  const tickerDisplay = tickerItems.length > 0 ? [...tickerItems, ...tickerItems] : []

  const btc = prices?.BTC_USD
  const lastPrice = btc
    ? btc.last.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : "68,421.30"
  const changePercent = btc?.changePercent ?? 2.84
  const isPositive = changePercent >= 0
  const bidLevels = btc
    ? [
        { price: btc.bid, size: 0.52 },
        { price: btc.bid - btc.bid * 0.0001, size: 0.34 },
        { price: btc.bid - btc.bid * 0.0002, size: 0.21 },
        { price: btc.bid - btc.bid * 0.0003, size: 0.45 },
      ]
    : [
        { price: 68421.3, size: 0.52 },
        { price: 68420.1, size: 0.34 },
        { price: 68418.45, size: 0.21 },
        { price: 68415.2, size: 0.45 },
      ]

  const barHeights = [48, 72, 54, 96, 82, 118, 92, 132, 108, 150, 126, 166]

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-blue-500/30 overflow-x-hidden">

      {/* Cursor glow */}
      <div
        className="pointer-events-none fixed z-50 rounded-full transition-transform duration-75"
        style={{
          width: 300,
          height: 300,
          left: mousePos.x - 150,
          top: mousePos.y - 150,
          background: "radial-gradient(circle, rgba(37,99,235,0.06) 0%, transparent 70%)",
        }}
      />

      {/* Ticker bar — live prices when available, hidden while loading */}
      {tickerDisplay.length > 0 && (
        <div className="bg-[#0a0a0a] border-b border-white/5 overflow-hidden py-2">
          <div
            className="flex animate-ticker whitespace-nowrap"
            style={{ animationDuration: `${Math.max(tickerItems.length * 4, 20)}s` }}
          >
            {tickerDisplay.map((t, i) => (
              <span key={i} className="inline-flex items-center gap-2 px-8 text-xs font-mono">
                <span className="text-zinc-400 font-bold">{t.name}</span>
                <span className="text-white">₹{t.price}</span>
                <span className={t.positive ? "text-green-400" : "text-red-400"}>
                  {t.change}
                </span>
                <span className="text-zinc-700 mx-2">|</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <nav className="flex justify-between items-center px-8 py-6 max-w-7xl mx-auto border-b border-white/5">
        <div className="flex items-center gap-8">
          <h1 className="text-xl font-black tracking-tighter uppercase italic">Tradesim</h1>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/auth?mode=login" className="text-sm font-medium hover:text-blue-400 transition-colors">Login</Link>
          <Link href="/auth?mode=register" className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg text-sm font-bold transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] hover:scale-105 active:scale-95">
            Register
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative max-w-7xl mx-auto px-8 py-24 grid lg:grid-cols-2 gap-16 items-center">
        {/* Particle canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ opacity: 0.6 }}
        />

        <div className={`space-y-8 relative z-10 transition-all duration-1000 ${heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-400 px-3 py-1 rounded-sm text-[10px] font-bold uppercase tracking-widest">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <Rocket size={12} /> Live Simulation Engine
          </div>

          <h1
            className="text-5xl sm:text-7xl font-bold leading-[1.1] tracking-tight"
            style={{ transitionDelay: "150ms" }}
          >
            <span className={`block transition-all duration-700 delay-100 ${heroVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"}`}>
              Master the Markets,
            </span>
            <span className={`block text-blue-500 transition-all duration-700 delay-300 ${heroVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"}`}>
              Risk-Free.
            </span>
          </h1>

          <p className={`text-zinc-400 text-lg max-w-lg leading-relaxed transition-all duration-700 delay-500 ${heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            Experience real-time trading with our institutional-grade simulator.
            Practice with live data and build your portfolio without the financial risk.
          </p>

          <div className={`flex flex-wrap gap-4 transition-all duration-700 delay-700 ${heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <Link href="/dashboard" className="bg-blue-600 hover:bg-blue-700 px-8 py-4 rounded-xl font-bold flex items-center gap-2 transition-all group shadow-xl shadow-blue-900/20 hover:shadow-blue-500/30 hover:scale-105 active:scale-95 relative overflow-hidden">
              <span className="relative z-10">Start Trading Now</span>
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
            </Link>
            <Link href="/dashboard" className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 px-8 py-4 rounded-xl font-bold flex items-center gap-2 transition-all hover:border-zinc-600 hover:scale-105 active:scale-95">
              <Play size={18} fill="currentColor" /> Watch Demo
            </Link>
          </div>
        </div>

        {/* Hero chart card */}
        <div className={`relative group transition-all duration-1000 delay-300 ${heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}>
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-green-500 rounded-[2rem] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
          <div className="relative bg-[#111] border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl aspect-[3/2] p-6 hover:border-white/20 transition-colors duration-500">
            <div className="flex items-center gap-2 mb-6">
              <span className="h-3 w-3 rounded-full bg-red-500/80"></span>
              <span className="h-3 w-3 rounded-full bg-yellow-500/80"></span>
              <span className="h-3 w-3 rounded-full bg-green-500/80"></span>
              <span className="ml-4 text-xs text-zinc-500 font-mono">TRADESIM / LIVE</span>
              <span className="ml-auto flex items-center gap-1 text-[10px] text-green-400 font-mono">
                <span className="animate-pulse">●</span> STREAMING
              </span>
            </div>

            <div className="grid grid-cols-[1fr_0.7fr] gap-4 h-[calc(100%-2.25rem)]">
              <div className="relative rounded-2xl bg-black/40 border border-white/5 overflow-hidden p-4">
                <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:44px_36px]"></div>
                <div className="relative flex items-start justify-between mb-6">
                  <div>
                    <p className="text-xs text-zinc-500 font-mono">BTC/USD</p>
                    <p className="text-2xl font-black text-white tabular-nums">₹{lastPrice}</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-md ${isPositive ? "text-green-400 bg-green-500/10" : "text-red-400 bg-red-500/10"}`}>
                    {isPositive ? "+" : ""}{changePercent.toFixed(2)}%
                  </span>
                </div>
                <div className="relative h-48">
                  <div className="absolute bottom-4 left-0 right-0 h-28 border-l-2 border-b-2 border-green-400/80 skew-y-[-10deg] rounded-bl-xl"></div>
                  <div className="absolute bottom-7 left-[18%] right-[12%] h-20 border-t-2 border-r-2 border-blue-400/80 skew-y-[8deg]"></div>
                  <div className="absolute bottom-4 left-0 right-0 flex items-end gap-2 opacity-60">
                    {barHeights.map((height, index) => (
                      <span
                        key={index}
                        className="flex-1 rounded-t bg-green-500/30 hover:bg-green-500/50 transition-colors"
                        style={{
                          height: 0,
                          animation: `barGrow 0.6s ease-out ${index * 0.05 + 0.5}s forwards`,
                          "--bar-h": `${height}px`,
                        } as React.CSSProperties}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="rounded-2xl bg-black/40 border border-white/5 p-4">
                  <p className="text-xs text-zinc-500 font-mono mb-3">ORDER BOOK</p>
                  {bidLevels.map((level, i) => (
                    <div
                      key={level.price}
                      className={`flex justify-between text-xs font-mono py-1 border-b border-white/5 last:border-0 transition-colors duration-300 rounded ${orderFlash === i ? "bg-green-500/10" : ""}`}
                    >
                      <span className="text-green-400">{level.price.toFixed(2)}</span>
                      <span className="text-zinc-500">{level.size.toFixed(2)} BTC</span>
                    </div>
                  ))}
                </div>
                <div className="rounded-2xl bg-blue-600/10 border border-blue-400/20 p-4 hover:bg-blue-600/15 transition-colors">
                  <p className="text-xs text-blue-300 font-mono mb-2">PORTFOLIO</p>
                  <p className="text-3xl font-black tabular-nums">₹124,908</p>
                  <div className="mt-4 h-2 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: 0, animation: "portfolioBar 1.2s ease-out 1s forwards" }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-transparent to-transparent pointer-events-none"></div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section ref={featuresRef} className="max-w-7xl mx-auto px-8 py-20 border-t border-white/5">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Professional Trading Arsenal</h2>
          <p className="text-zinc-500 max-w-xl mx-auto italic font-light">Everything you need to simulate high-stakes trading environments with zero capital risk.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <div
              key={i}
              className={`bg-[#111] border border-white/5 p-8 rounded-3xl hover:border-blue-500/30 transition-all group relative overflow-hidden ${featuresVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
              style={{ transitionDuration: "600ms", transitionDelay: `${i * 150}ms` }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-blue-500/5 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="bg-white/5 w-12 h-12 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-blue-500/10 transition-all duration-300 relative z-10">
                {f.icon}
              </div>
              <h3 className="text-xl font-bold mb-4 relative z-10">{f.title}</h3>
              <p className="text-zinc-500 text-sm leading-relaxed relative z-10">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section ref={statsRef} className="border-y border-white/5 py-16">
        <div className="max-w-7xl mx-auto px-8 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <StatCard key={i} stat={s} animate={statsVisible} />
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-8 py-32">
        <div className="bg-gradient-to-br from-zinc-900 to-black border border-white/10 rounded-[3rem] p-10 sm:p-16 text-center shadow-3xl hover:border-blue-500/20 transition-colors duration-500 group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
          <h2 className="text-4xl font-bold mb-6 relative z-10">Ready to test your strategies?</h2>
          <p className="text-zinc-400 mb-10 max-w-md mx-auto relative z-10">Join thousands of professional traders using TRADESIM to sharpen their edge every day.</p>
          <Link
            href="/dashboard"
            className="inline-block bg-white text-black px-10 py-4 rounded-xl font-black uppercase tracking-tighter hover:bg-zinc-200 transition-all hover:scale-105 active:scale-95 relative z-10 group/btn overflow-hidden"
          >
            <span className="relative z-10">Get Started For Free</span>
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-500"></span>
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

      <style jsx global>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-ticker {
          animation: ticker linear infinite;
          will-change: transform;
        }
        .animate-ticker:hover {
          animation-play-state: paused;
        }

        @keyframes barGrow {
          from { height: 0; }
          to { height: var(--bar-h); }
        }

        @keyframes portfolioBar {
          from { width: 0; }
          to { width: 75%; }
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-ticker { animation: none; }
          [style*="animation"] { animation: none !important; }
        }

        @media (max-width: 640px) {
          .stat-card { padding: 0.5rem; }
        }
      `}</style>
    </div>
  )
}