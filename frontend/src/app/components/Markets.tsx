import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { AreaChart, Area, XAxis, ResponsiveContainer } from 'recharts';
import {
  TrendingUp, TrendingDown, RefreshCw, BarChart3, ScanSearch,
  ArrowUpRight, ArrowDownRight, ArrowUpDown, Activity, Star, Zap
} from 'lucide-react';
import { getMarkets, MarketAsset } from '@/services/api';
import { useMarket } from '@/context/MarketContext';
import { useTheme } from '@/context/ThemeContext';

interface MarketsProps {
  onNavigate?: (page: string) => void;
  onAnalyze?: () => void;
}

// Tiny sparkline for table rows
function MiniSparkline({ positive }: { positive: boolean }) {
  const pts = useMemo(() => {
    const d: { i: number; v: number }[] = [];
    let v = 50;
    for (let i = 0; i < 12; i++) { v += (Math.random() - (positive ? 0.35 : 0.65)) * 5; d.push({ i, v }); }
    return d;
  }, [positive]);
  const color = positive ? 'var(--success)' : 'var(--danger)';
  return (
    <div className="h-6 w-16" aria-hidden="true">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={pts}>
          <XAxis dataKey="i" hide padding={{ left: 0, right: 0 }} />
          <defs>
            <linearGradient id={`tsp-${positive ? 'g' : 'r'}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.2} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.2} fill={`url(#tsp-${positive ? 'g' : 'r'})`} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// Larger sparkline for index cards
function IndexSparkline({ positive }: { positive: boolean }) {
  const pts = useMemo(() => {
    const d: { i: number; v: number }[] = [];
    let v = 100;
    for (let i = 0; i < 24; i++) { v += (Math.random() - (positive ? 0.35 : 0.65)) * 3; d.push({ i, v }); }
    return d;
  }, [positive]);
  const color = positive ? 'var(--success)' : 'var(--danger)';
  return (
    <div className="h-10 w-24" aria-hidden="true">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={pts}>
          <XAxis dataKey="i" hide padding={{ left: 0, right: 0 }} />
          <defs>
            <linearGradient id={`isp-${positive ? 'g' : 'r'}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.2} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#isp-${positive ? 'g' : 'r'})`} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

type SortKey = 'symbol' | 'price' | 'change';
type SortDir = 'asc' | 'desc';
const tabs = ['All', 'Stocks'] as const;
type Tab = typeof tabs[number];

export const Markets = ({ onNavigate, onAnalyze }: MarketsProps) => {
  const [category, setCategory] = useState<'stock' | 'crypto'>('stock');
  const [assets, setAssets] = useState<MarketAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>('change');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [activeTab, setActiveTab] = useState<Tab>('All');
  const [filter, setFilter] = useState('');
  const { setSymbol, setAssetType } = useMarket();
  const { theme } = useTheme();

  const fetchMarkets = async () => {
    setLoading(true);
    try { setAssets(await getMarkets(category)); }
    catch (e) { console.error('Markets fetch error:', e); }
    setLoading(false);
  };

  useEffect(() => { fetchMarkets(); }, [category]);

  const goTo = (a: MarketAsset) => {
    setSymbol(a.symbol);
    setAssetType(a.type === 'crypto' ? 'crypto' : 'stock');
    if (onNavigate) onNavigate('Analysis');
    if (onAnalyze) setTimeout(onAnalyze, 50);
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir(key === 'symbol' ? 'asc' : 'desc'); }
  };

  // Derive data
  const indices = assets.filter(a => a.type === 'index');
  const nonIndex = assets.filter(a => a.type !== 'index');
  const filtered = useMemo(() => {
    let list = nonIndex;
    if (activeTab === 'Stocks') list = list.filter(a => a.type !== 'crypto');
    if (activeTab === 'Crypto') list = list.filter(a => a.type === 'crypto');
    if (filter) list = list.filter(a => a.symbol.toLowerCase().includes(filter.toLowerCase()) || a.name.toLowerCase().includes(filter.toLowerCase()));
    return [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'symbol') cmp = a.symbol.localeCompare(b.symbol);
      else if (sortKey === 'price') cmp = a.price - b.price;
      else cmp = a.change - b.change;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [nonIndex, activeTab, filter, sortKey, sortDir]);

  const gainers = [...nonIndex].filter(a => a.change > 0).sort((a, b) => b.change - a.change).slice(0, 10);
  const losers = [...nonIndex].filter(a => a.change < 0).sort((a, b) => a.change - b.change).slice(0, 10);
  const mostActive = [...nonIndex].sort(() => Math.random() - 0.5).slice(0, 5); // placeholder for volume sort

  const cur = (c: string) => c === 'INR' ? '₹' : '$';

  const SortHeader = ({ label, k, align = 'left' }: { label: string; k: SortKey; align?: 'left' | 'right' }) => (
    <th className={`px-4 py-3 text-xs font-semibold text-text-tertiary uppercase tracking-wider cursor-pointer select-none hover:text-text-secondary transition-colors min-h-[44px] text-${align}`}>
      <button onClick={() => toggleSort(k)} className="inline-flex items-center gap-1 min-h-[44px]" aria-label={`Sort by ${label}`}>
        {label}
        <ArrowUpDown className={`h-3 w-3 ${sortKey === k ? 'text-accent' : 'text-text-disabled'}`} strokeWidth={1.5} aria-hidden="true" />
      </button>
    </th>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] }}
      className="space-y-5">

      {/* ═══ PAGE HEADER ═══ */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-sans font-semibold text-text-primary">Markets Overview</h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400 font-medium mt-0.5">Live prices and performance · {filtered.length} assets</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Stock / Crypto toggle */}
          <div className="flex rounded-lg bg-white dark:bg-bg-card border border-gray-200 dark:border-border p-0.5" role="group" aria-label="Asset type">
            <button onClick={() => setCategory('stock')}
              className="flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium bg-gray-100 dark:bg-bg-elevated text-text-primary min-h-[44px]">
              <BarChart3 className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" /> Indian Stocks
            </button>
          </div>
          <button onClick={fetchMarkets} disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-border px-3 py-1.5 text-xs text-gray-500 dark:text-zinc-400 font-medium hover:text-text-primary hover:bg-gray-50 dark:hover:bg-bg-hover transition-colors disabled:opacity-50 min-h-[44px]"
            aria-label="Refresh market data">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} strokeWidth={1.5} aria-hidden="true" /> Refresh
          </button>
        </div>
      </div>

      {/* ═══ MARKET INDICES ═══ */}
      {indices.length > 0 && (
        <section aria-label="Market indices">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {indices.slice(0, 4).map((idx, i) => {
              const pos = idx.change >= 0;
              return (
                <button key={idx.symbol} onClick={() => goTo(idx)}
                  className="rounded-xl bg-white dark:bg-[#18181b] border border-gray-200 dark:border-white/5 shadow-sm dark:shadow-none p-4 text-left hover:bg-gray-50 dark:hover:bg-bg-hover transition-colors min-h-[44px]"
                  aria-label={`${idx.name}: ${cur(idx.currency)}${idx.price.toLocaleString()}, ${pos ? 'up' : 'down'} ${Math.abs(idx.change).toFixed(2)}%`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">{idx.name}</span>
                    <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold
                      ${pos ? 'text-success' : 'text-danger'}`}>
                      {pos ? <ArrowUpRight className="h-3 w-3" strokeWidth={2} aria-hidden="true" /> : <ArrowDownRight className="h-3 w-3" strokeWidth={2} aria-hidden="true" />}
                      {pos ? '+' : ''}{idx.change.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex items-end justify-between">
                    <span className="text-lg font-bold font-mono-num text-text-primary">
                      {cur(idx.currency)}{idx.price.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                    <IndexSparkline positive={pos} />
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* ═══ MAIN CONTENT: Table + Sidebar ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">

        {/* ── Table Section ── */}
        <div className="space-y-3">
          {/* Tabs + Filter */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex rounded-lg bg-white dark:bg-bg-card border border-gray-200 dark:border-border p-0.5" role="tablist" aria-label="Asset filter tabs">
              {tabs.map(t => (
                <button key={t} role="tab" aria-selected={activeTab === t}
                  onClick={() => setActiveTab(t)}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-colors min-h-[44px]
                    ${activeTab === t ? 'bg-gray-100 dark:bg-bg-elevated text-text-primary shadow-sm' : 'text-gray-500 dark:text-zinc-400 hover:text-text-secondary'}`}>
                  {t}
                </button>
              ))}
            </div>
            <div className="relative w-full sm:w-64">
              <ScanSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-text-disabled" strokeWidth={1.5} aria-hidden="true" />
              <input type="search" placeholder="Filter assets..."
                value={filter} onChange={e => setFilter(e.target.value)}
                className="h-9 w-full rounded-lg bg-white dark:bg-bg-card border border-gray-200 dark:border-border pl-8 pr-3 text-xs text-text-primary placeholder:text-gray-400 dark:placeholder:text-text-disabled focus:border-accent focus:outline-none transition-colors"
                aria-label="Filter stocks by name or ticker" />
            </div>
          </div>

          {/* Data Table */}
          <div className="rounded-xl bg-white dark:bg-[#18181b] border border-gray-200 dark:border-white/5 shadow-sm dark:shadow-none overflow-hidden">
            {loading ? (
              <div className="p-12 text-center" role="status">
                <div className="relative h-8 w-8 mx-auto mb-3">
                  <div className="absolute inset-0 rounded-full border-2 border-border" />
                  <div className="absolute inset-0 rounded-full border-2 border-t-info animate-spin" />
                </div>
                <p className="text-sm text-text-tertiary">Fetching market data…</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center text-sm text-text-disabled">No assets found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full" role="table" aria-label="Market assets">
                  <thead className="border-b border-gray-200 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
                    <tr>
                      <SortHeader label="Asset" k="symbol" />
                      <SortHeader label="Price" k="price" align="right" />
                      <SortHeader label="24h %" k="change" align="right" />
                      <th className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider text-center">7d</th>
                      <th className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider text-left">Exchange</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {filtered.map((a, i) => {
                      const pos = a.change >= 0;
                      return (
                        <tr key={a.symbol}
                          onClick={() => goTo(a)}
                          className="hover:bg-bg-hover transition-colors cursor-pointer"
                          aria-label={`${a.symbol}: ${cur(a.currency)}${a.price.toLocaleString()}, ${pos ? 'up' : 'down'} ${Math.abs(a.change).toFixed(2)}%`}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className={`h-7 w-7 rounded-lg flex items-center justify-center text-[10px] font-bold
                                ${pos ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`} aria-hidden="true">
                                {a.type === 'crypto' ? '₿' : a.symbol.slice(0, 2)}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-text-primary">{a.symbol}</p>
                                <p className="text-[11px] text-text-disabled truncate max-w-[120px]">{a.name}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-mono-num font-medium text-text-primary">
                            {cur(a.currency)}{a.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={`inline-flex items-center gap-0.5 text-xs font-semibold font-mono-num
                              ${pos ? 'text-success' : 'text-danger'}`}>
                              {pos ? <ArrowUpRight className="h-3 w-3" strokeWidth={2} aria-hidden="true" /> : <ArrowDownRight className="h-3 w-3" strokeWidth={2} aria-hidden="true" />}
                              {pos ? '+' : ''}{a.change.toFixed(2)}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <MiniSparkline positive={pos} />
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-[10px] font-medium text-text-disabled px-2 py-0.5 rounded-full bg-bg-elevated">
                              {a.exchange}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button className="p-1.5 text-text-disabled hover:text-warning transition-colors min-h-[44px] min-w-[44px] inline-flex items-center justify-center"
                              aria-label={`Add ${a.symbol} to watchlist`} onClick={e => { e.stopPropagation(); }}>
                              <Star className="h-3.5 w-3.5" strokeWidth={1.5} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* ── Right Sidebar ── */}
        <aside className="space-y-3 hidden lg:block" aria-label="Market highlights">
          {/* Top Gainers */}
          <SidebarList title="Top Gainers" items={gainers.slice(0, 5)} type="gain" loading={loading} goTo={goTo} cur={cur} />
          {/* Top Losers */}
          <SidebarList title="Top Losers" items={losers.slice(0, 5)} type="loss" loading={loading} goTo={goTo} cur={cur} />
          {/* Most Active */}
          <SidebarList title="Most Active" items={mostActive.slice(0, 5)} type="neutral" loading={loading} goTo={goTo} cur={cur} />
        </aside>
      </div>
    </motion.div>
  );
};

// ─── Sidebar List ───────────────────────────────────────────────────────────

function SidebarList({ title, items, type, loading, goTo, cur }: {
  title: string; items: MarketAsset[]; type: 'gain' | 'loss' | 'neutral';
  loading: boolean; goTo: (a: MarketAsset) => void; cur: (c: string) => string;
}) {
  const Icon = type === 'gain' ? TrendingUp : type === 'loss' ? TrendingDown : Activity;
  const iconColor = type === 'gain' ? 'text-success-muted' : type === 'loss' ? 'text-danger-muted' : 'text-accent-muted';
  return (
    <div className="rounded-xl bg-white dark:bg-[#18181b] border border-gray-200 dark:border-white/5 shadow-sm dark:shadow-none">
      <div className="px-4 py-2.5 border-b border-gray-200 dark:border-white/5 flex items-center gap-1.5">
        <Icon className={`h-3.5 w-3.5 ${iconColor}`} strokeWidth={1.5} aria-hidden="true" />
        <h3 className="text-[10px] font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">{title}</h3>
      </div>
      <div className="divide-y divide-border/30" role="list">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="px-4 py-2.5 animate-pulse"><div className="h-3 bg-bg-elevated rounded w-full" /></div>
          ))
        ) : items.length === 0 ? (
          <div className="px-4 py-3 text-xs text-text-disabled text-center">No data</div>
        ) : (
          items.map(a => {
            const pos = a.change >= 0;
            return (
              <button key={a.symbol} role="listitem" onClick={() => goTo(a)}
                className="w-full flex items-center justify-between px-4 py-2 hover:bg-bg-hover transition-colors text-left min-h-[44px]"
                aria-label={`${a.symbol}: ${pos ? 'up' : 'down'} ${Math.abs(a.change).toFixed(2)}%`}>
                <div>
                  <p className="text-xs font-medium text-text-primary">{a.symbol}</p>
                  <p className="text-[10px] text-text-disabled truncate max-w-[80px]">{a.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-mono-num text-text-primary">{cur(a.currency)}{a.price.toLocaleString(undefined, { maximumFractionDigits: 1 })}</p>
                  <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold font-mono-num ${pos ? 'text-success' : 'text-danger'}`}>
                    {pos ? <ArrowUpRight className="h-2.5 w-2.5" strokeWidth={2} aria-hidden="true" /> : <ArrowDownRight className="h-2.5 w-2.5" strokeWidth={2} aria-hidden="true" />}
                    {pos ? '+' : ''}{a.change.toFixed(2)}%
                  </span>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
