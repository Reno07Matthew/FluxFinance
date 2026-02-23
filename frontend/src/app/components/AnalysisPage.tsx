import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    AreaChart, Area, ComposedChart, Line,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
    PieChart, Pie, Cell
} from 'recharts';
import {
    Brain, TrendingUp, TrendingDown, Activity, BarChart3,
    ShieldCheck, ShieldAlert, Target, ArrowUpRight, ArrowDownRight,
    Newspaper, ChevronDown, ChevronUp, Zap, CheckCircle2, XCircle
} from 'lucide-react';
import { useMarket } from '@/context/MarketContext';
import { useLivePrice } from '@/hooks/useLivePrice';

// ─── helpers ────────────────────────────────────────────────────────────────

const currency = (c?: string) => c === 'INR' ? '₹' : '$';

function GaugeMeter({ value, max = 100, label, color }: { value: number; max?: number; label: string; color: string }) {
    const pct = Math.min(100, Math.max(0, (value / max) * 100));
    const dash = 283; // circumference of r=45 circle
    const fill = dash - (pct / 100) * dash;
    return (
        <div className="flex flex-col items-center gap-1">
            <svg viewBox="0 0 100 60" className="w-32 overflow-visible">
                {/* grey track (half circle) */}
                <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#1e293b" strokeWidth="8" strokeLinecap="round" />
                {/* colored fill */}
                <path
                    d="M 10 50 A 40 40 0 0 1 90 50" fill="none"
                    stroke={color} strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={`${(pct / 100) * 126} 126`}
                    style={{ transition: 'stroke-dasharray 0.8s ease' }}
                />
                <text x="50" y="52" textAnchor="middle" className="text-xs" fill="#f1f5f9" fontSize="14" fontWeight="bold">
                    {value.toFixed(1)}
                </text>
            </svg>
            <span className="text-[11px] text-slate-500 text-center leading-tight">{label}</span>
        </div>
    );
}

