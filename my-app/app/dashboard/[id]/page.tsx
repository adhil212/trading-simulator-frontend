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
  
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<ISeriesApi<any> | null>(null);
  const currentCandle = useRef<{time: number, open: number, high: number, low: number, close: number} | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const timeframe = 300; // 5 minutes (seconds)

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
    chartRef.current = chart;
    seriesRef.current = chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e', downColor: '#ef4444', borderVisible: false,
      wickUpColor: '#22c55e', wickDownColor: '#ef4444',
    });
    const handleResize = () => chart.applyOptions({ width: chartContainerRef.current?.clientWidth || 0 });
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  useEffect(() => {
    if (!id) return;
    const socket = io('http://localhost:5000', {
      transports: ['websocket'],
    });
    socketRef.current = socket;
    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      socket.emit('getPrice', { symbol: id });
    });
    socket.on('priceUpdate', (updates) => {
      if (!updates[id] || !seriesRef.current) return;
      
      const priceData = updates[id];
      const lastPrice = Number(priceData.last);
      setPrice(lastPrice);
      const now = Math.floor(Date.now() / 1000);
      const candleTime = Math.floor(now / timeframe) * timeframe;
      
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
      seriesRef.current.update(currentCandle.current as any);
    });
    socket.on('priceData', (result) => {
      if (result.success && result.data) {
        const lastPrice = Number(result.data.last);
        setPrice(lastPrice);
      }
    });
    return () => {
      socket.off('connect');
      socket.off('priceUpdate');
      socket.off('priceData');
      socket.disconnect();
      socketRef.current = null;
    };
  }, [id]);

  return (
    <div className="min-h-screen bg-[#09090b] text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-6 gap-4">
          <div>
            <h1 className="text-sm text-zinc-500 uppercase tracking-widest">Live Market</h1>
            <div className="text-4xl font-mono font-bold">${price.toFixed(2)}</div>
          </div>
        </div>
        <div ref={chartContainerRef} className="rounded-xl border border-zinc-800 overflow-hidden" />
      </div>
    </div>
  );
}