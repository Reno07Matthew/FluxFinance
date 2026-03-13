import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import {
    Search, Activity, Wifi, TrendingUp, TrendingDown, Shield, Target,
    BarChart3, Zap, ArrowUpRight, ArrowDownRight, Newspaper, Brain,
    Gauge, Radio, ChevronRight,
} from 'lucide-react';

// ─── Mock Data ──────────────────────────────────────────────────────
const generateChartData = () => {
    let price = 2450;
    return Array.from({ length: 30 }, (_, i) => {
        price += (Math.random() - 0.48) * 40;
        return { day: `Day ${i + 1}`, price: Math.round(price * 100) / 100, volume: Math.floor(Math.random() * 5000000) + 1000000 };
    });
};

const MOCK_NEWS = [
    { id: 1, headline: 'Reliance Industries reports record quarterly earnings, beats analyst estimates by 12%', source: 'Economic Times', time: '2m ago', sentiment: 0.87 },
    { id: 2, headline: 'RBI holds repo rate steady at 6.5%, signals accommodative stance for H2 FY26', source: 'Mint', time: '15m ago', sentiment: 0.42 },
    { id: 3, headline: 'Global crude oil prices surge to $92/barrel amid Middle East tensions', source: 'Reuters', time: '28m ago', sentiment: -0.65 },
    { id: 4, headline: 'FII outflows hit ₹15,000 Cr in March amid profit-booking rally', source: 'Bloomberg', time: '45m ago', sentiment: -0.78 },
    { id: 5, headline: 'Nifty IT index rallies 3.2% on strong US tech earnings guidance', source: 'CNBC-TV18', time: '1h ago', sentiment: 0.71 },
    { id: 6, headline: 'Government announces ₹2.5 lakh crore infrastructure spending boost', source: 'Business Standard', time: '2h ago', sentiment: 0.55 },
    { id: 7, headline: 'Adani Group stocks face renewed selling pressure on ESG concerns', source: 'Financial Express', time: '3h ago', sentiment: -0.82 },
    { id: 8, headline: 'Indian GDP growth projection revised upwards to 7.2% by World Bank', source: 'LiveMint', time: '4h ago', sentiment: 0.91 },
];

const INDICATORS = [
    { name: 'RSI (14)', value: 'Oversold — 32.4', signal: 'bullish', detail: 'Reversal Zone' },
    { name: 'SMA-200', value: '₹2,380.50', signal: 'bullish', detail: 'Price Above' },
    { name: 'EMA-50', value: '₹2,425.10', signal: 'bullish', detail: 'Price Above' },
    { name: 'VWAP', value: '₹2,441.75', signal: 'bearish', detail: 'Price Below' },
    { name: 'OBV', value: '12.4M', signal: 'bullish', detail: 'Accumulating' },
    { name: 'SuperTrend', value: '₹2,395.00', signal: 'bullish', detail: 'Buy Signal' },
    { name: 'Pivot Points', value: '₹2,460.00', signal: 'bearish', detail: 'Below Pivot' },
];

// ─── Utility Functions ──────────────────────────────────────────────
const getSentimentColor = (score: number) => {
    if (score >= 0.5) return 'text-emerald-400 bg-emerald-400/15 border-emerald-400/30';
    if (score >= 0.1) return 'text-emerald-300/70 bg-emerald-400/10 border-emerald-400/20';
    if (score >= -0.1) return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
    if (score >= -0.5) return 'text-rose-300/70 bg-rose-400/10 border-rose-400/20';
    return 'text-rose-400 bg-rose-400/15 border-rose-400/30';
};

const getSentimentLabel = (score: number) => {
    if (score >= 0.6) return 'Greed';
    if (score >= 0.2) return 'Optimism';
    if (score >= -0.2) return 'Neutral';
    if (score >= -0.6) return 'Caution';
    return 'Fear';
};