function IndicatorRow({ icon, label, value, signal, info }: {
    icon: React.ReactNode; label: string; value: string; signal: 'bull' | 'bear' | 'neutral'; info: string;
}) {
    const colorMap = { bull: 'text-green-400', bear: 'text-red-400', neutral: 'text-amber-400' };
    const bgMap = { bull: 'bg-green-500/10 border-green-500/20', bear: 'bg-red-500/10 border-red-500/20', neutral: 'bg-amber-500/10 border-amber-500/20' };
    return (
        <div className={`flex items-center justify-between rounded-lg border px-4 py-3 ${bgMap[signal]}`}>
            <div className="flex items-center gap-3">
                <div className="text-slate-400">{icon}</div>
                <div>
                    <div className="text-sm font-medium text-slate-200">{label}</div>
                    <div className="text-[11px] text-slate-500">{info}</div>
                </div>
            </div>
            <span className={`font-mono font-bold text-sm ${colorMap[signal]}`}>{value}</span>
        </div>
    );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export const AnalysisPage = () => {
    const { data, symbol, assetType } = useMarket();
    const live = useLivePrice(symbol, assetType);

    const [newsExpanded, setNewsExpanded] = useState(false);

    if (!data) {
        return (
            <div className="flex items-center justify-center h-64 text-slate-500">
                Search for a stock or crypto above to see the full analysis.
            </div>
        );
    }

    const sym = data.symbol;
    const cur = currency(data.currency);
    const sentiment = data.sentiment ?? { score: 0, label: 'Neutral' };
    const tech = data.technical ?? { rsi: 50, signal: 'Neutral' };
    const verdict = data.verdict;
    const rm = verdict?.risk_management;
    const analysis = verdict?.analysis ?? { strengths: [], warnings: [] };
    const history = data.history ?? [];

    const livePrice = live?.price ?? data.price;
    const liveChange = live?.changePct ?? 0;
    const rsi = tech.rsi ?? 50;
    const fluxScore = verdict?.flux_score ?? 50;
    const verdictText = verdict?.verdict ?? 'HOLD / NEUTRAL';

    // Chart data
    const chartData = history.map((price: number, i: number) => ({
        day: i + 1,
        price: parseFloat(price.toFixed(2)),
    }));
    const minP = history.length ? Math.min(...history) * 0.98 : 0;
    const maxP = history.length ? Math.max(...history) * 1.02 : 100;

    // Verdict styling
    const verdictStyle =
        verdictText === 'STRONG BUY' ? { bg: 'from-green-900/60 to-green-950/80 border-green-500/40', text: 'text-green-400', icon: <ShieldCheck className="h-8 w-8 text-green-400" /> } :
            verdictText === 'HIGH RISK (AVOID)' ? { bg: 'from-red-900/60 to-red-950/80 border-red-500/40', text: 'text-red-400', icon: <ShieldAlert className="h-8 w-8 text-red-400" /> } :
                { bg: 'from-amber-900/40 to-slate-950/80 border-amber-500/30', text: 'text-amber-400', icon: <Activity className="h-8 w-8 text-amber-400" /> };

    // 7 indicator signals
    const sma200 = tech.sma_200;
    const ema50 = tech.ema_50;
    const vwap = tech.vwap;
    const stDir = tech.supertrend_dir;
    const sentScore = sentiment.score;

    const rsiSignal: 'bull' | 'bear' | 'neutral' = rsi < 30 ? 'bull' : rsi > 70 ? 'bear' : 'neutral';
    const smaSignal: 'bull' | 'bear' | 'neutral' = sma200 ? (livePrice > sma200 ? 'bull' : 'bear') : 'neutral';
    const emaSignal: 'bull' | 'bear' | 'neutral' = ema50 ? (livePrice > ema50 ? 'bull' : 'bear') : 'neutral';
    const vwapSignal: 'bull' | 'bear' | 'neutral' = vwap ? (livePrice < vwap ? 'bull' : 'bear') : 'neutral';
    const stSignal: 'bull' | 'bear' | 'neutral' = stDir === 1 ? 'bull' : stDir === -1 ? 'bear' : 'neutral';
    const aiSignal: 'bull' | 'bear' | 'neutral' = sentScore > 0.15 ? 'bull' : sentScore < -0.15 ? 'bear' : 'neutral';
    const pivotSignal: 'bull' | 'bear' | 'neutral' = rm ? (livePrice > rm.pivot ? 'bull' : 'bear') : 'neutral';

    const sentimentPct = Math.round(((sentScore + 1) / 2) * 100);
    const sentimentData = [
        { name: 'Positive', value: sentimentPct, color: '#10b981' },
        { name: 'Negative', value: 100 - sentimentPct, color: '#1e293b' },
    ];

    return (
        <div className="space-y-6">

            {/* ── HERO: Live Price + Final Verdict ── */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-2xl border bg-gradient-to-br p-6 ${verdictStyle.bg}`}
            >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Price block */}
                    <div className="flex items-start gap-4">
                        <div>
                            <div className="text-sm text-slate-400 uppercase tracking-widest mb-1">{sym}</div>
                            <div className="flex items-end gap-3">
                                <AnimatePresence mode="popLayout">
                                    <motion.div
                                        key={livePrice}
                                        initial={{ y: 6, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ duration: 0.2 }}
                                        className="text-4xl font-bold font-mono tabular-nums text-slate-100"
                                    >
                                        {cur}{livePrice.toLocaleString()}
                                    </motion.div>
                                </AnimatePresence>
                                <span className={`text-sm font-medium mb-1 flex items-center gap-0.5 ${liveChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {liveChange >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                                    {Math.abs(liveChange).toFixed(2)}%
                                </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                {live?.isConnected && (
                                    <span className="flex items-center gap-1 text-[10px] text-green-500">
                                        <span className="relative flex h-1.5 w-1.5">
                                            <span className="animate-ping absolute rounded-full bg-green-400 opacity-75 h-full w-full" />
                                            <span className="relative rounded-full bg-green-500 h-1.5 w-1.5" />
                                        </span>
                                        LIVE
                                    </span>
                                )}
                                <span className="text-xs text-slate-500">Data via yfinance · 15-min delay (stocks)</span>
                            </div>
                        </div>
                    </div>

                    {/* Final Verdict */}
                    <div className="flex items-center gap-4 bg-black/20 rounded-xl px-6 py-4 border border-white/5">
                        {verdictStyle.icon}
                        <div>
                            <div className="text-xs text-slate-500 uppercase tracking-wider mb-0.5">Flux Verdict</div>
                            <div className={`text-2xl font-black ${verdictStyle.text}`}>{verdictText}</div>
                            <div className="text-xs text-slate-400 mt-0.5">{verdict?.description}</div>
                        </div>
                    </div>
                </div>

                {/* Flux Health Score bar */}
                <div className="mt-5">
                    <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                        <span>Flux Health Score</span>
                        <span className={`font-bold ${verdictStyle.text}`}>{fluxScore}/100</span>
                    </div>
                    <div className="h-2 w-full bg-black/30 rounded-full overflow-hidden">
                        <motion.div
                            className={`h-2 rounded-full ${fluxScore >= 72 ? 'bg-green-500' : fluxScore <= 35 ? 'bg-red-500' : 'bg-amber-500'
                                }`}
                            initial={{ width: 0 }}
                            animate={{ width: `${fluxScore}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                        />
                    </div>
                </div>
            </motion.div>

            {/* ── 3-COLUMN GRID: Charts + Indicators + Sentiment/Risk ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* LEFT (span 2): Price Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="lg:col-span-2 space-y-4"
                >
                    {/* Price chart */}
                    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
                        <h3 className="text-base font-semibold text-slate-100 mb-1">{sym} — Price History (30d)</h3>
                        <p className="text-xs text-slate-500 mb-4">Area chart with 1-month closing prices</p>
                        <div className="h-[240px]">
                            {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={chartData}>
                                        <defs>
                                            <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.35} />
                                                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                        <XAxis dataKey="day" stroke="#334155" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#334155" tick={{ fontSize: 11 }} tickLine={false} axisLine={false}
                                            domain={[minP, maxP]} tickFormatter={v => `${cur}${v.toLocaleString()}`} width={70} />
                                        <Tooltip
                                            contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8 }}
                                            labelStyle={{ color: '#94a3b8' }}
                                            itemStyle={{ color: '#06b6d4' }}
                                            formatter={(v: any) => [`${cur}${v}`, 'Price']}
                                        />
                                        <Area type="monotone" dataKey="price" stroke="#06b6d4" strokeWidth={2}
                                            fillOpacity={1} fill="url(#priceGrad)" dot={false} />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-slate-600">No price history</div>
                            )}
                        </div>
                    </div>

                    {/* 7 Indicator Rows */}
                    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Zap className="h-4 w-4 text-cyan-400" />
                            <h3 className="text-base font-semibold text-slate-100">7 Technical Indicators</h3>
                            <span className="ml-auto text-[10px] text-slate-600 uppercase tracking-wider">4 Defense Layers</span>
                        </div>
                        <div className="space-y-2">
                            {/* Layer 1: Psychology */}
                            <div className="text-[10px] text-slate-600 uppercase tracking-widest px-1 pt-1">Layer 1 · Psychology</div>
                            <IndicatorRow icon={<Activity className="h-4 w-4" />}
                                label="RSI (14)" value={`${rsi.toFixed(1)}`}
                                signal={rsiSignal}
                                info={rsi > 70 ? 'Overbought — momentum may reverse' : rsi < 30 ? 'Oversold — bounce likely' : 'Neutral momentum zone'} />

                            {/* Layer 2: Macro Trend */}
                            <div className="text-[10px] text-slate-600 uppercase tracking-widest px-1 pt-2">Layer 2 · Macro Trend</div>
                            <IndicatorRow icon={<TrendingUp className="h-4 w-4" />}
                                label="SMA (200)" value={sma200 ? `${cur}${sma200.toLocaleString()}` : 'N/A'}
                                signal={smaSignal}
                                info={sma200 ? (livePrice > sma200 ? 'Price above 200 SMA — bullish macro' : 'Price below 200 SMA — bearish macro') : 'Insufficient history'} />
                            <IndicatorRow icon={<BarChart3 className="h-4 w-4" />}
                                label="EMA (50)" value={ema50 ? `${cur}${ema50.toLocaleString()}` : 'N/A'}
                                signal={emaSignal}
                                info={ema50 ? (livePrice > ema50 ? 'Above EMA-50 — short-term uptrend' : 'Below EMA-50 — short-term downtrend') : 'N/A'} />

                            {/* Layer 3: Institutional */}
                            <div className="text-[10px] text-slate-600 uppercase tracking-widest px-1 pt-2">Layer 3 · Institutional Truth</div>
                            <IndicatorRow icon={<Target className="h-4 w-4" />}
                                label="VWAP" value={vwap ? `${cur}${vwap.toLocaleString()}` : 'N/A'}
                                signal={vwapSignal}
                                info={vwap ? (livePrice < vwap ? 'Below VWAP — trading at a discount' : 'Above VWAP — paying institutional premium') : 'N/A'} />
                            <IndicatorRow icon={<Activity className="h-4 w-4" />}
                                label="SuperTrend (7, 3)" value={stDir === 1 ? '↑ BULLISH' : stDir === -1 ? '↓ BEARISH' : 'N/A'}
                                signal={stSignal}
                                info={stDir === 1 ? 'Dynamic trend boundary shows uptrend' : stDir === -1 ? 'Dynamic trend boundary shows downtrend' : 'N/A'} />

                            {/* Layer 4: Risk Management */}
                            <div className="text-[10px] text-slate-600 uppercase tracking-widest px-1 pt-2">Layer 4 · Risk Management</div>
                            <IndicatorRow icon={<ArrowUpRight className="h-4 w-4" />}
                                label="Pivot Points (R1/S1)" value={rm ? `${cur}${rm.target_exit_R1} / ${cur}${rm.stop_loss_S1}` : 'N/A'}
                                signal={pivotSignal}
                                info={rm ? `R1 target: ${cur}${rm.target_exit_R1} · S1 stop: ${cur}${rm.stop_loss_S1} · Pivot: ${cur}${rm.pivot}` : 'N/A'} />
                            <IndicatorRow icon={<Brain className="h-4 w-4" />}
                                label="FinBERT AI Sentiment" value={`${sentScore > 0 ? '+' : ''}${sentScore.toFixed(2)} (${sentiment.label})`}
                                signal={aiSignal}
                                info={`Analyzed ${data.headlines?.length ?? 0} news headlines via FinBERT NLP model`} />
                        </div>
                    </div>
                </motion.div>

                {/* RIGHT: Sentiment Gauge + Strengths/Warnings + Risk Management */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-4"
                >
                    {/* AI Sentiment Gauge */}
                    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
                        <div className="flex items-center gap-2 mb-3">
                            <Brain className="h-4 w-4 text-purple-400" />
                            <h3 className="text-sm font-semibold text-slate-100">AI Sentiment</h3>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="relative h-[120px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={sentimentData} cx="50%" cy="100%"
                                            startAngle={180} endAngle={0}
                                            innerRadius={50} outerRadius={70}
                                            paddingAngle={0} dataKey="value" stroke="none">
                                            {sentimentData.map((entry, i) => (
                                                <Cell key={i} fill={entry.color} />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center">
                                    <div className={`text-2xl font-bold ${aiSignal === 'bull' ? 'text-green-400' : aiSignal === 'bear' ? 'text-red-400' : 'text-amber-400'}`}>
                                        {sentScore > 0 ? '+' : ''}{sentScore.toFixed(2)}
                                    </div>
                                    <div className="text-xs text-slate-500">{sentiment.label}</div>
                                </div>
                            </div>
                        </div>
                        <div className="mt-2 text-[11px] text-slate-600 text-center">
                            FinBERT · {data.headlines?.length ?? 0} articles analyzed
                        </div>
                    </div>

                    {/* Risk Management */}
                    {rm && (
                        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 space-y-3">
                            <div className="flex items-center gap-2 mb-1">
                                <Target className="h-4 w-4 text-cyan-400" />
                                <h3 className="text-sm font-semibold text-slate-100">Risk Management</h3>
                            </div>
                            <div className="bg-slate-800/50 rounded-lg p-3 flex justify-between items-center">
                                <span className="text-xs text-slate-500">Pivot</span>
                                <span className="font-mono text-sm font-bold text-slate-200">{cur}{rm.pivot.toLocaleString()}</span>
                            </div>
                            <div className="bg-green-900/20 border border-green-500/20 rounded-lg p-3 flex justify-between items-center">
                                <span className="text-xs text-green-600 font-bold">R1 Target</span>
                                <span className="font-mono text-sm font-bold text-green-400">{cur}{rm.target_exit_R1.toLocaleString()}</span>
                            </div>
                            <div className="bg-red-900/20 border border-red-500/20 rounded-lg p-3 flex justify-between items-center">
                                <span className="text-xs text-red-600 font-bold">S1 Stop Loss</span>
                                <span className="font-mono text-sm font-bold text-red-400">{cur}{rm.stop_loss_S1.toLocaleString()}</span>
                            </div>
                        </div>
                    )}

                    {/* Strengths & Warnings */}
                    {(analysis.strengths.length > 0 || analysis.warnings.length > 0) && (
                        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 space-y-3">
                            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                                <Zap className="h-4 w-4 text-cyan-400" /> Consensus Signals
                            </h3>
                            {analysis.strengths.map((s: string, i: number) => (
                                <div key={i} className="flex gap-2 text-xs text-slate-300 bg-green-500/5 border border-green-500/15 rounded-lg px-3 py-2">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" />
                                    <span>{s.replace(/^[^a-zA-Z]+/, '')}</span>
                                </div>
                            ))}
                            {analysis.warnings.map((w: string, i: number) => (
                                <div key={i} className="flex gap-2 text-xs text-slate-300 bg-red-500/5 border border-red-500/15 rounded-lg px-3 py-2">
                                    <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
                                    <span>{w.replace(/^[^a-zA-Z]+/, '')}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>
            </div>

            {/* ── NEWS FEED ── */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="rounded-xl border border-slate-800 bg-slate-900/50 p-6"
            >
                <button
                    onClick={() => setNewsExpanded(e => !e)}
                    className="w-full flex items-center justify-between"
                >
                    <div className="flex items-center gap-2">
                        <Newspaper className="h-4 w-4 text-cyan-400" />
                        <h3 className="text-base font-semibold text-slate-100">
                            Live News Feed
                            <span className="ml-2 text-xs font-normal text-slate-500">({data.headlines?.length ?? 0} articles)</span>
                        </h3>
                    </div>
                    {newsExpanded ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
                </button>

                <AnimatePresence>
                    {newsExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className="overflow-hidden"
                        >
                            <div className="mt-4 space-y-3">
                                {(data.headlines ?? []).map((h: { title: string; url: string }, i: number) => {
                                    const t = h.title.toLowerCase();
                                    const bull = ['surge', 'jump', 'rise', 'gain', 'high', 'growth', 'rally', 'buy'].some(w => t.includes(w));
                                    const bear = ['fall', 'drop', 'crash', 'low', 'loss', 'slide', 'slump', 'fear'].some(w => t.includes(w));
                                    const sig = bull ? 'Bullish' : bear ? 'Bearish' : 'Neutral';
                                    const sigColor = bull ? 'text-green-400' : bear ? 'text-red-400' : 'text-amber-400';
                                    return (
                                        <a
                                            key={i}
                                            href={h.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="group flex items-start justify-between gap-4 border-b border-slate-800 pb-3 last:border-0 hover:no-underline"
                                        >
                                            <p className="text-sm text-slate-300 leading-snug group-hover:text-cyan-300 transition-colors">
                                                {h.title}
                                            </p>
                                            <span className={`flex items-center gap-1 text-[11px] font-bold shrink-0 ${sigColor}`}>
                                                {sig} <span className="text-slate-600 group-hover:text-slate-400">↗</span>
                                            </span>
                                        </a>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {!newsExpanded && (
                    <p className="text-xs text-slate-600 mt-2">Click to expand news feed</p>
                )}
            </motion.div>
        </div>
    );
};
