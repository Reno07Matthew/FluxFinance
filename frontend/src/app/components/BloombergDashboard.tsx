import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ComposedChart, Area, Bar, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import {
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Clock,
  Newspaper, Zap, BarChart3, Activity
} from 'lucide-react';

// ─── Mock Data ──────────────────────────────────────────────────────────────

const indices = [
  { name: 'Nifty 50', value: '23,465.10', change: 0.34, currency: '₹' },
  { name: 'Sensex', value: '77,301.08', change: 0.51, currency: '₹' },
  { name: 'Bank Nifty', value: '50,432.85', change: -0.12, currency: '₹' },
  { name: 'Nifty IT', value: '35,890.40', change: 1.15, currency: '₹' },
  { name: 'Nifty Auto', value: '24,150.20', change: 0.82, currency: '₹' },
];

const topGainers = [
  { symbol: 'TATAPOWER', name: 'Tata Power Co.', price: '₹432.50', change: 5.82 },
  { symbol: 'ADANIPORTS', name: 'Adani Ports', price: '₹1,298.30', change: 4.17 },
  { symbol: 'ZOMATO', name: 'Zomato Ltd', price: '₹245.60', change: 3.65 },
  { symbol: 'BAJFINANCE', name: 'Bajaj Finance', price: '₹7,890.25', change: 3.12 },
  { symbol: 'SBIN', name: 'State Bank of India', price: '₹834.15', change: 2.94 },
];

const topLosers = [
  { symbol: 'DRREDDY', name: 'Dr. Reddys Labs', price: '₹5,234.80', change: -3.78 },
  { symbol: 'SUNPHARMA', name: 'Sun Pharma', price: '₹1,567.90', change: -2.91 },
  { symbol: 'NESTLEIND', name: 'Nestle India', price: '₹2,456.70', change: -2.43 },
  { symbol: 'WIPRO', name: 'Wipro Ltd', price: '₹458.35', change: -1.87 },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel', price: '₹1,234.50', change: -1.24 },
];

const newsItems = [
  { headline: 'RBI Holds Rates Steady, Maintains \'Withdrawal\' Stance on Liquidity', source: 'Reuters', time: '12m ago', sentiment: 'neutral' },
  { headline: 'Tata Power Q3 Results Beat Estimates, Stock Surges 5%', source: 'Moneycontrol', time: '28m ago', sentiment: 'bullish' },
  { headline: 'IT Sector Faces Headwinds as US Spending Slows Down', source: 'Economic Times', time: '1h ago', sentiment: 'bearish' },
  { headline: 'Adani Group Stocks Rally on Infrastructure Investment Plans', source: 'LiveMint', time: '2h ago', sentiment: 'bullish' },
  { headline: 'Gold Prices Surge to New All-Time Highs on Inflation Fears', source: 'Bloomberg', time: '3h ago', sentiment: 'bullish' },
  { headline: 'Pharma Stocks Under Pressure as FDA Tightens Regulations', source: 'CNBC-TV18', time: '4h ago', sentiment: 'bearish' },
];

function genChart(days: number, trend: boolean) {
  const pts: { date: string; value: number; volume: number }[] = [];
  let v = 100;
  for (let i = 0; i < days; i++) {
    v += (Math.random() - (trend ? 0.35 : 0.65)) * 3;
    pts.push({ 
      date: `D${i}`, 
      value: Math.round(v * 100) / 100,
      volume: Math.floor(Math.random() * 5000) + 1000 
    });
  }
  return pts;
}

// ─── Child Animation Config ────────────────────────────────────────────────

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const child = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } } };

interface DashboardProps { onNavigate?: (page: string) => void; onAnalyze?: () => void; }

// ─── Dashboard Component ───────────────────────────────────────────────────