// ─── Floating Panel Wrapper ─────────────────────────────────────────
const FloatingPanel = ({
    children,
    className = '',
    delay = 0,
    glowColor = 'cyan',
}: {
    children: React.ReactNode;
    className?: string;
    delay?: number;
    glowColor?: string;
}) => {
    const glowMap: Record<string, string> = {
        cyan: 'hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]',
        emerald: 'hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]',
        rose: 'hover:shadow-[0_0_30px_rgba(244,63,94,0.15)]',
        purple: 'hover:shadow-[0_0_30px_rgba(168,85,247,0.15)]',
    };

    return (
        <motion.div
            className={`
        relative bg-white/[0.04] backdrop-blur-xl border border-white/[0.08]
        rounded-2xl overflow-hidden transition-shadow duration-500
        ${glowMap[glowColor] || glowMap.cyan}
        ${className}
      `}
            animate={{ y: [0, -6, 0] }}
            transition={{
                duration: 5 + delay,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: delay * 0.7,
            }}
        >
            {children}
        </motion.div>
    );
};

// ─── Custom Chart Tooltip ───────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-900/95 backdrop-blur-xl border border-cyan-500/30 rounded-xl px-4 py-3 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                <p className="text-cyan-400 text-xs font-medium mb-1">{label}</p>
                <p className="text-white text-lg font-bold">₹{payload[0].value.toLocaleString()}</p>
            </div>
        );
    }
    return null;
};

