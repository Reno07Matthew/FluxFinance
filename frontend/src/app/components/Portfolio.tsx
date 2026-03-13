import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PortfolioRisk } from '@/app/components/PortfolioRisk';
import { Wallet, ArrowUpRight, ArrowDownRight, Zap, Shield, X, Plus, Search, Trash2, RefreshCw, Database } from 'lucide-react';
import { searchAssets, SearchResult, getPortfolioPrices, PriceData } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import {
    ensureUserProfile,
    getOrCreateDefaultPortfolio,
    getHoldings,
    addHolding as dbAddHolding,
    removeHolding as dbRemoveHolding,
    DbHolding,
} from '@/services/supabaseDb';

// Types — local UI representation
interface Holding {
    holdingId?: string;  // Supabase holding_id (undefined for legacy/local)
    symbol: string;
    name: string;
    quantity: number;
    avgPrice: number;
    type: string; // stock | crypto
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

const getVerdictStyle = (verdict: string) => {
    switch (verdict) {
        case 'HYPE BUBBLE': return 'bg-red-500/15 text-red-400 border border-red-500/40';
        case 'VALUE BUY': return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/40';
        case 'HOLD':
        default: return 'bg-slate-500/15 text-slate-400 border border-slate-500/30';
    }
};

const getVerdict = (plPercent: number, change: number): { verdict: string; icon: string } => {
    if (plPercent > 80 || change > 5) return { verdict: 'HYPE BUBBLE', icon: '🚨' };
    if (plPercent < -10 || change < -3) return { verdict: 'VALUE BUY', icon: '💎' };
    return { verdict: 'HOLD', icon: '⏸️' };
};

/** Maps a Supabase DbHolding to the local Holding interface */
const mapDbHolding = (h: DbHolding): Holding => ({
    holdingId: h.holding_id,
    symbol: h.asset_symbol,
    name: h.asset_symbol, // Name will be enriched from price data
    quantity: h.quantity,
    avgPrice: h.avg_buy_price,
    type: h.asset_type,
});

export const Portfolio = () => {
    const { user } = useAuth();
    const [holdings, setHoldings] = useState<Holding[]>([]);
    const [portfolioId, setPortfolioId] = useState<string | null>(null);
    const [livePrices, setLivePrices] = useState<Record<string, PriceData>>({});
    const [loading, setLoading] = useState(false);
    const [dbLoading, setDbLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showRebalanceModal, setShowRebalanceModal] = useState(false);
    const [hoveredRow, setHoveredRow] = useState<string | null>(null);

    // ── Load portfolio & holdings from Supabase on mount ──
    useEffect(() => {
        if (!user) return;
        let cancelled = false;

        const loadFromSupabase = async () => {
            setDbLoading(true);
            try {
                // Ensure user profile exists before creating portfolio (avoids FK error)
                await ensureUserProfile(user.id, user.email || '', user.user_metadata?.full_name);

                const pId = await getOrCreateDefaultPortfolio(user.id);
                if (cancelled || !pId) { setDbLoading(false); return; }
                setPortfolioId(pId);

                const dbHoldings = await getHoldings(pId);
                if (!cancelled) {
                    setHoldings(dbHoldings.map(mapDbHolding));
                }
            } catch (err) {
                console.error('Failed to load portfolio from Supabase:', err);
            }
            if (!cancelled) setDbLoading(false);
        };

        loadFromSupabase();
        return () => { cancelled = true; };
    }, [user]);

    // ── Fetch live prices ──
    const fetchPrices = async () => {
        if (holdings.length === 0) return;
        setLoading(true);
        try {
            const symbols = holdings.map(h => h.symbol);
            const prices = await getPortfolioPrices(symbols);
            setLivePrices(prices);
        } catch (err) {
            console.error('Failed to fetch prices:', err);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (holdings.length > 0) fetchPrices();
    }, [holdings.length]);

    // ── Compute live holdings ──
    const liveHoldings: LiveHolding[] = holdings.map(h => {
        const priceData = livePrices[h.symbol];
        const currentPrice = priceData?.price || 0;
        const currency = priceData?.currency || (h.type === 'crypto' ? 'USD' : 'INR');
        const totalValue = currentPrice * h.quantity;
        const investedValue = h.avgPrice * h.quantity;
        const plValue = totalValue - investedValue;
        const plPercent = investedValue > 0 ? (plValue / investedValue) * 100 : 0;
        const change = priceData?.change || 0;
        const { verdict, icon } = getVerdict(plPercent, change);
        const name = priceData?.name || h.name || h.symbol;

        return { ...h, name, currentPrice, currency, plPercent, plValue, totalValue, change, verdict, verdictIcon: icon };
    });

    const totalValue = liveHoldings.reduce((sum, h) => sum + h.totalValue, 0);
    const totalInvested = liveHoldings.reduce((sum, h) => sum + (h.avgPrice * h.quantity), 0);
    const totalPL = totalValue - totalInvested;
    const totalPLPercent = totalInvested > 0 ? (totalPL / totalInvested) * 100 : 0;

    const indianCount = liveHoldings.filter(h => h.currency === 'INR').length;
    const displayCurrency = indianCount >= liveHoldings.length / 2 ? 'INR' : 'USD';
    const currencySymbol = displayCurrency === 'INR' ? '₹' : '$';

    const riskScore = Math.min(100, Math.max(0, Math.round(
        liveHoldings.reduce((score, h) => {
            if (h.verdict === 'HYPE BUBBLE') return score + 30;
            if (h.plPercent > 50) return score + 15;
            return score + 5;
        }, 10)
    )));
    const isHighRisk = riskScore >= 70;

    // ── Remove Holding (Supabase) ──
    const handleRemoveHolding = async (symbol: string) => {
        const holding = holdings.find(h => h.symbol === symbol);
        if (!holding) return;

        // Optimistic UI update
        setHoldings(prev => prev.filter(h => h.symbol !== symbol));

        if (holding.holdingId) {
            const ok = await dbRemoveHolding(holding.holdingId);
            if (!ok) {
                // Rollback on failure
                setHoldings(prev => [...prev, holding]);
                console.error('Failed to remove holding from Supabase');
            }
        }
    };

    // ── Add Holding (Supabase) ──
    const handleAddHolding = async (holding: Holding) => {
        if (!portfolioId) return;
        setShowAddModal(false);

        await dbAddHolding(
            portfolioId,
            holding.symbol,
            holding.type,
            holding.quantity,
            holding.avgPrice
        );

        // Always reload from DB to get current state
        const dbHoldings = await getHoldings(portfolioId);
        setHoldings(dbHoldings.map(mapDbHolding));
    };

    const formatCurrency = (value: number, cur: string) => {
        const sym = cur === 'INR' ? '₹' : '$';
        return `${sym}${Math.abs(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    // ── Loading state from Supabase ──
    if (dbLoading) {
        return (
            <div className="flex items-center justify-center h-72">
                <div className="text-center">
                    <div className="relative h-14 w-14 mx-auto mb-4">
                        <div className="absolute inset-0 rounded-full border-4 border-slate-800" />
                        <div className="absolute inset-0 rounded-full border-4 border-t-cyan-500 animate-spin" />
                    </div>
                    <p className="text-slate-300 font-medium flex items-center gap-2 justify-center">
                        <Database className="h-4 w-4 text-cyan-400" />
                        Loading Portfolio from Supabase…
                    </p>
                    <p className="text-slate-600 text-xs mt-1">Fetching your holdings from the cloud</p>
                </div>
            </div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h2 className="text-2xl font-bold text-slate-100">Portfolio Intelligence</h2>
                    <p className="text-slate-400 flex items-center gap-2">
                        AI-powered risk analysis and performance tracking
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                            <Database className="h-2.5 w-2.5" /> Cloud Synced
                        </span>
                    </p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-600 transition-colors">
                        <Plus className="h-4 w-4" />
                        Add Stock
                    </button>
                    <button onClick={fetchPrices} disabled={loading} className="flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-400 hover:text-cyan-400 hover:border-cyan-500/50 transition-colors disabled:opacity-50">
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Total Balance Card */}
                <div className="lg:col-span-3 rounded-xl border border-slate-800 bg-gradient-to-r from-slate-900 to-slate-800 p-8">
                    <div className="mb-2 text-sm font-medium text-slate-400">Total Portfolio Value</div>
                    <div className="flex items-baseline gap-4 flex-wrap">
                        <h1 className="text-4xl font-bold text-white">
                            {loading ? '...' : `${currencySymbol}${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                        </h1>
                        {!loading && totalInvested > 0 && (
                            <span className={`flex items-center gap-1 rounded-full px-2 py-1 text-sm font-medium ${totalPL >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                                }`}>
                                {totalPL >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                                {totalPL >= 0 ? '+' : ''}{totalPLPercent.toFixed(2)}% ({totalPL >= 0 ? '+' : ''}{formatCurrency(totalPL, displayCurrency)})
                            </span>
                        )}
                    </div>
                    <div className="mt-2 text-xs text-slate-500">
                        Invested: {formatCurrency(totalInvested, displayCurrency)} · {holdings.length} assets
                    </div>
                </div>

                {/* Risk Analysis */}
                <div className="lg:col-span-3">
                    <PortfolioRisk riskScore={riskScore} isHighRisk={isHighRisk} onExecuteRebalance={() => setShowRebalanceModal(true)} />
                </div>

                {/* Holdings Table */}
                <div className="lg:col-span-3 rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm overflow-hidden">
                    <div className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <h3 className="text-lg font-semibold text-slate-100">Your Holdings</h3>
                            <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded-full">
                                <Zap className="h-3 w-3" />
                                Live Prices
                            </span>
                        </div>
                        <span className="text-xs text-slate-500">{holdings.length} asset{holdings.length !== 1 ? 's' : ''}</span>
                    </div>

                    {holdings.length === 0 ? (
                        <div className="p-12 text-center">
                            <p className="text-slate-500 mb-4">No holdings yet. Add your first stock!</p>
                            <button onClick={() => setShowAddModal(true)} className="inline-flex items-center gap-2 rounded-lg bg-cyan-500/10 text-cyan-400 px-4 py-2 text-sm font-medium hover:bg-cyan-500/20 transition-colors">
                                <Plus className="h-4 w-4" /> Add Stock
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-400">
                                <thead className="bg-slate-950/50 text-xs uppercase text-slate-500">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold">Asset</th>
                                        <th className="px-6 py-4 font-semibold">Qty</th>
                                        <th className="px-6 py-4 font-semibold">Current Price</th>
                                        <th className="px-6 py-4 font-semibold">Total Value</th>
                                        <th className="px-6 py-4 font-semibold">P/L</th>
                                        <th className="px-6 py-4 font-semibold text-center">Flux Verdict</th>
                                        <th className="px-6 py-4 font-semibold text-right"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {liveHoldings.map((item) => (
                                        <motion.tr
                                            key={item.symbol}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="hover:bg-slate-800/50 transition-colors relative"
                                            onMouseEnter={() => setHoveredRow(item.symbol)}
                                            onMouseLeave={() => setHoveredRow(null)}
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`h-9 w-9 rounded-lg flex items-center justify-center font-bold text-sm ${item.verdict === 'HYPE BUBBLE' ? 'bg-red-500/10 text-red-400' :
                                                        item.verdict === 'VALUE BUY' ? 'bg-emerald-500/10 text-emerald-400' :
                                                            'bg-slate-800 text-slate-300'
                                                        }`}>{item.symbol.slice(0, 2)}</div>
                                                    <div>
                                                        <div className="font-medium text-slate-200">{item.name}</div>
                                                        <div className="text-xs text-slate-500">{item.symbol}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-200">{item.quantity}</td>
                                            <td className="px-6 py-4 font-mono text-slate-200">
                                                {loading ? '...' : formatCurrency(item.currentPrice, item.currency)}
                                            </td>
                                            <td className="px-6 py-4 font-medium text-slate-200">
                                                {loading ? '...' : formatCurrency(item.totalValue, item.currency)}
                                            </td>
                                            <td className="px-6 py-4">
                                                {loading ? '...' : (
                                                    <div className={`flex flex-col ${item.plPercent > 0 ? 'text-emerald-400' : item.plPercent < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                                                        <span className="font-medium flex items-center gap-1">
                                                            {item.plPercent > 0 && <ArrowUpRight className="h-3 w-3" />}
                                                            {item.plPercent < 0 && <ArrowDownRight className="h-3 w-3" />}
                                                            {item.plPercent > 0 ? '+' : ''}{item.plPercent.toFixed(2)}%
                                                        </span>
                                                        <span className="text-xs opacity-80">
                                                            {item.plValue >= 0 ? '+' : '-'}{formatCurrency(item.plValue, item.currency)}
                                                        </span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center relative">
                                                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold tracking-wide ${getVerdictStyle(item.verdict)}`}>
                                                    <span>{item.verdictIcon}</span>
                                                    {item.verdict}
                                                </span>

                                                <AnimatePresence>
                                                    {hoveredRow === item.symbol && item.currentPrice > 0 && (
                                                        <motion.div
                                                            initial={{ opacity: 0, y: 5 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            exit={{ opacity: 0, y: 5 }}
                                                            className="absolute z-50 right-4 top-full mt-1 w-64 rounded-lg border border-slate-700 bg-slate-900 p-3 shadow-xl text-left"
                                                        >
                                                            <div className="text-[10px] uppercase tracking-wider text-cyan-400 font-bold mb-1.5">AI Analysis — {item.symbol}</div>
                                                            <p className="text-xs text-slate-300 leading-relaxed">
                                                                {item.verdict === 'HYPE BUBBLE' && <>Gain of <span className="text-red-400 font-semibold">{item.plPercent.toFixed(1)}%</span> suggests overheated rally. Today's move: {item.change > 0 ? '+' : ''}{item.change.toFixed(2)}%. Consider taking partial profits.</>}
                                                                {item.verdict === 'VALUE BUY' && <>Currently underperforming with <span className="text-emerald-400 font-semibold">{item.plPercent.toFixed(1)}%</span> P/L. Fundamentals suggest accumulation zone. Good entry point for adding.</>}
                                                                {item.verdict === 'HOLD' && <>Position is performing within normal range. P/L at <span className="text-slate-300 font-semibold">{item.plPercent.toFixed(1)}%</span>. No action recommended.</>}
                                                            </p>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button onClick={() => handleRemoveHolding(item.symbol)} className="rounded-lg p-1.5 text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 transition-colors" title="Remove">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Stock Modal */}
            <AnimatePresence>
                {showAddModal && <AddStockModal onClose={() => setShowAddModal(false)} onAdd={handleAddHolding} />}
            </AnimatePresence>

            {/* Rebalance Modal */}
            <AnimatePresence>
                {showRebalanceModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowRebalanceModal(false)}>
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="w-full max-w-lg mx-4 rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-100">AI Rebalance Preview</h3>
                                    <p className="text-sm text-slate-400 mt-1">Proposed allocation changes to reduce risk</p>
                                </div>
                                <button onClick={() => setShowRebalanceModal(false)} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"><X className="h-5 w-5" /></button>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                                    <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-3">Current</div>
                                    <div className="space-y-2.5">
                                        {liveHoldings.map(h => (
                                            <div key={h.symbol} className="flex justify-between text-sm">
                                                <span className="text-slate-400">{h.symbol}</span>
                                                <span className="text-slate-200 font-semibold">{((h.totalValue / (totalValue || 1)) * 100).toFixed(1)}%</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="rounded-xl border border-emerald-500/20 bg-slate-950/50 p-4">
                                    <div className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold mb-3">Recommended</div>
                                    <div className="space-y-2.5">
                                        {liveHoldings.map(h => {
                                            const equalWeight = (100 / liveHoldings.length).toFixed(1);
                                            return (
                                                <div key={h.symbol} className="flex justify-between text-sm">
                                                    <span className="text-slate-400">{h.symbol}</span>
                                                    <span className="text-emerald-400 font-semibold">{equalWeight}%</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button onClick={() => setShowRebalanceModal(false)} className="flex-1 rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-400 hover:bg-slate-800 transition-colors">Cancel</button>
                                <button onClick={() => setShowRebalanceModal(false)} className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-2.5 text-sm font-bold text-white hover:from-blue-500 hover:to-cyan-500 transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)]">
                                    <Shield className="h-4 w-4" /> Confirm Rebalance
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

// ──────── Add Stock Modal Component ────────
interface AddStockModalProps {
    onClose: () => void;
    onAdd: (holding: Holding) => void;
}

const AddStockModal = ({ onClose, onAdd }: AddStockModalProps) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
    const [selectedAsset, setSelectedAsset] = useState<SearchResult | null>(null);
    const [quantity, setQuantity] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [fetchingPrice, setFetchingPrice] = useState(false);
    const [marketPrice, setMarketPrice] = useState<number | null>(null);
    const [marketCurrency, setMarketCurrency] = useState('INR');
    const debounceRef = useRef<NodeJS.Timeout | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const currencySymbol = marketCurrency === 'INR' ? '₹' : '$';
    const qty = parseFloat(quantity) || 0;
    const totalInvestment = marketPrice ? qty * marketPrice : 0;

    useEffect(() => {
        if (!searchQuery.trim()) { setSuggestions([]); setShowDropdown(false); return; }
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(async () => {
            try {
                const results = await searchAssets(searchQuery);
                setSuggestions(results);
                setShowDropdown(results.length > 0);
            } catch { setSuggestions([]); }
        }, 200);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [searchQuery]);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setShowDropdown(false);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    // Auto-fetch live market price when an asset is selected
    const selectAsset = async (asset: SearchResult) => {
        setSelectedAsset(asset);
        setSearchQuery('');
        setShowDropdown(false);
        setMarketPrice(null);

        setFetchingPrice(true);
        try {
            const prices = await getPortfolioPrices([asset.symbol]);
            const priceData = prices[asset.symbol];
            if (priceData?.price) {
                setMarketPrice(priceData.price);
                setMarketCurrency(priceData.currency || 'INR');
            }
        } catch (err) {
            console.error('Failed to fetch market price:', err);
        }
        setFetchingPrice(false);
    };

    const handleSubmit = async () => {
        if (!selectedAsset || !quantity || !marketPrice || submitting) return;
        setSubmitting(true);
        await onAdd({
            symbol: selectedAsset.symbol,
            name: selectedAsset.name,
            quantity: qty,
            avgPrice: marketPrice,
            type: selectedAsset.type,
        });
        setSubmitting(false);
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="w-full max-w-md mx-4 rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-5">
                    <h3 className="text-lg font-bold text-slate-100">Add to Portfolio</h3>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"><X className="h-5 w-5" /></button>
                </div>

                {/* Search */}
                <div className="mb-4">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2 block">Search Stock or Crypto</label>
                    {selectedAsset ? (
                        <div className="flex items-center justify-between rounded-lg border border-cyan-500/30 bg-cyan-500/5 p-3">
                            <div>
                                <div className="font-semibold text-slate-100">{selectedAsset.symbol}</div>
                                <div className="text-xs text-slate-400">{selectedAsset.name} · {selectedAsset.exchange}</div>
                            </div>
                            <button onClick={() => { setSelectedAsset(null); setMarketPrice(null); }} className="text-slate-500 hover:text-rose-400 transition-colors"><X className="h-4 w-4" /></button>
                        </div>
                    ) : (
                        <div className="relative" ref={dropdownRef}>
                            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                            <input
                                type="text"
                                placeholder="Search Reliance, Bitcoin, TCS..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full h-10 rounded-lg border border-slate-700 bg-slate-800 pl-10 pr-4 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                            />
                            {showDropdown && suggestions.length > 0 && (
                                <div className="absolute top-full left-0 mt-1 w-full max-h-48 overflow-y-auto rounded-lg border border-slate-700 bg-slate-900/95 backdrop-blur-xl shadow-xl z-50">
                                    {suggestions.map(s => (
                                        <button key={s.symbol} onClick={() => selectAsset(s)} className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-slate-800/50 transition-colors">
                                            <div className="flex-1">
                                                <span className="font-semibold text-sm text-slate-100">{s.symbol}</span>
                                                <span className="text-xs text-slate-500 ml-2">{s.name}</span>
                                            </div>
                                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${s.type === 'crypto' ? 'text-amber-400 bg-amber-500/10' : 'text-cyan-400 bg-cyan-500/10'
                                                }`}>{s.exchange}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Market Price Display (read-only) */}
                {selectedAsset && (
                    <div className="mb-4 rounded-lg border border-slate-800 bg-slate-950/50 p-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Current Market Price</span>
                            {fetchingPrice ? (
                                <span className="flex items-center gap-1.5 text-xs text-cyan-400">
                                    <RefreshCw className="h-3 w-3 animate-spin" /> Fetching live price…
                                </span>
                            ) : marketPrice ? (
                                <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
                                    <Zap className="h-3 w-3" /> Live
                                </span>
                            ) : (
                                <span className="text-xs text-rose-400">Unavailable</span>
                            )}
                        </div>
                        <div className="mt-1.5 text-2xl font-bold text-white">
                            {fetchingPrice ? '...' : marketPrice ? `${currencySymbol}${marketPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                        </div>
                    </div>
                )}

                {/* Quantity */}
                <div className="mb-4">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2 block">Quantity</label>
                    <input
                        type="number"
                        placeholder="e.g. 50"
                        value={quantity}
                        onChange={e => setQuantity(e.target.value)}
                        className="w-full h-10 rounded-lg border border-slate-700 bg-slate-800 px-4 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                </div>

                {/* Total Investment */}
                {marketPrice && qty > 0 && (
                    <div className="mb-5 rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3">
                        <div className="text-[10px] uppercase tracking-wider text-cyan-400/70 font-semibold">Total Investment</div>
                        <div className="text-xl font-bold text-cyan-400 mt-0.5">
                            {currencySymbol}{totalInvestment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1">
                            {qty} × {currencySymbol}{marketPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })} per unit
                        </div>
                    </div>
                )}

                {/* Action */}
                <button
                    onClick={handleSubmit}
                    disabled={!selectedAsset || !quantity || !marketPrice || submitting || fetchingPrice}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2.5 text-sm font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    {submitting ? (
                        <>
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            Saving to Cloud…
                        </>
                    ) : (
                        <>
                            <Plus className="h-4 w-4" />
                            Add to Portfolio
                        </>
                    )}
                </button>
            </motion.div>
        </motion.div>
    );
};

