"use client";
import { useParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import {
  createChart,
  CandlestickSeries,
  ISeriesApi,
  ColorType,
} from "lightweight-charts";
import toast from "react-hot-toast";
import { getSocket } from "../../../lib/socket";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const TIMEFRAMES = [
  { label: "1m", value: 60 },
  { label: "5m", value: 300 },
  { label: "15m", value: 900 },
  { label: "1h", value: 3600 },
];

function formatTickIST(sec: number): string {
  return new Date(sec * 1000).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatLabelIST(sec: number): string {
  return new Date(sec * 1000).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export default function AssetDetailPage() {
  const { id } = useParams() as { id: string };
  const [price, setPrice] = useState<number>(0);
  const [prevPrice, setPrevPrice] = useState<number>(0);
  const [timeframe, setTimeframe] = useState(60);
  const [trade, setTrade] = useState<{ type: "BUY" | "SELL"; quantity: string } | null>(null);
  const [trading, setTrading] = useState(false);

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const seriesRef = useRef<ISeriesApi<any> | null>(null);
  const currentCandle = useRef<{ time: number; open: number; high: number; low: number; close: number } | null>(null);
  const timeframeRef = useRef(timeframe);
  timeframeRef.current = timeframe;

  // Flash direction for price update
  const priceFlash = price > prevPrice ? "up" : price < prevPrice ? "down" : "neutral";

  async function executeTrade() {
    if (!trade) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    setTrading(true);
    try {
      const res = await fetch(`${API}/api/trading/${trade.type === "BUY" ? "buy" : "sell"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ symbol: id, quantity: parseFloat(trade.quantity) }),
      });
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
      } else {
        toast.success(`${trade.type} successful!`);
      }
    } catch {
      toast.error("Trade failed");
    } finally {
      setTrading(false);
      setTrade(null);
    }
  }

  // Chart init
  useEffect(() => {
    if (!chartContainerRef.current) return;
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight || 420,
      layout: {
        background: { type: ColorType.Solid, color: "#09090b" },
        textColor: "#71717a",
        attributionLogo: false,
      },
      localization: {
        timeFormatter: (time: any) => formatLabelIST(time as number),
      },
      grid: {
        vertLines: { color: "#18181b" },
        horzLines: { color: "#18181b" },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        tickMarkFormatter: (time: any) => formatTickIST(time as number),
        borderColor: "#27272a",
      },
      rightPriceScale: {
        borderColor: "#27272a",
      },
      crosshair: {
        vertLine: { color: "#3f3f46", width: 1, style: 3 },
        horzLine: { color: "#3f3f46", width: 1, style: 3 },
      },
    });

    seriesRef.current = chart.addSeries(CandlestickSeries, {
      upColor: "#10b981",
      downColor: "#ef4444",
      borderVisible: false,
      wickUpColor: "#10b981",
      wickDownColor: "#ef4444",
    });

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight || 420,
        });
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
      seriesRef.current = null;
    };
  }, []);

  // Candle data fetch
  useEffect(() => {
    if (!id || !seriesRef.current) return;
    fetch(`${API}/api/market/candles/${id}?interval=${timeframe}&limit=200`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data.length > 0) {
          seriesRef.current!.setData(json.data);
          const last = json.data[json.data.length - 1];
          currentCandle.current = { time: last.time, open: last.open, high: last.high, low: last.low, close: last.close };
        } else {
          seriesRef.current!.setData([]);
          currentCandle.current = null;
        }
      })
      .catch(() => toast.error("Failed to load candle data"));
  }, [id, timeframe]);

  // Socket price updates
  useEffect(() => {
    if (!id) return;
    const socket = getSocket();

    const onConnect = () => socket.emit("getPrice", { symbol: id });

    const onPriceUpdate = (updates: any) => {
      if (!updates[id] || !seriesRef.current) return;
      const lastPrice = Number(updates[id].last);
      setPrevPrice((p) => p);
      setPrice((prev) => { setPrevPrice(prev); return lastPrice; });

      const now = Math.floor(Date.now() / 1000);
      const tf = timeframeRef.current;
      const candleTime = Math.floor(now / tf) * tf;

      if (!currentCandle.current || currentCandle.current.time !== candleTime) {
        currentCandle.current = { time: candleTime, open: lastPrice, high: lastPrice, low: lastPrice, close: lastPrice };
      } else {
        currentCandle.current.high = Math.max(currentCandle.current.high, lastPrice);
        currentCandle.current.low = Math.min(currentCandle.current.low, lastPrice);
        currentCandle.current.close = lastPrice;
      }
      seriesRef.current.update(currentCandle.current);
    };

    const onPriceData = (result: any) => {
      if (result.success && result.data) setPrice(Number(result.data.last));
    };

    const onReconnect = () => socket.emit("getPrice", { symbol: id });

    socket.on("connect", onConnect);
    socket.on("priceUpdate", onPriceUpdate);
    socket.on("priceData", onPriceData);
    socket.on("reconnect", onReconnect);

    if (socket.connected) socket.emit("getPrice", { symbol: id });

    return () => {
      socket.off("connect", onConnect);
      socket.off("priceUpdate", onPriceUpdate);
      socket.off("priceData", onPriceData);
      socket.off("reconnect", onReconnect);
    };
  }, [id]);

  const symbol = id?.replace(/_/g, "/") ?? "";
  const totalCost = (parseFloat(trade?.quantity || "0") * price);

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col">

      {/* ── Top bar ── */}
      <div className="border-b border-zinc-800/80 bg-[#09090b]/95 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">

          {/* Back */}
          <Link
            href="/dashboard"
            className="text-zinc-500 hover:text-white transition-colors shrink-0"
            aria-label="Back to dashboard"
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>

          {/* Symbol + live dot */}
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="font-black text-white text-base tracking-wider">{symbol}</span>
            <span className="hidden sm:inline text-zinc-600 text-xs uppercase tracking-widest font-medium">Live</span>
          </div>

          {/* Price — flashes on change */}
          <div className="ml-auto flex items-baseline gap-2">
            <span
              key={price}
              className={`text-xl sm:text-2xl font-black font-mono tabular-nums transition-colors duration-300 ${
                priceFlash === "up"
                  ? "text-emerald-400"
                  : priceFlash === "down"
                  ? "text-red-400"
                  : "text-white"
              }`}
            >
              ₹{price.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full px-4 sm:px-6 py-4 gap-4">

        {/* Controls row */}
        <div className="flex flex-wrap items-center gap-2 justify-between">

          {/* Timeframe pills */}
          <div className="flex gap-1.5">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf.value}
                onClick={() => setTimeframe(tf.value)}
                className={`px-3 py-1.5 text-xs rounded-lg font-bold tracking-wide transition-all ${
                  timeframe === tf.value
                    ? "bg-zinc-100 text-black"
                    : "bg-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-700 border border-zinc-700/60"
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>

          {/* Buy / Sell */}
          <div className="flex gap-2 ml-auto">
            <button
              onClick={() => setTrade(trade?.type === "BUY" ? null : { type: "BUY", quantity: "0" })}
              className={`px-5 py-2 rounded-xl text-xs font-bold tracking-wide transition-all ${
                trade?.type === "BUY"
                  ? "bg-emerald-500 text-black"
                  : "border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
              }`}
            >
              Buy
            </button>
            <button
              onClick={() => setTrade(trade?.type === "SELL" ? null : { type: "SELL", quantity: "0" })}
              className={`px-5 py-2 rounded-xl text-xs font-bold tracking-wide transition-all ${
                trade?.type === "SELL"
                  ? "bg-red-500 text-white"
                  : "border border-red-500/40 text-red-400 hover:bg-red-500/10"
              }`}
            >
              Sell
            </button>
          </div>
        </div>

        {/* Trade panel — slides in below controls */}
        {trade && (
          <div className="bg-[#111114] border border-zinc-800 rounded-2xl p-4 w-full sm:max-w-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-semibold mb-0.5">
                  {trade.type === "BUY" ? "Buy order" : "Sell order"}
                </p>
                <p className="text-white font-bold text-sm">{symbol}</p>
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
                trade.type === "BUY" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
              }`}>
                @ ₹{price.toFixed(2)}
              </span>
            </div>

            <input
              type="number"
              min="0"
              step="any"
              placeholder="Quantity"
              value={trade.quantity}
              onChange={(e) => setTrade({ ...trade, quantity: e.target.value })}
              className="w-full mb-3 rounded-xl bg-zinc-900 border border-zinc-700 px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-500 transition-colors font-mono"
            />

            {/* Cost estimate */}
            <div className="flex justify-between items-center mb-4 text-xs">
              <span className="text-zinc-500">Estimated total</span>
              <span className={`font-bold font-mono ${trade.type === "BUY" ? "text-emerald-400" : "text-red-400"}`}>
                ₹{totalCost > 0 ? totalCost.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—"}
              </span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={executeTrade}
                disabled={trading || !trade.quantity || parseFloat(trade.quantity) <= 0}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40 active:scale-95 ${
                  trade.type === "BUY"
                    ? "bg-emerald-600 hover:bg-emerald-500"
                    : "bg-red-600 hover:bg-red-500"
                }`}
              >
                {trading ? "Processing…" : `Confirm ${trade.type}`}
              </button>
              <button
                onClick={() => setTrade(null)}
                className="px-3 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm transition-all"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Chart */}
        <div
          ref={chartContainerRef}
          className="flex-1 rounded-2xl border border-zinc-800/80 overflow-hidden"
          style={{ minHeight: "340px", height: "clamp(340px, 55vh, 600px)" }}
        />

        {/* Footer info bar */}
        <div className="flex items-center gap-4 text-[10px] text-zinc-600 font-mono pb-2">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Real-time · IST
          </span>
          <span>TradingView charts</span>
          <span className="ml-auto">{symbol} · {TIMEFRAMES.find(t => t.value === timeframe)?.label} candles</span>
        </div>
      </div>
    </div>
  );
}