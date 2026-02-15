import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, TrendingUp, TrendingDown, Clock, ArrowRight, Zap, BarChart3, Shield, Activity } from 'lucide-react';
import { useMarket } from '@/context/MarketContext';
import { searchAssets, SearchResult, getMarkets, MarketAsset } from '@/services/api';

interface HomeProps {
    onNavigate: (page: string) => void;
}

export const Home = ({ onNavigate }: HomeProps) => {
    const { setSymbol, setAssetType } = useMarket();
    const [searchValue, setSearchValue] = useState('');
    const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [indices, setIndices] = useState<MarketAsset[]>([]);
    const [movers, setMovers] = useState<{ gainers: MarketAsset[]; losers: MarketAsset[] }>({ gainers: [], losers: [] });
    const debounceRef = useRef<NodeJS.Timeout | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Fetch live indices and movers
    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await getMarkets('stock');
                const idxList = data.filter(a => ['NIFTY', 'SENSEX', 'BANKNIFTY', 'NIFTYIT'].includes(a.symbol));
                setIndices(idxList);

                const stocks = data.filter(a => !['NIFTY', 'SENSEX', 'BANKNIFTY', 'NIFTYIT'].includes(a.symbol) && a.type !== 'index');
                const sorted = [...stocks].sort((a, b) => b.change - a.change);
                setMovers({
                    gainers: sorted.filter(s => s.change > 0).slice(0, 4),
                    losers: sorted.filter(s => s.change < 0).sort((a, b) => a.change - b.change).slice(0, 3),
                });
            } catch (err) {
                console.error('Failed to fetch home data:', err);
            }
        };
        fetchData();
    }, []);

    // Debounced search
    useEffect(() => {
        if (!searchValue.trim()) { setSuggestions([]); setShowDropdown(false); return; }
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(async () => {
            try {
                const results = await searchAssets(searchValue);
                setSuggestions(results);
                setShowDropdown(results.length > 0);
                setSelectedIndex(-1);
            } catch { /* ignore */ }
        }, 200);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [searchValue]);

    // Click outside
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setShowDropdown(false);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const goToAsset = (sym: string, type: string = 'stock') => {
        setSymbol(sym);
        setAssetType(type);
        onNavigate('Dashboard');
    };

    const handleSearchSelect = (result: SearchResult) => {
        goToAsset(result.symbol, result.type);
        setSearchValue('');
        setShowDropdown(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => Math.max(prev - 1, -1));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (selectedIndex >= 0 && suggestions[selectedIndex]) {
                handleSearchSelect(suggestions[selectedIndex]);
            } else if (searchValue.trim()) {
                goToAsset(searchValue.trim().toUpperCase());
            }
        } else if (e.key === 'Escape') {
            setShowDropdown(false);
        }
    };

    // Static trending data (placeholder for future backend integration)
    const trendingStocks = [
        { rank: 1, name: 'JIOFIN', type: 'Hype Bubble', score: 92, color: 'red' as const },
        { rank: 2, name: 'ZOMATO', type: 'Value Buy', score: 24, color: 'green' as const },
        { rank: 3, name: 'IREDA', type: 'Extreme Greed', score: 88, color: 'orange' as const },
        { rank: 4, name: 'ADANIENT', type: 'High Volatility', score: 76, color: 'red' as const },
    ];

    const newsItems = [
        { source: 'Reuters', time: '2m ago', headline: 'Tata Motors global sales up 9% in Q3, JLR demand remains strong.', sentiment: 'Positive' as const },
        { source: 'MoneyControl', time: '15m ago', headline: 'RBI Governor warns of sticky inflation, suggests cautious stance on rates.', sentiment: 'Neutral' as const },
        { source: 'Bloomberg', time: '1h ago', headline: 'Adani Green hits lower circuit amid new regulatory scrutiny.', sentiment: 'Negative' as const },
        { source: 'ET Markets', time: '2h ago', headline: 'IT stocks rally as Infosys raises FY25 revenue guidance.', sentiment: 'Positive' as const },
    ];

    const sectorData = [
        { name: 'IT', change: '+2.1%', positive: true },
        { name: 'AUTO', change: '+1.4%', positive: true },
        { name: 'BANK', change: '+0.6%', positive: true },
        { name: 'REALTY', change: '-1.2%', positive: false },
        { name: 'PHARMA', change: '-0.5%', positive: false },
        { name: 'FMCG', change: '0.0%', positive: null },
    ];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="min-h-[calc(100vh-80px)]"
        >
            {/* ─── HERO SECTION ─── */}
            <div className="relative pt-12 pb-10 px-4 flex flex-col items-center justify-center text-center overflow-hidden">
                {/* Background Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[450px] bg-blue-600/15 rounded-full blur-[140px] pointer-events-none" />
                <div className="absolute top-20 right-1/4 w-[300px] h-[300px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent leading-tight">
                        Decode Market<br />Psychology
                    </h1>
                    <p className="text-slate-400 text-lg mb-8 max-w-2xl mx-auto">
                        Institutional-grade intelligence. We analyze the conflict between{' '}
                        <span className="text-purple-400 font-medium">Market Sentiment</span> and{' '}
                        <span className="text-blue-400 font-medium">Price Reality</span>.
                    </p>
                </motion.div>

                {/* Big Search Bar */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="relative w-full max-w-2xl group z-10"
                    ref={dropdownRef}
                >
                    <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                        <Search className="text-slate-500 group-focus-within:text-blue-400 transition-colors" size={22} />
                    </div>
                    <input
                        type="text"
                        placeholder="Search any stock (e.g. RELIANCE, TATAMOTORS, INFY)..."
                        className="w-full pl-14 pr-24 py-5 bg-slate-900/80 border border-slate-700 rounded-2xl text-lg placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 shadow-2xl backdrop-blur-xl transition-all text-slate-100"
                        value={searchValue}
                        onChange={e => setSearchValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    <div className="absolute inset-y-0 right-4 flex items-center gap-2">
                        <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-1 rounded border border-slate-700 font-mono">↵ Enter</span>
                    </div>

                    {/* Search Dropdown */}
                    <AnimatePresence>
                        {showDropdown && suggestions.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 5 }}
                                className="absolute top-full left-0 mt-2 w-full max-h-60 overflow-y-auto rounded-xl border border-slate-700 bg-slate-900/95 backdrop-blur-xl shadow-2xl z-50"
                            >
                                {suggestions.map((s, i) => (
                                    <button
                                        key={s.symbol}
                                        onClick={() => handleSearchSelect(s)}
                                        className={`w-full flex items-center justify-between px-5 py-3 text-left transition-colors ${i === selectedIndex ? 'bg-blue-500/10' : 'hover:bg-slate-800/50'
                                            }`}
                                    >
                                        <div>
                                            <span className="font-bold text-sm text-slate-100">{s.symbol}</span>
                                            <span className="text-sm text-slate-400 ml-3">{s.name}</span>
                                        </div>
                                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${s.type === 'crypto' ? 'text-amber-400 bg-amber-500/10' : 'text-cyan-400 bg-cyan-500/10'
                                            }`}>{s.exchange}</span>
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Quick Tags */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="mt-4 flex flex-wrap justify-center gap-2"
                >
                    {['RELIANCE', 'TCS', 'NIFTY', 'HDFCBANK', 'INFY'].map(sym => (
                        <button
                            key={sym}
                            onClick={() => goToAsset(sym)}
                            className="text-xs px-3 py-1.5 rounded-full border border-slate-700 text-slate-400 hover:border-blue-500/50 hover:text-blue-400 hover:bg-blue-500/5 transition-all"
                        >
                            {sym}
                        </button>
                    ))}
                </motion.div>
            </div>

            {/* ─── MARKET INDICES (Live Scoreboard) ─── */}
            <div className="max-w-7xl mx-auto px-4 mb-10">
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
                >
                    {indices.length > 0 ? indices.slice(0, 4).map(idx => (
                        <div
                            key={idx.symbol}
                            onClick={() => goToAsset(idx.symbol)}
                            className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl hover:border-slate-600 transition-all cursor-pointer group"
                        >
                            <div className="text-slate-400 text-xs font-bold tracking-wider mb-1">{idx.name}</div>
                            <div className="flex justify-between items-end">
                                <div className="text-xl font-mono font-bold text-white">
                                    {idx.currency === 'INR' ? '₹' : '$'}{idx.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                </div>
                                <div className={`text-sm font-bold flex items-center gap-1 ${idx.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {idx.change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                    {idx.change >= 0 ? '+' : ''}{idx.change.toFixed(2)}%
                                </div>
                            </div>
                        </div>
                    )) : (
                        // Skeleton cards
                        [1, 2, 3, 4].map(i => (
                            <div key={i} className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl animate-pulse">
                                <div className="h-3 bg-slate-800 rounded w-20 mb-3" />
                                <div className="h-6 bg-slate-800 rounded w-32" />
                            </div>
                        ))
                    )}
                </motion.div>
            </div>

            {/* ─── MAIN 3-COLUMN GRID ─── */}
            <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-6 pb-16">

                {/* COLUMN 1: NEWS */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="lg:col-span-1 flex flex-col gap-3"
                >
                    <SectionHeader title="Live Market Pulse" icon={<Clock size={18} />} />
                    <div className="flex flex-col gap-3">
                        {newsItems.map((item, i) => (
                            <NewsCard key={i} {...item} />
                        ))}
                        <button
                            onClick={() => onNavigate('Sentiment')}
                            className="w-full py-3 text-sm text-slate-400 hover:text-white border border-slate-800 rounded-xl hover:bg-slate-800/50 transition-all flex items-center justify-center gap-2"
                        >
                            View All Sentiment <ArrowRight size={14} />
                        </button>
                    </div>
                </motion.div>

                {/* COLUMN 2: TOP MOVERS */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                    className="lg:col-span-1 flex flex-col gap-3"
                >
                    <SectionHeader title="Top Movers (Nifty)" icon={<TrendingUp size={18} />} />
                    <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
                        {movers.gainers.length > 0 ? (
                            <>
                                {movers.gainers.map(s => (
                                    <MoverRow key={s.symbol} asset={s} onClick={() => goToAsset(s.symbol)} isUp />
                                ))}
                                <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent my-0.5" />
                                {movers.losers.map(s => (
                                    <MoverRow key={s.symbol} asset={s} onClick={() => goToAsset(s.symbol)} isUp={false} />
                                ))}
                            </>
                        ) : (
                            <div className="p-6 text-center text-slate-500 text-sm">Loading movers...</div>
                        )}
                    </div>
                    <button
                        onClick={() => onNavigate('Markets')}
                        className="w-full py-3 text-sm text-slate-400 hover:text-white border border-slate-800 rounded-xl hover:bg-slate-800/50 transition-all flex items-center justify-center gap-2"
                    >
                        View All Markets <ArrowRight size={14} />
                    </button>
                </motion.div>

                {/* COLUMN 3: TRENDING + SECTORS */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                    className="lg:col-span-1 flex flex-col gap-3"
                >
                    <SectionHeader title="Trending on Flux" icon={<Zap size={18} />} />
                    <p className="text-xs text-slate-500 -mt-1 mb-1">Stocks with highest search volume & hype today.</p>

                    <div className="flex flex-col gap-3">
                        {trendingStocks.map(t => (
                            <TrendingCard
                                key={t.rank}
                                {...t}
                                onClick={() => goToAsset(t.name)}
                            />
                        ))}
                    </div>

                    {/* Sector Heatmap */}
                    <div className="mt-3 p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
                        <div className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                            <BarChart3 size={14} className="text-blue-400" />
                            Sector Heatmap
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            {sectorData.map(s => (
                                <div
                                    key={s.name}
                                    className={`p-2 rounded text-xs font-bold text-center border ${s.positive === true
                                            ? 'bg-green-500/15 text-green-400 border-green-500/25'
                                            : s.positive === false
                                                ? 'bg-red-500/15 text-red-400 border-red-500/25'
                                                : 'bg-slate-700/20 text-slate-400 border-slate-700/50'
                                        }`}
                                >
                                    <div className="text-[10px] text-slate-500 mb-0.5">{s.name}</div>
                                    {s.change}
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* ─── BOTTOM CTA ─── */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="max-w-7xl mx-auto px-4 pb-12"
            >
                <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/30 p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <h3 className="text-xl font-bold text-slate-100 mb-1">Ready to analyze your portfolio?</h3>
                        <p className="text-sm text-slate-400">Get AI-powered insights on risk, sentiment, and technical signals.</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => onNavigate('Portfolio')}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold text-sm hover:from-blue-500 hover:to-cyan-500 transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)]"
                        >
                            <Shield size={16} /> Open Portfolio
                        </button>
                        <button
                            onClick={() => onNavigate('Markets')}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-slate-700 text-slate-300 font-semibold text-sm hover:bg-slate-800 transition-colors"
                        >
                            <Activity size={16} /> Explore Markets
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

// ─── Sub-components ───

const SectionHeader = ({ title, icon }: { title: string; icon: React.ReactNode }) => (
    <div className="flex items-center gap-2 text-slate-200 font-bold text-lg">
        <div className="p-1.5 bg-blue-500/10 rounded-md text-blue-400">{icon}</div>
        {title}
    </div>
);

const NewsCard = ({ source, time, headline, sentiment }: {
    source: string; time: string; headline: string; sentiment: 'Positive' | 'Neutral' | 'Negative';
}) => (
    <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl hover:bg-slate-800/60 transition-colors cursor-pointer group">
        <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-blue-400">{source}</span>
                <span className="text-[10px] text-slate-500">• {time}</span>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${sentiment === 'Positive' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                    sentiment === 'Negative' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                        'bg-slate-700/50 text-slate-400 border border-slate-700'
                }`}>{sentiment === 'Positive' ? '📈 Bullish' : sentiment === 'Negative' ? '📉 Bearish' : '⚖️ Neutral'}</span>
        </div>
        <h3 className="text-sm font-medium text-slate-200 leading-snug group-hover:text-blue-300 transition-colors">
            {headline}
        </h3>
    </div>
);

const MoverRow = ({ asset, onClick, isUp }: { asset: MarketAsset; onClick: () => void; isUp: boolean }) => (
    <div
        onClick={onClick}
        className="flex justify-between items-center py-3 px-4 hover:bg-slate-800/50 transition-colors border-b border-slate-800/50 last:border-0 cursor-pointer"
    >
        <div className="flex items-center gap-3">
            <div className={`h-7 w-7 rounded-md flex items-center justify-center text-xs font-bold ${isUp ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                }`}>{asset.symbol.slice(0, 2)}</div>
            <div>
                <div className="font-bold text-sm text-slate-200">{asset.symbol}</div>
                <div className="text-[10px] text-slate-500">{asset.name}</div>
            </div>
        </div>
        <div className="text-right">
            <div className="text-sm font-mono text-slate-200">
                {asset.currency === 'INR' ? '₹' : '$'}{asset.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </div>
            <div className={`text-xs font-bold ${isUp ? 'text-green-400' : 'text-red-400'}`}>
                {asset.change >= 0 ? '+' : ''}{asset.change.toFixed(2)}%
            </div>
        </div>
    </div>
);

const TrendingCard = ({ rank, name, type, score, color, onClick }: {
    rank: number; name: string; type: string; score: number;
    color: 'red' | 'green' | 'orange'; onClick: () => void;
}) => {
    const colorMap = {
        red: { text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
        green: { text: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
        orange: { text: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
    };
    const c = colorMap[color];

    return (
        <div
            onClick={onClick}
            className="flex items-center justify-between p-3 bg-slate-900/50 border border-slate-800 rounded-xl hover:border-slate-600 transition-all cursor-pointer"
        >
            <div className="flex items-center gap-3">
                <div className="text-lg font-black text-slate-600">#{rank}</div>
                <div>
                    <div className="font-bold text-sm text-white">{name}</div>
                    <div className={`text-[10px] font-bold uppercase ${c.text}`}>{type}</div>
                </div>
            </div>
            <div className={`text-sm font-mono font-bold px-2.5 py-1 rounded-md ${c.bg} ${c.text} border ${c.border}`}>
                {score}
            </div>
        </div>
    );
};
