"use client";
import { useParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { 
  createChart, 
  CandlestickSeries, 
  ISeriesApi, 
  ColorType 
} from "lightweight-charts";
import { io, Socket } from "socket.io-client";
import toast from "react-hot-toast";

const API = "http://localhost:5000";

const TIMEFRAMES = [
  { label: "1m", value: 60 },
  { label: "5m", value: 300 },
  { label: "15m", value: 900 },
  { label: "1h", value: 3600 },
];

function formatTickIST(sec: number): string {
  return new Date(sec * 1000).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: false,
  });
}

function formatLabelIST(sec: number): string {
  return new Date(sec * 1000).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
}

export default function AssetDetailPage() {
  const { id } = useParams() as { id: string };
  const [price, setPrice] = useState<number>(0);
  const [timeframe, setTimeframe] = useState(60);
  const [trade, setTrade] = useState<{ type: "BUY" | "SELL"; quantity: string } | null>(null);
  const [trading, setTrading] = useState(false);

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const seriesRef = useRef<ISeriesApi<any> | null>(null);
  const currentCandle = useRef<{time: number, open: number, high: number, low: number, close: number} | null>(null);
  const timeframeRef = useRef(timeframe);
  timeframeRef.current = timeframe;

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

  useEffect(() => {
    if (!chartContainerRef.current) return;
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 500,
      layout: { 
        background: { type: ColorType.Solid, color: '#09090b' }, 
        textColor: '#d1d1d1',
        attributionLogo: false,
      },
      localization: {
        timeFormatter: (time: any) => formatLabelIST(time as number),
      },
      grid: { vertLines: { color: '#1e222d' }, horzLines: { color: '#1e222d' } },
      timeScale: { 
        timeVisible: true, 
        secondsVisible: false,
        tickMarkFormatter: (time: any) => formatTickIST(time as number),
      },
    });
    seriesRef.current = chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e', downColor: '#ef4444', borderVisible: false,
      wickUpColor: '#22c55e', wickDownColor: '#ef4444',
    });
    const handleResize = () => chart.applyOptions({ width: chartContainerRef.current?.clientWidth || 0 });
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      seriesRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!id || !seriesRef.current) return;
    fetch(`${API}/api/market/candles/${id}?interval=${timeframe}&limit=200`)
      .then(r => r.json())
      .then(json => {
        if (json.success && json.data.length > 0) {
          seriesRef.current!.setData(json.data);
          const last = json.data[json.data.length - 1];
          currentCandle.current = { time: last.time, open: last.open, high: last.high, low: last.low, close: last.close };
        } else {
          seriesRef.current!.setData([]);
          currentCandle.current = null;
        }
      })
      .catch(() => {});
  }, [id, timeframe]);

  useEffect(() => {
    if (!id) return;
    const socket: Socket = io(API, {
      transports: ['websocket'],
    });
    socket.on('connect', () => {
      socket.emit('getPrice', { symbol: id });
    });
    socket.on('priceUpdate', (updates) => {
      if (!updates[id] || !seriesRef.current) return;
      const priceData = updates[id];
      const lastPrice = Number(priceData.last);
      setPrice(lastPrice);
      const now = Math.floor(Date.now() / 1000);
      const tf = timeframeRef.current;
      const candleTime = Math.floor(now / tf) * tf;

      if (!currentCandle.current || currentCandle.current.time !== candleTime) {
        currentCandle.current = {
          time: candleTime,
          open: lastPrice,
          high: lastPrice,
          low: lastPrice,
          close: lastPrice
        };
      } else {
        currentCandle.current.high = Math.max(currentCandle.current.high, lastPrice);
        currentCandle.current.low = Math.min(currentCandle.current.low, lastPrice);
        currentCandle.current.close = lastPrice;
      }
      seriesRef.current.update(currentCandle.current);
    });
    socket.on('priceData', (result) => {
      if (result.success && result.data) {
        setPrice(Number(result.data.last));
      }
    });
    socket.on('connect_error', () => {});
    socket.on('disconnect', (reason) => {
      if (reason === 'io server disconnect' || reason === 'transport close') {
        toast.error('Disconnected from server');
      }
    });
    socket.on('reconnect', () => {
      socket.emit('getPrice', { symbol: id });
      toast.success('Reconnected to server');
    });
    socket.on('reconnect_failed', () => {
      toast.error('Could not reconnect to server');
    });
    return () => {
      socket.disconnect();
    };
  }, [id]);

  return (
    <div className="min-h-screen bg-[#09090b] text-white p-3 sm:p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-3 md:gap-4">
          <div className="flex flex-wrap items-end gap-3 w-full md:w-auto">
            <div className="min-w-0 flex-1 md:flex-none">
              <h1 className="text-sm text-zinc-500 uppercase tracking-widest">Live Market</h1>
              <div className="text-2xl sm:text-3xl md:text-4xl font-mono font-bold truncate">₹{price.toFixed(2)}</div>
            </div>
            <div className="flex gap-2 pb-1 shrink-0">
              <button
                onClick={() => setTrade({ type: "BUY", quantity: "0" })}
                className="px-3 sm:px-4 py-2 rounded-xl border border-green-500/50 text-green-400 font-bold hover:bg-green-500/20 transition-all text-xs sm:text-sm"
              >
                Buy
              </button>
              <button
                onClick={() => setTrade({ type: "SELL", quantity: "0" })}
                className="px-3 sm:px-4 py-2 rounded-xl border border-red-500/50 text-red-400 font-bold hover:bg-red-500/20 transition-all text-xs sm:text-sm"
              >
                Sell
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 sm:gap-2 w-full md:w-auto">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf.value}
                onClick={() => setTimeframe(tf.value)}
                className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${
                  timeframe === tf.value
                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                    : "bg-zinc-800 text-zinc-400 border border-zinc-700 hover:text-white"
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>

        {trade && (
          <div className="mb-4 p-4 rounded-xl bg-zinc-900 border border-zinc-700 w-full sm:w-auto sm:max-w-xs">
            <div className="flex items-center justify-between mb-3">
              <span className={`font-bold ${trade.type === "BUY" ? "text-green-400" : "text-red-400"}`}>
                {trade.type} {id.replace(/_/g, "/")}
              </span>
              <span className="text-xs text-zinc-500">~₹{(parseFloat(trade.quantity || "0") * price).toFixed(2)}</span>
            </div>
            <input
              type="number"
              min="0"
              step="any"
              placeholder="Quantity"
              value={trade.quantity}
              onChange={(e) => setTrade({ ...trade, quantity: e.target.value })}
              className="w-full mb-3 rounded-lg bg-zinc-800 border border-zinc-600 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
            />
            <div className="flex gap-2">
              <button
                onClick={executeTrade}
                disabled={trading || !trade.quantity || parseFloat(trade.quantity) <= 0}
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
          </div>
        )}

        <div ref={chartContainerRef} className="rounded-xl border border-zinc-800 overflow-hidden max-w-full" />
      </div>
    </div>
  );
}
