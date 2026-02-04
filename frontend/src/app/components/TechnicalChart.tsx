import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ComposedChart,
  Line,
} from 'recharts';
import { motion } from 'motion/react';
import { useMarket } from '@/context/MarketContext';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-slate-700 bg-slate-900/90 p-3 shadow-xl backdrop-blur-md">
        <p className="mb-2 font-medium text-slate-300">Day {label}</p>
        <div className="space-y-1">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-xs">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="capitalize text-slate-400">{entry.name}:</span>
              <span className="font-mono font-medium text-slate-100">{entry.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export const TechnicalChart = () => {
  const { data } = useMarket();

  const history = data?.history ?? [];
  const symbol = data?.symbol ?? 'Loading...';
  const currency = data?.currency === 'INR' ? '₹' : '$';
  const rsi = data?.technical?.rsi ?? 50;

  const chartData = history.map((price, index) => {
    const priceVal = parseFloat(price.toFixed(2));
    const avgPrice = history.reduce((a, b) => a + b, 0) / history.length;
    const stdDev = Math.sqrt(history.reduce((sq, n) => sq + Math.pow(n - avgPrice, 2), 0) / history.length);

    return {
      day: index + 1,
      price: priceVal,
      upper: parseFloat((avgPrice + stdDev * 1.5).toFixed(2)),
      lower: parseFloat((avgPrice - stdDev * 1.5).toFixed(2)),
      rsi: Math.max(0, Math.min(100, 50 + (index - history.length / 2) * (rsi - 50) / (history.length / 2))),
    };
  });

  const minPrice = history.length > 0 ? Math.min(...history) * 0.98 : 0;
  const maxPrice = history.length > 0 ? Math.max(...history) * 1.02 : 100;

  return (
    <div className="flex flex-col gap-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm"
      >
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-100">{symbol} Technical Analysis</h3>
            <p className="text-sm text-slate-400">Price Action & Volatility Bands (30 Days)</p>
          </div>
          <div className="flex gap-2">
            <span className="rounded bg-slate-800 px-2 py-1 text-xs text-slate-300">1W</span>
            <span className="rounded bg-cyan-500/20 px-2 py-1 text-xs text-cyan-400">1M</span>
            <span className="rounded bg-slate-800 px-2 py-1 text-xs text-slate-300">3M</span>
          </div>
        </div>

        <div className="h-[300px] w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="day" stroke="#64748b" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} domain={[minPrice, maxPrice]} tickFormatter={(val) => `${currency}${val.toLocaleString()}`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="price" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorPrice)" name={`Price (${currency})`} />
                <Line type="monotone" dataKey="upper" stroke="#334155" strokeDasharray="5 5" strokeWidth={1} dot={false} name="Upper Band" />
                <Line type="monotone" dataKey="lower" stroke="#334155" strokeDasharray="5 5" strokeWidth={1} dot={false} name="Lower Band" />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-500">No price data available</div>
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 backdrop-blur-sm"
      >
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-medium text-slate-400">RSI (14) Indicator</h4>
          <span className={`text-sm font-semibold ${rsi > 70 ? 'text-rose-400' : rsi < 30 ? 'text-emerald-400' : 'text-slate-300'}`}>
            {rsi.toFixed(1)} - {rsi > 70 ? 'Overbought' : rsi < 30 ? 'Oversold' : 'Neutral'}
          </span>
        </div>
        <div className="h-[100px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="day" hide />
              <YAxis stroke="#64748b" tick={{ fontSize: 10 }} domain={[0, 100]} ticks={[0, 30, 50, 70, 100]} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" />
              <ReferenceLine y={30} stroke="#22c55e" strokeDasharray="3 3" />
              <Line type="monotone" dataKey="rsi" stroke="#a855f7" strokeWidth={2} dot={false} name="RSI" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
};