// ─── Verdict Gauge (SVG) ────────────────────────────────────────────
const VerdictGauge = ({ verdict }: { verdict: string }) => {
    const config: Record<string, { color: string; glow: string; angle: number; bgRing: string }> = {
        'STRONG BUY': { color: '#34d399', glow: 'rgba(52,211,153,0.4)', angle: 75, bgRing: 'rgba(52,211,153,0.1)' },
        'HOLD': { color: '#facc15', glow: 'rgba(250,204,21,0.4)', angle: 50, bgRing: 'rgba(250,204,21,0.1)' },
        'HIGH RISK': { color: '#fb7185', glow: 'rgba(251,113,133,0.4)', angle: 20, bgRing: 'rgba(251,113,133,0.1)' },
    };
    const c = config[verdict] || config['HOLD'];
    const radius = 80;
    const circumference = Math.PI * radius;
    const dashOffset = circumference - (c.angle / 100) * circumference;

    return (
        <div className="relative flex items-center justify-center">
            {/* Outer glow rings */}
            <motion.div
                className="absolute rounded-full"
                style={{
                    width: 220, height: 220,
                    background: `radial-gradient(circle, ${c.glow} 0%, transparent 70%)`,
                }}
                animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
            <svg width="200" height="120" viewBox="0 0 200 120" className="relative z-10">
                {/* Background arc */}
                <path
                    d="M 20 100 A 80 80 0 0 1 180 100"
                    fill="none"
                    stroke={c.bgRing}
                    strokeWidth="8"
                    strokeLinecap="round"
                />
                {/* Foreground arc */}
                <motion.path
                    d="M 20 100 A 80 80 0 0 1 180 100"
                    fill="none"
                    stroke={c.color}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: dashOffset }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                    style={{ filter: `drop-shadow(0 0 8px ${c.glow})` }}
                />
            </svg>
            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pt-4">
                <motion.span
                    className="text-2xl font-black tracking-wider"
                    style={{ color: c.color, textShadow: `0 0 20px ${c.glow}` }}
                    animate={{ opacity: [0.85, 1, 0.85] }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    {verdict}
                </motion.span>
                <span className="text-[10px] text-slate-500 mt-1 tracking-widest uppercase">Flux Consensus</span>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════
export function AntiGravityDashboard() {
    const [chartData] = useState(generateChartData);
    const [currentPrice, setCurrentPrice] = useState(2458.75);
    const [previousPrice, setPreviousPrice] = useState(2458.75);
    const [tickDirection, setTickDirection] = useState<'up' | 'down' | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [tickerSymbol, setTickerSymbol] = useState('RELIANCE.NS');

    // ── Simulated WebSocket ──
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentPrice((prev) => {
                const change = prev * (Math.random() * 0.01 - 0.005);
                const newPrice = Math.round((prev + change) * 100) / 100;
                setPreviousPrice(prev);
                setTickDirection(newPrice >= prev ? 'up' : 'down');
                return newPrice;
            });
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    // Reset tick flash after animation
    useEffect(() => {
        if (tickDirection) {
            const t = setTimeout(() => setTickDirection(null), 600);
            return () => clearTimeout(t);
        }
    }, [tickDirection, currentPrice]);

    const priceChange = currentPrice - previousPrice;
    const priceChangePercent = ((priceChange / previousPrice) * 100).toFixed(2);

    const handleSearch = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            setTickerSymbol(searchQuery.trim().toUpperCase());
            setSearchQuery('');
        }
    }, [searchQuery]);

    const verdict = useMemo(() => {
        const bullish = INDICATORS.filter(i => i.signal === 'bullish').length;
        if (bullish >= 5) return 'STRONG BUY';
        if (bullish >= 3) return 'HOLD';
        return 'HIGH RISK';
    }, []);

    // ── Tick border animation color ──
    const tickBorderColor =
        tickDirection === 'up'
            ? 'border-emerald-400 shadow-[0_0_25px_rgba(52,211,153,0.4)]'
            : tickDirection === 'down'
                ? 'border-rose-400 shadow-[0_0_25px_rgba(244,63,94,0.4)]'
                : 'border-white/[0.08]';

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 pb-12 relative overflow-hidden">
            {/* ── Ambient Background ── */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-cyan-500/[0.04] rounded-full blur-[120px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-purple-500/[0.03] rounded-full blur-[140px]" />
                <div className="absolute top-[40%] left-[50%] w-[300px] h-[300px] bg-emerald-500/[0.02] rounded-full blur-[100px]" />
            </div>

            {/* ════════════ TOP NAV BAR ════════════ */}
            <motion.nav
                className="relative z-30 mx-auto max-w-7xl px-6 pt-6 pb-4"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <div className="flex items-center justify-between bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl px-6 py-3">
                    {/* Brand */}
                    <div className="flex items-center gap-3">
                        <motion.div
                            className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                            animate={{ rotate: [0, 360] }}
                            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                        >
                            <Zap className="w-5 h-5 text-white" />
                        </motion.div>
                        <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                            Flux Finance
                        </span>
                    </div>

                    {/* Search Bar */}
                    <form onSubmit={handleSearch} className="flex-1 max-w-md mx-8">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search ticker (e.g., RELIANCE.NS)"
                                className="w-full pl-11 pr-4 py-2.5 bg-white/[0.05] border border-white/[0.08] rounded-xl
                  text-sm text-slate-200 placeholder-slate-600
                  focus:outline-none focus:border-cyan-500/50 focus:shadow-[0_0_15px_rgba(6,182,212,0.15)]
                  transition-all duration-300"
                            />
                        </div>
                    </form>

                    {/* Status Badge */}
                    <div className="flex items-center gap-2 bg-emerald-500/[0.08] border border-emerald-500/20 rounded-full px-4 py-1.5">
                        <motion.div
                            className="w-2 h-2 rounded-full bg-emerald-400"
                            animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        />
                        <span className="text-xs font-semibold text-emerald-400 tracking-wide">Flux Engine: ONLINE</span>
                    </div>
                </div>
            </motion.nav>

            {/* ── Current Ticker & Live Price ── */}
            <motion.div
                className="relative z-20 mx-auto max-w-7xl px-6 mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
            >
                <motion.div
                    className={`inline-flex items-center gap-5 bg-white/[0.04] backdrop-blur-xl border rounded-2xl px-6 py-4 transition-all duration-300 ${tickBorderColor}`}
                    animate={tickDirection ? { scale: [1, 1.02, 1] } : {}}
                    transition={{ duration: 0.3 }}
                >
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Radio className="w-3.5 h-3.5 text-cyan-400" />
                            <span className="text-xs text-slate-500 tracking-widest uppercase">Live Tracking</span>
                        </div>
                        <span className="text-xl font-bold text-cyan-400">{tickerSymbol}</span>
                    </div>
                    <div className="w-px h-10 bg-white/10" />
                    <div>
                        <div className="text-3xl font-black tabular-nums text-white">
                            ₹{currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                        <div className={`flex items-center gap-1 text-sm font-semibold ${priceChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {priceChange >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                            {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)} ({priceChangePercent}%)
                        </div>
                    </div>
                </motion.div>
            </motion.div>

            {/* ════════════ MAIN 3-COLUMN GRID ════════════ */}
            <div className="relative z-20 mx-auto max-w-7xl px-6 grid grid-cols-1 lg:grid-cols-3 gap-5">

                {/* ════ COLUMN 1 — Market Data & Risk ════ */}
                <div className="space-y-5">
                    {/* Stock Chart */}
                    <FloatingPanel delay={0} glowColor="cyan">
                        <div className="p-5">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <BarChart3 className="w-4 h-4 text-cyan-400" />
                                    <h3 className="text-sm font-semibold text-slate-300">30-Day Trend</h3>
                                </div>
                                <span className="text-[10px] text-slate-600 tracking-widest uppercase">Recharts</span>
                            </div>
                            <div className="h-52">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.35} />
                                                <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                        <XAxis dataKey="day" tick={false} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} />
                                        <YAxis
                                            domain={['auto', 'auto']}
                                            tick={{ fill: '#475569', fontSize: 10 }}
                                            axisLine={false}
                                            tickLine={false}
                                            width={50}
                                        />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Area
                                            type="monotone"
                                            dataKey="price"
                                            stroke="#06b6d4"
                                            strokeWidth={2.5}
                                            fill="url(#chartGlow)"
                                            style={{ filter: 'drop-shadow(0 0 6px rgba(6,182,212,0.5))' }}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </FloatingPanel>

                    {/* Pivot Point Risk Management */}
                    <div className="grid grid-cols-2 gap-4">
                        <FloatingPanel delay={1} glowColor="emerald">
                            <div className="p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <Target className="w-4 h-4 text-emerald-400" />
                                    <span className="text-[10px] text-slate-500 tracking-widest uppercase">Target Exit</span>
                                </div>
                                <div className="text-xl font-bold text-emerald-400" style={{ textShadow: '0 0 12px rgba(52,211,153,0.3)' }}>
                                    ₹2,520.00
                                </div>
                                <div className="text-[10px] text-emerald-400/60 mt-1">Resistance R2</div>
                                <div className="mt-3 h-1 rounded-full bg-emerald-400/10 overflow-hidden">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
                                        initial={{ width: 0 }}
                                        animate={{ width: '72%' }}
                                        transition={{ duration: 1.5, ease: 'easeOut' }}
                                    />
                                </div>
                            </div>
                        </FloatingPanel>

                        <FloatingPanel delay={1.3} glowColor="rose">
                            <div className="p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <Shield className="w-4 h-4 text-rose-400" />
                                    <span className="text-[10px] text-slate-500 tracking-widest uppercase">Stop Loss</span>
                                </div>
                                <div className="text-xl font-bold text-rose-400" style={{ textShadow: '0 0 12px rgba(244,63,94,0.3)' }}>
                                    ₹2,380.00
                                </div>
                                <div className="text-[10px] text-rose-400/60 mt-1">Support S1</div>
                                <div className="mt-3 h-1 rounded-full bg-rose-400/10 overflow-hidden">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-rose-500 to-rose-400 rounded-full"
                                        initial={{ width: 0 }}
                                        animate={{ width: '38%' }}
                                        transition={{ duration: 1.5, ease: 'easeOut' }}
                                    />
                                </div>
                            </div>
                        </FloatingPanel>
                    </div>
                </div>

                {/* ════ COLUMN 2 — Flux Consensus Engine ════ */}
                <div className="space-y-5">
                    <FloatingPanel delay={0.5} glowColor="cyan" className="flex flex-col items-center py-8 px-6">
                        <div className="flex items-center gap-2 mb-6">
                            <Gauge className="w-4 h-4 text-cyan-400" />
                            <h3 className="text-sm font-semibold text-slate-300 tracking-wide">Flux Consensus Engine</h3>
                        </div>

                        <VerdictGauge verdict={verdict} />

                        <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                            <Activity className="w-3 h-3" />
                            <span>5 of 7 indicators bullish</span>
                        </div>
                    </FloatingPanel>

                    {/* Indicator List */}
                    <FloatingPanel delay={0.8} glowColor="purple">
                        <div className="p-5">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Brain className="w-4 h-4 text-purple-400" />
                                    <h3 className="text-sm font-semibold text-slate-300">Technical Indicators</h3>
                                </div>
                                <span className="text-[10px] text-slate-600">7 signals</span>
                            </div>
                            <div className="space-y-2.5">
                                {INDICATORS.map((ind, i) => (
                                    <motion.div
                                        key={ind.name}
                                        className="flex items-center justify-between bg-white/[0.03] rounded-xl px-4 py-2.5 border border-white/[0.05]"
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.1 * i }}
                                    >
                                        <div className="flex items-center gap-3">
                                            {/* Pulsing status dot */}
                                            <motion.div
                                                className={`w-2.5 h-2.5 rounded-full ${ind.signal === 'bullish' ? 'bg-emerald-400' : 'bg-rose-400'}`}
                                                animate={{
                                                    scale: [1, 1.5, 1],
                                                    opacity: [1, 0.5, 1],
                                                    boxShadow: ind.signal === 'bullish'
                                                        ? ['0 0 0px rgba(52,211,153,0.5)', '0 0 8px rgba(52,211,153,0.8)', '0 0 0px rgba(52,211,153,0.5)']
                                                        : ['0 0 0px rgba(244,63,94,0.5)', '0 0 8px rgba(244,63,94,0.8)', '0 0 0px rgba(244,63,94,0.5)'],
                                                }}
                                                transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                                            />
                                            <div>
                                                <span className="text-xs font-medium text-slate-300">{ind.name}</span>
                                                <p className="text-[10px] text-slate-600">{ind.detail}</p>
                                            </div>
                                        </div>
                                        <span className="text-xs text-slate-400 font-mono">{ind.value}</span>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </FloatingPanel>
                </div>

                {/* ════ COLUMN 3 — AI FinBERT News Feed ════ */}
                <div className="space-y-5">
                    <FloatingPanel delay={0.3} glowColor="cyan">
                        <div className="p-5">
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-2">
                                    <Newspaper className="w-4 h-4 text-cyan-400" />
                                    <h3 className="text-sm font-semibold text-slate-300">AI FinBERT News</h3>
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] text-cyan-400/70">
                                    <Wifi className="w-3 h-3" />
                                    <span>Live Feed</span>
                                </div>
                            </div>

                            <div className="space-y-3 max-h-[540px] overflow-y-auto pr-1 custom-scrollbar">
                                {MOCK_NEWS.map((news, i) => (
                                    <motion.div
                                        key={news.id}
                                        className="group bg-white/[0.03] border border-white/[0.05] rounded-xl p-4
                      hover:bg-white/[0.06] hover:border-white/[0.1] transition-all duration-300 cursor-pointer"
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.08 * i }}
                                    >
                                        <div className="flex items-start justify-between gap-3 mb-2">
                                            <h4 className="text-xs font-medium text-slate-300 leading-relaxed line-clamp-2 group-hover:text-white transition-colors">
                                                {news.headline}
                                            </h4>
                                            <ChevronRight className="w-3.5 h-3.5 text-slate-700 group-hover:text-cyan-400 transition-colors shrink-0 mt-0.5" />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-[10px] text-slate-600">
                                                <span>{news.source}</span>
                                                <span>·</span>
                                                <span>{news.time}</span>
                                            </div>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getSentimentColor(news.sentiment)}`}>
                                                {news.sentiment > 0 ? '+' : ''}{news.sentiment.toFixed(1)} · {getSentimentLabel(news.sentiment)}
                                            </span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </FloatingPanel>
                </div>

            </div>

            {/* ── Custom scrollbar styles ── */}
            <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.08);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.15);
        }
      `}</style>
        </div>
    );
}
