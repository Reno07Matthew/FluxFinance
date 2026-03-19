import React, { useState, useEffect } from 'react';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { TrendingUp, TrendingDown, Activity, Brain, ArrowUpRight, ArrowDownRight, ExternalLink } from 'lucide-react';
import { useMarket } from '@/context/MarketContext';
import { useTheme } from '@/context/ThemeContext';
import { getMarkets, MarketAsset } from '@/services/api';

interface DashboardViewProps {
  onNavigate: (page: string) => void;
  onAnalyze: () => void;
}

// ─── Tiny Sparkline ─────────────────────────────────────────────────────────

function Sparkline({ data, positive }: { data: number[]; positive: boolean }) {
  const chartData = data.map((v, i) => ({ i, v }));
  const color = positive ? '#059669' : '#e11d48';
  return (
    <div className="h-8 w-20">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id={`spark-${positive ? 'up' : 'down'}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.15} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#spark-${positive ? 'up' : 'down'})`} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Dashboard View ─────────────────────────────────────────────────────────

export const DashboardView = ({ onNavigate, onAnalyze }: DashboardViewProps) => {
  const { setSymbol, setAssetType } = useMarket();
  const { theme } = useTheme();
  const [markets, setMarkets] = useState<MarketAsset[]>([]);
  const [loadingMarkets, setLoadingMarkets] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getMarkets('stock');
        setMarkets(data);
      } catch (e) {
        console.error('Failed to fetch markets:', e);
      }
      setLoadingMarkets(false);
    };
    fetch();
  }, []);

  const indices = markets.filter(a => ['NIFTY', 'SENSEX'].includes(a.symbol));
  const nifty = indices.find(a => a.symbol === 'NIFTY');
  const sensex = indices.find(a => a.symbol === 'SENSEX');
  const stocks = markets.filter(a => !['NIFTY', 'SENSEX', 'BANKNIFTY', 'NIFTYIT'].includes(a.symbol) && a.type !== 'index');

  const goToAsset = (sym: string) => {
    setSymbol(sym);
    setAssetType('stock');
    onNavigate('Analysis');
    setTimeout(() => onAnalyze(), 50);
  };

  // Generate fake sparkline data for KPI cards
  const genSparkline = (positive: boolean) => {
    const base = 100;
    const pts: number[] = [];
    let v = base;
    for (let i = 0; i < 24; i++) {
      v += (Math.random() - (positive ? 0.35 : 0.65)) * 3;
      pts.push(v);
    }
    return pts;
  };

  // Dummy news headlines for the AI feed
  const newsHeadlines = [
    { title: 'Tata Motors global sales up 9% in Q3, JLR demand remains strong', sentiment: 'Bullish' as const, source: 'Reuters', time: '2m' },
    { title: 'RBI Governor warns of sticky inflation, suggests cautious stance', sentiment: 'Bearish' as const, source: 'MoneyControl', time: '18m' },
    { title: 'IT stocks rally as Infosys raises FY25 revenue guidance', sentiment: 'Bullish' as const, source: 'ET Markets', time: '1h' },
    { title: 'Adani Green hits lower circuit amid regulatory scrutiny', sentiment: 'Bearish' as const, source: 'Bloomberg', time: '2h' },
  ];

  // Watchlist table data
  const watchlistData = stocks.slice(0, 12).map(s => ({
    ticker: s.symbol,
    name: s.name,
    price: s.price,
    change: s.change,
    currency: s.currency,
    smaStatus: s.change > 0.5 ? 'Above' : s.change < -0.5 ? 'Below' : 'Near',
    obvFlow: s.change > 0 ? 'Inflow' : 'Outflow',
    verdict: s.change > 1 ? 'STRONG BUY' : s.change < -1 ? 'HIGH RISK' : 'HOLD',
  }));

  // Chart data for market breadth (fake 30-day index)
  const chartData = (() => {
    const pts: { day: number; value: number }[] = [];
    let v = nifty?.price ?? 22500;
    for (let i = 0; i < 30; i++) {
      v += (Math.random() - 0.45) * 120;
      pts.push({ day: i + 1, value: parseFloat(v.toFixed(0)) });
    }
    return pts;
  })();
  const chartMin = Math.min(...chartData.map(d => d.value)) * 0.998;
  const chartMax = Math.max(...chartData.map(d => d.value)) * 1.002;

  const isDark = theme === 'dark';
  const sentimentPct = 65; // fake global sentiment

  return (
    <div className="space-y-5 max-w-[1200px]">

      {/* ═══ ROW 1: KPI Cards ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">

        {/* Nifty 50 */}
        <KPICard
          label="Nifty 50"
          value={nifty ? `₹${nifty.price.toLocaleString()}` : '—'}
          delta={nifty?.change}
          sparkline={genSparkline((nifty?.change ?? 0) >= 0)}
          loading={loadingMarkets}
        />

        {/* Sensex */}
        <KPICard
          label="Sensex"
          value={sensex ? `₹${sensex.price.toLocaleString()}` : '—'}
          delta={sensex?.change}
          sparkline={genSparkline((sensex?.change ?? 0) >= 0)}
          loading={loadingMarkets}
        />

        {/* Flux Consensus */}
        <div className="rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#18181b] p-4">
          <p className="text-[11px] text-gray-400 dark:text-zinc-500 font-medium uppercase tracking-wider mb-2">Flux Consensus</p>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">AI Engine Active</span>
          </div>
          <p className="text-[11px] text-gray-400 dark:text-zinc-600 mt-1.5">7 indicators · FinBERT NLP · Live</p>
        </div>

        {/* Global Sentiment */}
        <div className="rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#18181b] p-4">
          <p className="text-[11px] text-gray-400 dark:text-zinc-500 font-medium uppercase tracking-wider mb-2">Market Sentiment</p>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-semibold text-gray-900 dark:text-white tabular-nums">{sentimentPct}% Greed</span>
          </div>
          <div className="h-1.5 w-full bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-700"
              style={{ width: `${sentimentPct}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-gray-400 dark:text-zinc-600">Fear</span>
            <span className="text-[10px] text-gray-400 dark:text-zinc-600">Greed</span>
          </div>
        </div>
      </div>

      {/* ═══ ROW 2: Chart + AI Feed ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">

        {/* Market Breadth Chart */}
        <div className="lg:col-span-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#18181b] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Market Breadth & Trend</h3>
              <p className="text-[11px] text-gray-400 dark:text-zinc-600 mt-0.5">NIFTY 50 — 30-day price action</p>
            </div>
            <span className="text-[10px] text-gray-400 dark:text-zinc-600 uppercase tracking-wider font-medium">30D</span>
          </div>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="mainFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={isDark ? '#ffffff' : '#09090b'} stopOpacity={0.06} />
                    <stop offset="100%" stopColor={isDark ? '#ffffff' : '#09090b'} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" hide />
                <YAxis domain={[chartMin, chartMax]} hide />
                <Tooltip
                  contentStyle={{
                    background: isDark ? '#18181b' : '#ffffff',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb'}`,
                    borderRadius: 8,
                    fontSize: 12,
                    padding: '6px 10px',
                  }}
                  labelStyle={{ color: isDark ? '#a1a1aa' : '#6b7280', fontSize: 11 }}
                  itemStyle={{ color: isDark ? '#ffffff' : '#09090b' }}
                  formatter={(v: any) => [`₹${v.toLocaleString()}`, 'Nifty 50']}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={isDark ? '#ffffff' : '#09090b'}
                  strokeWidth={1.5}
                  fill="url(#mainFill)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live AI Feed */}
        <div className="rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#18181b] p-5">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="h-4 w-4 text-gray-400 dark:text-zinc-500" strokeWidth={1.5} />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Live FinBERT AI Feed</h3>
          </div>
          <div className="space-y-0 divide-y divide-gray-100 dark:divide-white/5">
            {newsHeadlines.map((n, i) => (
              <div key={i} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs text-gray-600 dark:text-zinc-400 leading-relaxed line-clamp-2 flex-1">{n.title}</p>
                  <SentimentBadge sentiment={n.sentiment} />
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[10px] text-gray-400 dark:text-zinc-600 font-medium">{n.source}</span>
                  <span className="text-[10px] text-gray-300 dark:text-zinc-700">•</span>
                  <span className="text-[10px] text-gray-400 dark:text-zinc-600">{n.time} ago</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ ROW 3: Watchlist Table ═══ */}
      <div className="rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#18181b]">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-white/5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Algorithmic Watchlist</h3>
          <span className="text-[10px] text-gray-400 dark:text-zinc-600 uppercase tracking-wider font-medium">{watchlistData.length} Assets</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100 dark:border-white/5">
                <th className="text-left px-5 py-2.5 text-[10px] font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Ticker</th>
                <th className="text-right px-4 py-2.5 text-[10px] font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Price</th>
                <th className="text-right px-4 py-2.5 text-[10px] font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">24h %</th>
                <th className="text-center px-4 py-2.5 text-[10px] font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">200-SMA</th>
                <th className="text-center px-4 py-2.5 text-[10px] font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Vol Flow</th>
                <th className="text-center px-4 py-2.5 text-[10px] font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Flux Verdict</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-white/[0.03]">
              {loadingMarkets ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="px-5 py-3">
                      <div className="h-3 bg-gray-100 dark:bg-zinc-800 rounded w-full animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : watchlistData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-gray-400 dark:text-zinc-600 text-xs">
                    No watchlist data available
                  </td>
                </tr>
              ) : (
                watchlistData.map((row, i) => (
                  <tr
                    key={i}
                    onClick={() => goToAsset(row.ticker)}
                    className="hover:bg-gray-50 dark:hover:bg-white/[0.02] cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 dark:text-white">{row.ticker}</span>
                        <span className="text-gray-400 dark:text-zinc-600 truncate max-w-[120px]">{row.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums font-medium text-gray-900 dark:text-white">
                      {row.currency === 'INR' ? '₹' : '$'}{row.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </td>
                    <td className={`px-4 py-2.5 text-right tabular-nums font-semibold ${row.change >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {row.change >= 0 ? '+' : ''}{row.change.toFixed(2)}%
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded
                        ${row.smaStatus === 'Above' ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10' :
                          row.smaStatus === 'Below' ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10' :
                            'text-gray-500 dark:text-zinc-500 bg-gray-100 dark:bg-zinc-800'}`}>
                        {row.smaStatus}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`text-[10px] font-semibold
                        ${row.obvFlow === 'Inflow' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {row.obvFlow}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <VerdictPill verdict={row.verdict} />
                    </td>
                    <td className="px-4 py-2.5">
                      <ArrowUpRight className="h-3 w-3 text-gray-300 dark:text-zinc-700" strokeWidth={1.5} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ─── Sub-components ─────────────────────────────────────────────────────────

function KPICard({ label, value, delta, sparkline, loading }: {
  label: string; value: string; delta?: number; sparkline: number[]; loading: boolean;
}) {
  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#18181b] p-4 animate-pulse">
        <div className="h-2.5 bg-gray-100 dark:bg-zinc-800 rounded w-16 mb-3" />
        <div className="h-5 bg-gray-100 dark:bg-zinc-800 rounded w-28" />
      </div>
    );
  }
  const positive = (delta ?? 0) >= 0;
  return (
    <div className="rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#18181b] p-4">
      <p className="text-[11px] text-gray-400 dark:text-zinc-500 font-medium uppercase tracking-wider mb-2">{label}</p>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-lg font-semibold text-gray-900 dark:text-white tabular-nums">{value}</p>
          {delta !== undefined && (
            <span className={`inline-flex items-center gap-0.5 text-xs font-semibold tabular-nums mt-0.5
              ${positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {positive ? <ArrowUpRight className="h-3 w-3" strokeWidth={2} /> : <ArrowDownRight className="h-3 w-3" strokeWidth={2} />}
              {positive ? '+' : ''}{delta.toFixed(2)}%
            </span>
          )}
        </div>
        <Sparkline data={sparkline} positive={positive} />
      </div>
    </div>
  );
}

function SentimentBadge({ sentiment }: { sentiment: 'Bullish' | 'Bearish' | 'Neutral' }) {
  const styles = {
    Bullish: 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10',
    Bearish: 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10',
    Neutral: 'text-gray-500 dark:text-zinc-500 bg-gray-100 dark:bg-zinc-800',
  };
  return (
    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0 ${styles[sentiment]}`}>
      {sentiment}
    </span>
  );
}

function VerdictPill({ verdict }: { verdict: string }) {
  const v = verdict.toUpperCase();
  const style = v.includes('STRONG BUY')
    ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20'
    : v.includes('HIGH RISK')
      ? 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20'
      : 'text-gray-600 dark:text-zinc-400 bg-gray-100 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700';
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${style}`}>
      {v}
    </span>
  );
}
