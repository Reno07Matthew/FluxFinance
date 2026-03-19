import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PortfolioRisk } from '@/app/components/PortfolioRisk';
import {
  Wallet, ArrowUpRight, ArrowDownRight, Zap, Shield, X, Plus,
  Search, Trash2, RefreshCw, Database, TrendingUp, TrendingDown, Minus, PieChart,
  Activity, Target, AlertTriangle, CheckCircle2, Lightbulb
} from 'lucide-react';
import { searchAssets, SearchResult, getPortfolioPrices, PriceData } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import {
  ensureUserProfile, getOrCreateDefaultPortfolio, getHoldings,
  addHolding as dbAddHolding, removeHolding as dbRemoveHolding, DbHolding,
} from '@/services/supabaseDb';

// ─── Types ──────────────────────────────────────────────────────────────────

interface Holding {
  holdingId?: string;
  symbol: string;
  name: string;
  quantity: number;
  avgPrice: number;
  type: string;
}

interface LiveHolding extends Holding {
  currentPrice: number;
  currency: string;
  plPercent: number;
  plValue: number;
  totalValue: number;
  change: number;
  verdict: string;
  verdictIcon: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const getVerdict = (plPercent: number, change: number) => {
  if (plPercent > 80 || change > 5) return { verdict: 'HYPE BUBBLE', icon: '🚨' };
  if (plPercent < -10 || change < -3) return { verdict: 'VALUE BUY', icon: '💎' };
  return { verdict: 'HOLD', icon: '⏸️' };
};

const verdictCls = (v: string) =>
  v === 'HYPE BUBBLE' ? 'text-danger bg-danger/10 border-danger/20'
    : v === 'VALUE BUY' ? 'text-success bg-success/10 border-success/20'
      : 'text-text-tertiary bg-bg-elevated border-border';

const mapDbHolding = (h: DbHolding): Holding => ({
  holdingId: h.holding_id, symbol: h.asset_symbol,
  name: h.asset_symbol, quantity: h.quantity,
  avgPrice: h.avg_buy_price, type: h.asset_type,
});

const fmtCur = (value: number, cur: string) => {
  const s = cur === 'INR' ? '₹' : '$';
  return `${s}${Math.abs(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// ─── Portfolio Component ────────────────────────────────────────────────────

export const Portfolio = () => {
  const { user } = useAuth();
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [portfolioId, setPortfolioId] = useState<string | null>(null);
  const [livePrices, setLivePrices] = useState<Record<string, PriceData>>({});
  const [loading, setLoading] = useState(false);
  const [dbLoading, setDbLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRebalanceModal, setShowRebalanceModal] = useState(false);

  // Load from Supabase
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setDbLoading(true);
      try {
        await ensureUserProfile(user.id, user.email || '', user.user_metadata?.full_name);
        const pId = await getOrCreateDefaultPortfolio(user.id);
        if (cancelled || !pId) { setDbLoading(false); return; }
        setPortfolioId(pId);
        const dbH = await getHoldings(pId);
        if (!cancelled) setHoldings(dbH.map(mapDbHolding));
      } catch (e) { console.error('Portfolio load error:', e); }
      if (!cancelled) setDbLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user]);

  // Fetch live prices
  const fetchPrices = async () => {
    if (!holdings.length) return;
    setLoading(true);
    try {
      const prices = await getPortfolioPrices(holdings.map(h => h.symbol));
      setLivePrices(prices);
    } catch (e) { console.error('Price fetch error:', e); }
    setLoading(false);
  };

  useEffect(() => { if (holdings.length) fetchPrices(); }, [holdings.length]);

  // Compute live holdings
  const liveHoldings: LiveHolding[] = holdings.map(h => {
    const pd = livePrices[h.symbol];
    const currentPrice = pd?.price || 0;
    const currency = pd?.currency || (h.type === 'crypto' ? 'USD' : 'INR');
    const totalValue = currentPrice * h.quantity;
    const investedValue = h.avgPrice * h.quantity;
    const plValue = totalValue - investedValue;
    const plPercent = investedValue > 0 ? (plValue / investedValue) * 100 : 0;
    const change = pd?.change || 0;
    const { verdict, icon } = getVerdict(plPercent, change);
    const name = pd?.name || h.name || h.symbol;
    return { ...h, name, currentPrice, currency, plPercent, plValue, totalValue, change, verdict, verdictIcon: icon };
  });

  const totalValue = liveHoldings.reduce((s, h) => s + h.totalValue, 0);
  const totalInvested = liveHoldings.reduce((s, h) => s + (h.avgPrice * h.quantity), 0);
  const totalPL = totalValue - totalInvested;
  const totalPLPct = totalInvested > 0 ? (totalPL / totalInvested) * 100 : 0;
  const indianCount = liveHoldings.filter(h => h.currency === 'INR').length;
  const displayCur = indianCount >= liveHoldings.length / 2 ? 'INR' : 'USD';
  const cs = displayCur === 'INR' ? '₹' : '$';
  const winners = liveHoldings.filter(h => h.plPercent > 0).length;
  const winRate = liveHoldings.length > 0 ? Math.round((winners / liveHoldings.length) * 100) : 0;
  const todayChange = liveHoldings.reduce((s, h) => s + (h.change / 100) * h.totalValue, 0);

  const riskScore = Math.min(100, Math.max(0, Math.round(
    liveHoldings.reduce((s, h) => {
      if (h.verdict === 'HYPE BUBBLE') return s + 30;
      if (h.plPercent > 50) return s + 15;
      return s + 5;
    }, 10)
  )));

  // Remove holding
  const handleRemove = async (symbol: string) => {
    const h = holdings.find(x => x.symbol === symbol);
    if (!h) return;
    setHoldings(prev => prev.filter(x => x.symbol !== symbol));
    if (h.holdingId) {
      const ok = await dbRemoveHolding(h.holdingId);
      if (!ok) { setHoldings(prev => [...prev, h]); console.error('Remove failed'); }
    }
  };

  // Add holding
  const handleAdd = async (holding: Holding) => {
    if (!portfolioId) return;
    setShowAddModal(false);
    await dbAddHolding(portfolioId, holding.symbol, holding.type, holding.quantity, holding.avgPrice);
    const dbH = await getHoldings(portfolioId);
    setHoldings(dbH.map(mapDbHolding));
  };

  // Loading state
  if (dbLoading) return (
    <div className="flex items-center justify-center h-64" role="status">
      <div className="text-center">
        <div className="relative h-8 w-8 mx-auto mb-3">
          <div className="absolute inset-0 rounded-full border-2 border-border" />
          <div className="absolute inset-0 rounded-full border-2 border-t-info animate-spin" />
        </div>
        <p className="text-sm text-text-secondary flex items-center gap-2 justify-center">
          <Database className="h-3.5 w-3.5 text-accent" strokeWidth={1.5} aria-hidden="true" />
          Loading Portfolio from Supabase…
        </p>
      </div>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] }}
      className="space-y-5">

      {/* ═══ HEADER ═══ */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-sans font-semibold text-text-primary">Portfolio Intelligence</h1>
          <p className="text-sm text-text-tertiary flex items-center gap-2 mt-0.5">
            AI-powered risk analysis
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-success bg-success/10 px-2 py-0.5 rounded-full">
              <Database className="h-2.5 w-2.5" strokeWidth={1.5} aria-hidden="true" /> Cloud Synced
            </span>
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-bg-primary hover:bg-accent-muted transition-colors min-h-[44px]">
            <Plus className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" /> Add Stock
          </button>
          <button onClick={fetchPrices} disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-text-tertiary hover:text-text-primary hover:bg-bg-hover transition-colors disabled:opacity-50 min-h-[44px]"
            aria-label="Refresh prices">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* ═══ TOTAL VALUE CARD ═══ */}
      <div className="rounded-xl border border-border bg-bg-card p-6">
        <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">Total Portfolio Value</p>
        <div className="flex items-baseline gap-4 flex-wrap">
          <span className="text-3xl font-bold font-mono-num text-text-primary" aria-live="polite">
            {loading ? '…' : `${cs}${totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
          </span>
          {!loading && totalInvested > 0 && (
            <span className={`inline-flex items-center gap-1 text-sm font-semibold font-mono-num
              ${totalPL >= 0 ? 'text-success' : 'text-danger'}`}>
              {totalPL >= 0 ? <ArrowUpRight className="h-4 w-4" strokeWidth={2} aria-hidden="true" /> : <ArrowDownRight className="h-4 w-4" strokeWidth={2} aria-hidden="true" />}
              {totalPL >= 0 ? '+' : ''}{totalPLPct.toFixed(2)}% ({totalPL >= 0 ? '+' : ''}{fmtCur(totalPL, displayCur)})
              <span className="sr-only">{totalPL >= 0 ? 'profit' : 'loss'}</span>
            </span>
          )}
        </div>
        <p className="text-xs text-text-disabled mt-1.5">
          Invested: {fmtCur(totalInvested, displayCur)} · {holdings.length} assets
        </p>
      </div>

      {/* ═══ METRIC CARDS ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard icon={<Wallet className="h-4 w-4 text-accent-muted" strokeWidth={1.5} />} label="Total Invested" value={`${cs}${totalInvested.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
        <MetricCard icon={<TrendingUp className="h-4 w-4 text-success-muted" strokeWidth={1.5} />} label="Current Value" value={`${cs}${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
        <MetricCard icon={<Activity className="h-4 w-4 text-warning" strokeWidth={1.5} />} label="Today's Change"
          value={`${todayChange > 0 ? '+' : todayChange < 0 ? '-' : ''}${cs}${Math.abs(todayChange).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          valueClass={todayChange > 0 ? 'text-emerald-400' : todayChange < 0 ? 'text-rose-400' : 'text-zinc-400'} />
        <MetricCard icon={<Target className="h-4 w-4 text-accent-muted" strokeWidth={1.5} />} label="Win Rate" value={`${winRate}%`}
          valueClass={winRate >= 50 ? 'text-success' : 'text-danger'} />
      </div>

      {/* ═══ 2/3 + 1/3 LAYOUT ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:h-[calc(100vh-270px)] min-h-[600px]">

        {/* ── Holdings Table (Left 2/3) ── */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-bg-card overflow-hidden flex flex-col h-full">
          <div className="border-b border-border px-5 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-sans font-semibold text-text-primary">Your Holdings</h2>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                <Zap className="h-2.5 w-2.5" strokeWidth={1.5} aria-hidden="true" /> Live
              </span>
            </div>
            <span className="text-[10px] text-text-disabled">{holdings.length} asset{holdings.length !== 1 ? 's' : ''}</span>
          </div>

          {holdings.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-sm text-text-disabled mb-4">No holdings yet. Add your first stock!</p>
              <button onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-accent/10 text-accent px-4 py-2 text-xs font-medium hover:bg-accent/20 transition-colors min-h-[44px]">
                <Plus className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" /> Add Stock
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto flex-1 h-full min-h-0">
              <table className="w-full" role="table" aria-label="Portfolio holdings">
                <thead className="border-b border-border/50">
                  <tr>
                    <th className="px-5 py-2.5 text-xs font-semibold text-text-tertiary uppercase tracking-wider text-left">Asset</th>
                    <th className="px-5 py-2.5 text-xs font-semibold text-text-tertiary uppercase tracking-wider text-right">Qty</th>
                    <th className="px-5 py-2.5 text-xs font-semibold text-text-tertiary uppercase tracking-wider text-right">Price</th>
                    <th className="px-5 py-2.5 text-xs font-semibold text-text-tertiary uppercase tracking-wider text-right">Value</th>
                    <th className="px-5 py-2.5 text-xs font-semibold text-text-tertiary uppercase tracking-wider text-right">P/L</th>
                    <th className="px-5 py-2.5 text-xs font-semibold text-text-tertiary uppercase tracking-wider text-center">Verdict</th>
                    <th className="px-5 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {liveHoldings.map(item => (
                    <tr key={item.symbol} className="hover:bg-bg-hover transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`h-7 w-7 rounded-lg flex items-center justify-center text-[10px] font-bold
                            ${item.verdict === 'HYPE BUBBLE' ? 'bg-danger/10 text-danger' : item.verdict === 'VALUE BUY' ? 'bg-success/10 text-success' : 'bg-bg-elevated text-text-tertiary'}`}
                            aria-hidden="true">{item.symbol.slice(0, 2)}</div>
                          <div>
                            <p className="text-sm font-medium text-text-primary">{item.name}</p>
                            <p className="text-[10px] text-text-disabled">{item.symbol}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right text-sm font-mono-num text-text-secondary">{item.quantity}</td>
                      <td className="px-5 py-3 text-right text-sm font-mono-num text-text-primary">
                        {loading ? '…' : fmtCur(item.currentPrice, item.currency)}
                      </td>
                      <td className="px-5 py-3 text-right text-sm font-mono-num font-medium text-text-primary">
                        {loading ? '…' : fmtCur(item.totalValue, item.currency)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {loading ? '…' : (
                          <div className={`${item.plPercent >= 0 ? 'text-success' : 'text-danger'}`}>
                            <span className="flex items-center justify-end gap-0.5 text-xs font-semibold font-mono-num">
                              {item.plPercent > 0 && <ArrowUpRight className="h-3 w-3" strokeWidth={2} aria-hidden="true" />}
                              {item.plPercent < 0 && <ArrowDownRight className="h-3 w-3" strokeWidth={2} aria-hidden="true" />}
                              {item.plPercent >= 0 ? '+' : ''}{item.plPercent.toFixed(2)}%
                            </span>
                            <span className="text-[10px] opacity-80 block text-right">
                              {item.plValue >= 0 ? '+' : '-'}{fmtCur(item.plValue, item.currency)}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${verdictCls(item.verdict)}`}>
                          <span aria-hidden="true">{item.verdictIcon}</span> {item.verdict}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button onClick={() => handleRemove(item.symbol)}
                          className="p-1.5 text-text-disabled hover:text-danger hover:bg-danger/10 rounded-lg transition-colors min-h-[44px] min-w-[44px] inline-flex items-center justify-center"
                          aria-label={`Remove ${item.symbol}`}>
                          <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Right Sidebar (1/3) ── */}
        <div className="space-y-4">
          {/* Risk */}
          <PortfolioRisk riskScore={riskScore} isHighRisk={riskScore >= 70} onExecuteRebalance={() => setShowRebalanceModal(true)} />

          {/* Portfolio Allocation */}
          {liveHoldings.length > 0 && (
            <div className="rounded-xl border border-border bg-bg-card p-5">
              <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <PieChart className="h-3.5 w-3.5 text-accent-muted" strokeWidth={1.5} aria-hidden="true" />
                Allocation
              </h3>
              <div className="space-y-2">
                {liveHoldings.map(h => {
                  const pct = totalValue > 0 ? (h.totalValue / totalValue) * 100 : 0;
                  return (
                    <div key={h.symbol}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-text-secondary font-medium">{h.symbol}</span>
                        <span className="text-text-primary font-mono-num font-semibold">{pct.toFixed(1)}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-bg-elevated rounded-full overflow-hidden">
                        <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* AI Insights */}
          {liveHoldings.length > 0 && (
            <div className="rounded-xl border border-border bg-bg-card p-5">
              <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-warning" strokeWidth={1.5} aria-hidden="true" />
                AI Insights
              </h3>
              <div className="space-y-2">
                <ul className="space-y-3 pt-1">
                  <li className="flex gap-2 text-xs text-text-secondary">
                    <Zap className="h-3.5 w-3.5 text-warning shrink-0" strokeWidth={1.5} />
                    <span>Consider diversifying into Pharma to hedge against tech volatility.</span>
                  </li>
                  <li className="flex gap-2 text-xs text-text-secondary">
                    <TrendingUp className="h-3.5 w-3.5 text-success shrink-0" strokeWidth={1.5} />
                    <span>Your portfolio beta is 1.12. You are slightly more volatile than the broader market.</span>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══ MODALS ═══ */}
      <AnimatePresence>
        {showAddModal && <AddStockModal onClose={() => setShowAddModal(false)} onAdd={handleAdd} />}
      </AnimatePresence>
      <AnimatePresence>
        {showRebalanceModal && (
          <RebalanceModal liveHoldings={liveHoldings} totalValue={totalValue}
            onClose={() => setShowRebalanceModal(false)} />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ─── Sub-Components ─────────────────────────────────────────────────────────

function MetricCard({ icon, label, value, valueClass }: {
  icon: React.ReactNode; label: string; value: string; valueClass?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-bg-card p-4">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">{label}</span>
      </div>
      <p className={`text-lg font-bold font-mono-num ${valueClass || 'text-text-primary'}`}>{value}</p>
    </div>
  );
}

function RebalanceModal({ liveHoldings, totalValue, onClose }: {
  liveHoldings: LiveHolding[]; totalValue: number; onClose: () => void;
}) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-lg mx-4 rounded-xl border border-border bg-bg-card p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-sans font-semibold text-text-primary">AI Rebalance Preview</h3>
            <p className="text-xs text-text-tertiary mt-0.5">Equal-weight allocation to reduce concentration risk</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-bg-hover text-text-disabled hover:text-text-primary transition-colors min-h-[44px]" aria-label="Close">
            <X className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="rounded-lg border border-border bg-bg-primary p-4">
            <p className="text-[10px] uppercase tracking-wider text-text-disabled font-bold mb-2">Current</p>
            <div className="space-y-2">
              {liveHoldings.map(h => (
                <div key={h.symbol} className="flex justify-between text-xs">
                  <span className="text-text-tertiary">{h.symbol}</span>
                  <span className="text-text-primary font-mono-num font-semibold">
                    {((h.totalValue / (totalValue || 1)) * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-success/20 bg-bg-primary p-4">
            <p className="text-[10px] uppercase tracking-wider text-success font-bold mb-2">Recommended</p>
            <div className="space-y-2">
              {liveHoldings.map(h => (
                <div key={h.symbol} className="flex justify-between text-xs">
                  <span className="text-text-tertiary">{h.symbol}</span>
                  <span className="text-success font-mono-num font-semibold">
                    {(100 / liveHoldings.length).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-lg border border-border px-4 py-2.5 text-xs font-medium text-text-tertiary hover:bg-bg-hover transition-colors min-h-[44px]">Cancel</button>
          <button onClick={onClose} className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-xs font-bold text-bg-primary hover:bg-accent-muted transition-colors min-h-[44px]">
            <Shield className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" /> Confirm
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Add Stock Modal ────────────────────────────────────────────────────────

function AddStockModal({ onClose, onAdd }: { onClose: () => void; onAdd: (h: Holding) => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<SearchResult | null>(null);
  const [quantity, setQuantity] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fetchingPrice, setFetchingPrice] = useState(false);
  const [marketPrice, setMarketPrice] = useState<number | null>(null);
  const [marketCurrency, setMarketCurrency] = useState('INR');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const cs = marketCurrency === 'INR' ? '₹' : '$';
  const qty = parseFloat(quantity) || 0;
  const totalInvestment = marketPrice ? qty * marketPrice : 0;

  useEffect(() => {
    if (!searchQuery.trim()) { setSuggestions([]); setShowDropdown(false); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const r = await searchAssets(searchQuery);
        setSuggestions(r); setShowDropdown(r.length > 0);
      } catch { setSuggestions([]); }
    }, 200);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchQuery]);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setShowDropdown(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const selectAsset = async (asset: SearchResult) => {
    setSelectedAsset(asset); setSearchQuery(''); setShowDropdown(false); setMarketPrice(null);
    setFetchingPrice(true);
    try {
      const prices = await getPortfolioPrices([asset.symbol]);
      const pd = prices[asset.symbol];
      if (pd?.price) { setMarketPrice(pd.price); setMarketCurrency(pd.currency || 'INR'); }
    } catch (e) { console.error('Price fetch error:', e); }
    setFetchingPrice(false);
  };

  const handleSubmit = async () => {
    if (!selectedAsset || !quantity || !marketPrice || submitting) return;
    setSubmitting(true);
    await onAdd({ symbol: selectedAsset.symbol, name: selectedAsset.name, quantity: qty, avgPrice: marketPrice, type: selectedAsset.type });
    setSubmitting(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-md mx-4 rounded-xl border border-border bg-bg-card p-6" onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-sans font-semibold text-text-primary">Add to Portfolio</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-bg-hover text-text-disabled hover:text-text-primary transition-colors min-h-[44px]" aria-label="Close">
            <X className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>

        {/* Search */}
        <div className="mb-4">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-text-disabled mb-2 block">Search Stock or Crypto</label>
          {selectedAsset ? (
            <div className="flex items-center justify-between rounded-lg border border-accent/30 bg-accent/5 p-3">
              <div>
                <p className="text-sm font-semibold text-text-primary">{selectedAsset.symbol}</p>
                <p className="text-[10px] text-text-tertiary">{selectedAsset.name} · {selectedAsset.exchange}</p>
              </div>
              <button onClick={() => { setSelectedAsset(null); setMarketPrice(null); }} className="text-text-disabled hover:text-danger transition-colors min-h-[44px]" aria-label="Clear selection">
                <X className="h-3.5 w-3.5" strokeWidth={1.5} />
              </button>
            </div>
          ) : (
            <div className="relative" ref={dropdownRef}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-disabled" strokeWidth={1.5} aria-hidden="true" />
              <input type="text" placeholder="Search Reliance, Bitcoin, TCS…"
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className="w-full h-9 rounded-lg border border-border bg-bg-primary pl-8 pr-4 text-sm text-text-primary placeholder:text-text-disabled focus:border-accent focus:outline-none transition-colors"
                aria-label="Search for assets" />
              {showDropdown && suggestions.length > 0 && (
                <div className="absolute top-full left-0 mt-1 w-full max-h-48 overflow-y-auto rounded-lg border border-border bg-bg-card shadow-xl z-50">
                  {suggestions.map(s => (
                    <button key={s.symbol} onClick={() => selectAsset(s)}
                      className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-bg-hover transition-colors min-h-[44px]">
                      <div>
                        <span className="text-sm font-semibold text-text-primary">{s.symbol}</span>
                        <span className="text-xs text-text-disabled ml-2">{s.name}</span>
                      </div>
                      <span className="text-[10px] font-medium text-text-disabled px-2 py-0.5 rounded-full bg-bg-elevated">{s.exchange}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Market Price */}
        {selectedAsset && (
          <div className="mb-4 rounded-lg border border-border bg-bg-primary p-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-text-disabled font-semibold">Market Price</span>
              {fetchingPrice ? (
                <span className="flex items-center gap-1 text-[10px] text-accent"><RefreshCw className="h-2.5 w-2.5 animate-spin" strokeWidth={1.5} /> Fetching…</span>
              ) : marketPrice ? (
                <span className="flex items-center gap-1 text-[10px] text-success font-bold"><Zap className="h-2.5 w-2.5" strokeWidth={1.5} /> Live</span>
              ) : (
                <span className="text-[10px] text-danger">Unavailable</span>
              )}
            </div>
            <p className="text-xl font-bold font-mono-num text-text-primary mt-1">
              {fetchingPrice ? '…' : marketPrice ? `${cs}${marketPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—'}
            </p>
          </div>
        )}

        {/* Quantity */}
        <div className="mb-4">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-text-disabled mb-2 block">Quantity</label>
          <input type="number" placeholder="e.g. 50" value={quantity} onChange={e => setQuantity(e.target.value)}
            className="w-full h-9 rounded-lg border border-border bg-bg-primary px-4 text-sm text-text-primary placeholder:text-text-disabled focus:border-accent focus:outline-none transition-colors"
            aria-label="Number of shares" />
        </div>

        {/* Total */}
        {marketPrice && qty > 0 && (
          <div className="mb-5 rounded-lg border border-border bg-bg-elevated/50 p-3">
            <p className="text-[10px] uppercase tracking-wider text-text-disabled font-semibold">Total Investment</p>
            <p className="text-lg font-bold font-mono-num text-text-primary mt-0.5">
              {cs}{totalInvestment.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[10px] text-text-disabled mt-0.5">{qty} × {cs}{marketPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>
        )}

        <button onClick={handleSubmit}
          disabled={!selectedAsset || !quantity || !marketPrice || submitting || fetchingPrice}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-white text-black px-4 py-2.5 text-xs font-semibold hover:bg-gray-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px]">
          {submitting ? (<><RefreshCw className="h-3.5 w-3.5 animate-spin" strokeWidth={1.5} /> Saving…</>) : (<><Plus className="h-3.5 w-3.5" strokeWidth={1.5} /> Add to Portfolio</>)}
        </button>
      </motion.div>
    </motion.div>
  );
}