export const BloombergDashboard = ({ onNavigate, onAnalyze }: DashboardProps) => {
  const [timeframe, setTimeframe] = useState('1M');
  const chartData = useMemo(() => genChart(timeframe === '1D' ? 24 : timeframe === '1W' ? 7 : timeframe === '1M' ? 30 : 90, true), [timeframe]);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">

      {/* ═══ MARKET INDICES STRIP ═══ */}
      <motion.div variants={child}>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {indices.map(idx => {
            const up = idx.change >= 0;
            return (
              <div key={idx.name}
                className="group rounded-xl bg-white dark:bg-[#18181b] border border-gray-200 dark:border-white/5 shadow-sm dark:shadow-none p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-all duration-200 cursor-pointer">
                <p className="text-xs text-gray-500 dark:text-zinc-400 font-medium mb-1.5">{idx.name}</p>
                <div className="flex items-end justify-between">
                  <span className="text-lg font-bold font-mono-num text-text-primary">{idx.value}</span>
                  <span className={`inline-flex items-center gap-0.5 text-xs font-semibold font-mono-num ${up ? 'text-success' : 'text-danger'}`}>
                    {up ? <ArrowUpRight className="h-3 w-3" strokeWidth={2} /> : <ArrowDownRight className="h-3 w-3" strokeWidth={2} />}
                    {up ? '+' : ''}{idx.change.toFixed(2)}%
                  </span>
                </div>
                <MiniSparkline positive={up} />
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* ═══ BENTO GRID: Chart + Gainers + Losers ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Featured Chart (2/3 span) */}
        <motion.div variants={child} className="lg:col-span-2 rounded-xl bg-white dark:bg-[#18181b] border border-gray-200 dark:border-white/5 shadow-sm dark:shadow-none p-6 flex flex-col min-h-[520px]">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Market Overview</h2>
              <p className="text-xs text-gray-500 dark:text-zinc-400 font-medium mt-0.5">Nifty 50 · Daily Performance</p>
            </div>
            <div className="flex items-center gap-1 bg-bg-elevated rounded-lg p-1">
              {['1D', '1W', '1M', '3M'].map(tf => (
                <button key={tf} onClick={() => setTimeframe(tf)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors
                    ${timeframe === tf ? 'bg-accent text-white' : 'text-text-disabled hover:text-text-secondary'}`}>
                  {tf}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 w-full min-h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                <XAxis dataKey="date" hide padding={{ left: 0, right: 0 }} />
                <YAxis yAxisId="price" hide domain={['dataMin - 2', 'dataMax + 2']} />
                <YAxis yAxisId="volume" orientation="right" hide domain={[0, 'dataMax * 5']} />
                <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '12px' }} />
                <Area yAxisId="price" type="monotone" dataKey="value" stroke="var(--accent)" strokeWidth={2} fill="url(#colorPrice)" dot={false} />
                <Bar yAxisId="volume" dataKey="volume" fill="#ffffff" opacity={0.1} barSize={6} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Gainers + Losers (1/3 span, stacked) */}
        <div className="space-y-4">
          {/* Top Gainers */}
          <motion.div variants={child} className="rounded-xl bg-white dark:bg-[#18181b] border border-gray-200 dark:border-white/5 shadow-sm dark:shadow-none overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-200 dark:border-white/5 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-success" strokeWidth={1.5} />
              <h3 className="text-sm font-semibold text-text-primary">Top Gainers</h3>
            </div>
            <div className="divide-y border-gray-200 dark:border-white/5">
              {topGainers.map(s => (
                <button key={s.symbol}
                  className="w-full flex items-center justify-between px-5 py-2.5 hover:bg-bg-hover transition-colors group"
                  onClick={() => { if (onNavigate) onNavigate('Analysis'); }}>
                  <div className="text-left">
                    <p className="text-sm font-medium text-text-primary group-hover:text-accent transition-colors">{s.symbol}</p>
                    <p className="text-[10px] text-gray-500 dark:text-zinc-400 font-medium truncate max-w-[100px]">{s.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono-num text-text-primary">{s.price}</p>
                    <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold font-mono-num text-success">
                      <ArrowUpRight className="h-2.5 w-2.5" strokeWidth={2} /> +{s.change.toFixed(2)}%
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Top Losers */}
          <motion.div variants={child} className="rounded-xl bg-white dark:bg-[#18181b] border border-gray-200 dark:border-white/5 shadow-sm dark:shadow-none overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-200 dark:border-white/5 flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-danger" strokeWidth={1.5} />
              <h3 className="text-sm font-semibold text-text-primary">Top Losers</h3>
            </div>
            <div className="divide-y border-gray-200 dark:border-white/5">
              {topLosers.map(s => (
                <button key={s.symbol}
                  className="w-full flex items-center justify-between px-5 py-2.5 hover:bg-bg-hover transition-colors group"
                  onClick={() => { if (onNavigate) onNavigate('Analysis'); }}>
                  <div className="text-left">
                    <p className="text-sm font-medium text-text-primary group-hover:text-accent transition-colors">{s.symbol}</p>
                    <p className="text-[10px] text-gray-500 dark:text-zinc-400 font-medium truncate max-w-[100px]">{s.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono-num text-text-primary">{s.price}</p>
                    <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold font-mono-num text-danger">
                      <ArrowDownRight className="h-2.5 w-2.5" strokeWidth={2} /> {s.change.toFixed(2)}%
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ═══ NEWS FEED ═══ */}
      <motion.div variants={child}>
        <div className="flex items-center gap-2 mb-3">
          <Newspaper className="h-4 w-4 text-gray-500 dark:text-zinc-400" strokeWidth={1.5} />
          <h2 className="text-sm font-semibold text-text-primary">Latest Market News</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {newsItems.map((n, i) => (
            <motion.div key={i} variants={child}
              className="rounded-xl bg-white dark:bg-[#18181b] border border-gray-200 dark:border-white/5 shadow-sm dark:shadow-none p-5 hover:bg-gray-50 dark:hover:bg-white/5 transition-all duration-200 cursor-pointer group">
              <div className="flex items-start gap-3">
                <div className={`shrink-0 h-8 w-8 rounded-lg flex items-center justify-center
                  ${n.sentiment === 'bullish' ? 'bg-success/10' : n.sentiment === 'bearish' ? 'bg-danger/10' : 'bg-bg-elevated'}`}>
                  {n.sentiment === 'bullish' ? <TrendingUp className="h-4 w-4 text-success" strokeWidth={1.5} />
                    : n.sentiment === 'bearish' ? <TrendingDown className="h-4 w-4 text-danger" strokeWidth={1.5} />
                    : <Activity className="h-4 w-4 text-text-disabled" strokeWidth={1.5} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary leading-snug group-hover:text-accent transition-colors line-clamp-2">
                    {n.headline}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] text-gray-500 dark:text-zinc-400 font-medium">{n.source}</span>
                    <span className="text-gray-500 dark:text-zinc-400">·</span>
                    <span className="text-[10px] text-gray-500 dark:text-zinc-400 font-medium flex items-center gap-0.5">
                      <Clock className="h-2.5 w-2.5" strokeWidth={1.5} /> {n.time}
                    </span>
                    <span className={`ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full
                      ${n.sentiment === 'bullish' ? 'text-success bg-success/10' : n.sentiment === 'bearish' ? 'text-danger bg-danger/10' : 'text-text-tertiary bg-bg-elevated'}`}>
                      {n.sentiment === 'bullish' ? '↑ Bullish' : n.sentiment === 'bearish' ? '↓ Bearish' : '— Neutral'}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Mini Sparkline ─────────────────────────────────────────────────────────

function MiniSparkline({ positive }: { positive: boolean }) {
  const pts = useMemo(() => {
    const d: { i: number; v: number }[] = [];
    let v = 50;
    for (let i = 0; i < 12; i++) { v += (Math.random() - (positive ? 0.35 : 0.65)) * 5; d.push({ i, v }); }
    return d;
  }, [positive]);
  const color = positive ? 'var(--success)' : 'var(--danger)';
  return (
    <div className="h-6 w-full mt-2" aria-hidden="true">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={pts}>
          <XAxis dataKey="i" hide padding={{ left: 0, right: 0 }} />
          <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
