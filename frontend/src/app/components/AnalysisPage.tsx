import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    ComposedChart, Area, Bar, CartesianGrid,
    XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
    Brain, TrendingUp,
    Target, ArrowUpRight, ArrowDownRight,
    Newspaper, ChevronDown, ChevronUp, Zap, CheckCircle2,
    HelpCircle, AlertTriangle
} from 'lucide-react';
import { useMarket } from '@/context/MarketContext';
import { useLivePrice } from '@/hooks/useLivePrice';
import { useTheme } from '@/context/ThemeContext';

// ─── Helpers ────────────────────────────────────────────────────────────────

const cur = (c?: string) => c === 'INR' ? '₹' : '$';

function Tip({ text }: { text: string }) {
    const [show, setShow] = useState(false);
    return (
        <span className="relative inline-flex">
            <button
                onMouseEnter={() => setShow(true)}
                onMouseLeave={() => setShow(false)}
                className="text-text-disabled hover:text-text-tertiary transition-colors"
                aria-label={text}
            >
                <HelpCircle className="h-3.5 w-3.5" strokeWidth={1.5} />
            </button>
            <AnimatePresence>
                {show && (
                    <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 p-2.5 rounded-lg
                                   bg-bg-card text-text-secondary text-xs leading-relaxed shadow-xl z-50
                                   border border-border"
                    >
                        {text}
                    </motion.div>
                )}
            </AnimatePresence>
        </span>
    );
}

const childVariants = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] } },
};

// ─── Analysis Page ──────────────────────────────────────────────────────────

export const AnalysisPage = () => {
    const { data, symbol, assetType } = useMarket();
    const live = useLivePrice(symbol, assetType);
    const { theme } = useTheme();
    const [newsOpen, setNewsOpen] = useState(false);
    const isDark = theme === 'dark';

    if (!data) return (
        <div className="flex items-center justify-center h-64 text-sm text-text-tertiary">
            Search for a stock or crypto to see the full analysis.
        </div>
    );

    const c = cur(data.currency);
    const sentiment = data.sentiment ?? { score: 0, label: 'Neutral' };
    const tech = data.technical ?? { rsi: 50, signal: 'Neutral' };
    const verdict = data.verdict;
    const rm = verdict?.risk_management;
    const analysis = verdict?.analysis ?? { strengths: [], warnings: [] };
    const history = data.history ?? [];

    const price = live?.price ?? data.price;
    const changePct = live?.changePct ?? 0;
    const rsi = tech.rsi ?? 50;
    const fluxScore = verdict?.flux_score ?? 50;
    const verdictText = verdict?.verdict ?? 'HOLD / NEUTRAL';

    const chartData = history.map((p: number, i: number) => ({ 
        d: i + 1, 
        p: parseFloat(p.toFixed(2)),
        v: Math.floor(Math.random() * 5000) + 1000 // mock volume
    }));
    const minP = history.length ? Math.min(...history) * 0.998 : 0;
    const maxP = history.length ? Math.max(...history) * 1.002 : 100;

    const sma200 = tech.sma_200; const ema50 = tech.ema_50;
    const vwap = tech.vwap; const stDir = tech.supertrend_dir;
    const sentScore = sentiment.score;

    type Sig = 'bull' | 'bear' | 'neutral';
    const sig = (cond: boolean | undefined, alt: boolean | undefined): Sig =>
        cond === undefined ? 'neutral' : cond ? 'bull' : 'bear';

    const indicators = [
        { n: 'RSI (14)', v: rsi.toFixed(1), s: (rsi < 30 ? 'bull' : rsi > 70 ? 'bear' : 'neutral') as Sig, tip: 'Momentum oscillator. <30 oversold (bullish), >70 overbought (bearish).' },
        { n: 'SMA (200)', v: sma200 ? `${c}${sma200.toLocaleString()}` : '—', s: sig(sma200 ? price > sma200 : undefined, undefined), tip: 'Long-term trend avg. Above = bullish macro.' },
        { n: 'EMA (50)', v: ema50 ? `${c}${ema50.toLocaleString()}` : '—', s: sig(ema50 ? price > ema50 : undefined, undefined), tip: 'Medium-term exponential trend.' },
        { n: 'VWAP', v: vwap ? `${c}${vwap.toLocaleString()}` : '—', s: sig(vwap ? price < vwap : undefined, undefined), tip: 'Volume-weighted avg price. Below = discount zone.' },
        { n: 'SuperTrend', v: stDir === 1 ? '↑ UP' : stDir === -1 ? '↓ DOWN' : '—', s: (stDir === 1 ? 'bull' : stDir === -1 ? 'bear' : 'neutral') as Sig, tip: 'Dynamic trend boundary on ATR (7,3).' },
        { n: 'FinBERT AI', v: `${sentScore > 0 ? '+' : ''}${sentScore.toFixed(2)}`, s: (sentScore > 0.15 ? 'bull' : sentScore < -0.15 ? 'bear' : 'neutral') as Sig, tip: 'NLP sentiment score from recent news headlines.' },
        { n: 'Pivot', v: rm ? `${c}${rm.pivot.toLocaleString()}` : '—', s: sig(rm ? price > rm.pivot : undefined, undefined), tip: 'Floor pivot. Above = bullish short-term bias.' },
    ];

    const sentPct = Math.round(((sentScore + 1) / 2) * 100);
    const vBadge = verdictText.toUpperCase();
    const isGood = vBadge.includes('STRONG BUY');
    const isBad = vBadge.includes('HIGH RISK') || vBadge.includes('AVOID');
    const vClass = isGood ? 'text-success bg-success/10 border-success/20'
        : isBad ? 'text-danger bg-danger/10 border-danger/20'
            : 'text-text-tertiary bg-bg-elevated border-border';

    const sigBadge = (s: Sig) => {
        const m = {
            bull: 'text-success bg-success/10',
            bear: 'text-danger bg-danger/10',
            neutral: 'text-text-disabled bg-bg-elevated',
        };
        return <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${m[s]}`}>{s === 'bull' ? '↑ BULL' : s === 'bear' ? '↓ BEAR' : '— NEUTRAL'}</span>;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] }}
            className="space-y-4 max-w-none"
        >
            {/* ── Header ── */}
            <motion.div variants={childVariants} className="rounded-xl border border-border bg-bg-card p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-text-tertiary uppercase tracking-widest">{data.symbol}</span>
                            {live?.isConnected && (
                                <span className="flex items-center gap-1 text-[10px] text-success" aria-label="Live price connected">
                                    <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
                                        <span className="animate-ping absolute rounded-full bg-success opacity-75 h-full w-full" />
                                        <span className="relative rounded-full bg-success h-1.5 w-1.5" />
                                    </span>
                                    LIVE
                                </span>
                            )}
                        </div>
                        <div className="flex items-end gap-3 mt-1">
                            <span className="text-3xl font-bold font-mono-num text-text-primary" aria-live="polite">
                                {c}{price.toLocaleString()}
                            </span>
                            <span className={`inline-flex items-center gap-0.5 text-sm font-semibold font-mono-num mb-1
                                ${changePct >= 0 ? 'text-success' : 'text-danger'}`}>
                                {changePct >= 0 ? <ArrowUpRight className="h-4 w-4" strokeWidth={2} aria-hidden="true" /> : <ArrowDownRight className="h-4 w-4" strokeWidth={2} aria-hidden="true" />}
                                {changePct >= 0 ? '+' : ''}{Math.abs(changePct).toFixed(2)}%
                                <span className="sr-only">{changePct >= 0 ? 'increase' : 'decrease'}</span>
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-[10px] text-text-disabled uppercase tracking-wider font-medium mb-1">Flux Verdict</p>
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${vClass}`}>{vBadge}</span>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-text-disabled uppercase tracking-wider font-medium mb-1">Health Score</p>
                            <span className={`text-sm font-bold font-mono-num
                                ${fluxScore >= 72 ? 'text-success' : fluxScore <= 35 ? 'text-danger' : 'text-warning'}`}>
                                {fluxScore}/100
                            </span>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* ── 2/3 + 1/3 Grid ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-auto lg:h-[calc(100vh-220px)] min-h-[600px]">

                {/* LEFT */}
                <div className="lg:col-span-2 flex flex-col gap-4 h-full">
                    {/* Chart */}
                    <div className="rounded-xl border border-border bg-bg-card p-5 flex-1 flex flex-col min-h-[300px]">
                        <div className="flex items-center justify-between mb-3 shrink-0">
                            <h2 className="text-sm font-sans font-semibold text-text-primary">{data.symbol} — 30d Price</h2>
                            <span className="text-[10px] text-text-disabled uppercase tracking-wider">30D</span>
                        </div>
                        <div className="flex-1 min-h-[200px]" role="img" aria-label={`${data.symbol} 30-day price chart`}>
                            {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="aGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2} />
                                                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.05} vertical={false} />
                                        <XAxis dataKey="d" hide />
                                        <YAxis yAxisId="price" domain={[minP, maxP]} hide />
                                        <YAxis yAxisId="volume" domain={[0, 'dataMax * 5']} hide />
                                        <Tooltip
                                            contentStyle={{
                                                background: isDark ? '#1a1f2e' : '#fff',
                                                border: `1px solid ${isDark ? '#252d3d' : '#e2e8f0'}`,
                                                borderRadius: 8, fontSize: 13, padding: '8px 12px',
                                                fontFamily: 'JetBrains Mono, monospace',
                                            }}
                                            itemStyle={{ color: isDark ? '#00d4ff' : '#0891b2' }}
                                            formatter={(v: any, name: string) => [name === 'p' ? `${c}${v}` : v, name === 'p' ? 'Price' : 'Volume']}
                                        />
                                        <Area yAxisId="price" type="monotone" dataKey="p"
                                            stroke="#3b82f6" strokeWidth={2}
                                            fill="url(#aGrad)" dot={false} />
                                        <Bar yAxisId="volume" dataKey="v" fill="#ffffff" opacity={0.1} barSize={4} />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            ) : <div className="flex items-center justify-center h-full text-sm text-text-disabled">No data</div>}
                        </div>
                    </div>

                    {/* Indicator Table */}
                    <div className="rounded-xl border border-border bg-bg-card shrink-0">
                        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
                            <h2 className="text-sm font-sans font-semibold text-text-primary flex items-center gap-2">
                                <Zap className="h-4 w-4 text-accent-muted" strokeWidth={1.5} aria-hidden="true" />
                                Technical Indicators
                            </h2>
                            <span className="text-[10px] text-text-disabled">7 Signals</span>
                        </div>
                        <table className="w-full" role="table" aria-label="Technical indicators">
                            <thead>
                                <tr className="border-b border-border/50">
                                    <th className="text-left px-5 py-2.5 text-xs font-semibold text-text-tertiary uppercase tracking-wider">Indicator</th>
                                    <th className="text-right px-5 py-2.5 text-xs font-semibold text-text-tertiary uppercase tracking-wider">Value</th>
                                    <th className="text-center px-5 py-2.5 text-xs font-semibold text-text-tertiary uppercase tracking-wider">Signal</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/30">
                                {indicators.map((ind, i) => (
                                    <tr key={i} className="hover:bg-bg-hover transition-colors">
                                        <td className="px-5 py-3 text-sm text-text-secondary">
                                            {ind.n} <Tip text={ind.tip} />
                                        </td>
                                        <td className="px-5 py-3 text-right text-sm font-mono-num font-medium text-text-primary">{ind.v}</td>
                                        <td className="px-5 py-3 text-center">{sigBadge(ind.s)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* RIGHT */}
                <div className="flex flex-col gap-4 h-full">
                    {/* AI Sentiment */}
                    <div className="rounded-xl border border-border bg-bg-card p-5 shrink-0">
                        <div className="flex items-center gap-2 mb-3">
                            <Brain className="h-4 w-4 text-accent-muted" strokeWidth={1.5} aria-hidden="true" />
                            <h2 className="text-sm font-sans font-semibold text-text-primary">AI Sentiment</h2>
                            <span className="ml-auto text-[10px] text-text-disabled">FinBERT</span>
                        </div>
                        <div className="mb-3">
                            <div className="flex justify-between text-xs mb-1.5">
                                <span className="text-danger">Fear</span>
                                <span className="text-success">Greed</span>
                            </div>
                            <div className="h-2 w-full bg-bg-elevated rounded-full overflow-hidden" role="progressbar" aria-valuenow={sentPct} aria-valuemin={0} aria-valuemax={100} aria-label={`Sentiment: ${sentPct}% greed`}>
                                <div className={`h-full rounded-full transition-all duration-700
                                    ${sentPct >= 60 ? 'bg-success' : sentPct <= 40 ? 'bg-danger' : 'bg-warning'}`}
                                    style={{ width: `${sentPct}%` }} />
                            </div>
                            <div className="flex justify-between items-center mt-2.5">
                                <span className={`text-lg font-bold font-mono-num ${sentScore > 0.15 ? 'text-success' : sentScore < -0.15 ? 'text-danger' : 'text-warning'}`}>
                                    {sentScore > 0 ? '+' : ''}{sentScore.toFixed(2)}
                                </span>
                                {sigBadge(sentScore > 0.15 ? 'bull' : sentScore < -0.15 ? 'bear' : 'neutral')}
                            </div>
                        </div>
                        <div className="border-t border-border pt-3 space-y-2">
                            <span className="text-[10px] text-text-disabled uppercase tracking-wider font-semibold">Headlines</span>
                            {(data.headlines ?? []).slice(0, 3).map((h: { title: string; url: string }, i: number) => {
                                const t = h.title.toLowerCase();
                                const bull = ['surge', 'jump', 'rise', 'gain', 'high', 'growth', 'rally', 'buy'].some(w => t.includes(w));
                                const bear = ['fall', 'drop', 'crash', 'low', 'loss', 'slide', 'slump', 'fear'].some(w => t.includes(w));
                                const dot = bull ? 'bg-success' : bear ? 'bg-danger' : 'bg-warning';
                                return (
                                    <a key={i} href={h.url} target="_blank" rel="noopener noreferrer"
                                        className="flex items-start gap-2 group">
                                        <span className={`mt-[6px] h-1.5 w-1.5 rounded-full shrink-0 ${dot}`} aria-hidden="true" />
                                        <p className="text-xs text-text-tertiary leading-relaxed line-clamp-2 group-hover:text-text-primary transition-colors">
                                            {h.title}
                                        </p>
                                    </a>
                                );
                            })}
                        </div>
                    </div>

                    {/* Risk Boundaries */}
                    {rm && (
                        <div className="rounded-xl border border-border bg-bg-card p-5 shrink-0 flex-1 flex flex-col justify-center">
                            <div className="flex items-center gap-2 mb-3">
                                <Target className="h-4 w-4 text-accent-muted" strokeWidth={1.5} aria-hidden="true" />
                                <h2 className="text-sm font-sans font-semibold text-text-primary">Risk Boundaries</h2>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between rounded-lg bg-bg-elevated/50 px-4 py-2.5">
                                    <span className="text-xs text-text-disabled uppercase font-semibold">Pivot</span>
                                    <span className="text-sm font-bold font-mono-num text-text-primary">{c}{rm.pivot.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center justify-between rounded-lg bg-success/5 border border-success/15 px-4 py-2.5">
                                    <span className="text-xs text-success uppercase font-bold flex items-center gap-1">
                                        <ArrowUpRight className="h-3 w-3" strokeWidth={2} aria-hidden="true" /> Target R1
                                    </span>
                                    <span className="text-sm font-bold font-mono-num text-success">{c}{rm.target_exit_R1.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center justify-between rounded-lg bg-danger/5 border border-danger/15 px-4 py-2.5">
                                    <span className="text-xs text-danger uppercase font-bold flex items-center gap-1">
                                        <ArrowDownRight className="h-3 w-3" strokeWidth={2} aria-hidden="true" /> Stop S1
                                    </span>
                                    <span className="text-sm font-bold font-mono-num text-danger">{c}{rm.stop_loss_S1.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Signals */}
                    {(analysis.strengths.length > 0 || analysis.warnings.length > 0) && (
                        <div className="rounded-xl border border-border bg-bg-card p-5 shrink-0">
                            <h2 className="text-sm font-sans font-semibold text-text-primary flex items-center gap-2 mb-3">
                                <Zap className="h-4 w-4 text-warning" strokeWidth={1.5} aria-hidden="true" />
                                Consensus Signals
                            </h2>
                            <div className="space-y-2">
                                {analysis.strengths.map((s: string, i: number) => (
                                    <div key={i} className="flex gap-2 text-sm text-text-secondary bg-success/5 border border-success/10 rounded-lg px-3 py-2">
                                        <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" strokeWidth={1.5} aria-hidden="true" />
                                        <span>{s.replace(/^[^a-zA-Z]+/, '')}</span>
                                    </div>
                                ))}
                                {analysis.warnings.map((w: string, i: number) => (
                                    <div key={i} className="flex gap-2 text-sm text-text-secondary bg-danger/5 border border-danger/10 rounded-lg px-3 py-2">
                                        <AlertTriangle className="h-4 w-4 text-danger shrink-0 mt-0.5" strokeWidth={1.5} aria-hidden="true" />
                                        <span>{w.replace(/^[^a-zA-Z]+/, '')}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Collapsible News ── */}
            <div className="rounded-xl border border-border bg-bg-card">
                <button
                    onClick={() => setNewsOpen(o => !o)}
                    className="w-full flex items-center justify-between px-5 py-3.5 min-h-[44px]"
                    aria-expanded={newsOpen}
                    aria-controls="news-panel"
                >
                    <span className="text-sm font-sans font-semibold text-text-primary flex items-center gap-2">
                        <Newspaper className="h-4 w-4 text-accent-muted" strokeWidth={1.5} aria-hidden="true" />
                        News Feed
                        <span className="text-text-disabled font-normal">({data.headlines?.length ?? 0})</span>
                    </span>
                    {newsOpen
                        ? <ChevronUp className="h-4 w-4 text-text-disabled" strokeWidth={1.5} aria-hidden="true" />
                        : <ChevronDown className="h-4 w-4 text-text-disabled" strokeWidth={1.5} aria-hidden="true" />}
                </button>
                <AnimatePresence>
                    {newsOpen && (
                        <motion.div
                            id="news-panel"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden border-t border-border"
                        >
                            <div className="p-5 space-y-3" role="feed" aria-label="News headlines">
                                {(data.headlines ?? []).map((h: { title: string; url: string }, i: number) => {
                                    const t = h.title.toLowerCase();
                                    const bull = ['surge', 'jump', 'rise', 'gain', 'high', 'growth', 'rally', 'buy'].some(w => t.includes(w));
                                    const bear = ['fall', 'drop', 'crash', 'low', 'loss', 'slide', 'slump', 'fear'].some(w => t.includes(w));
                                    const sigColor = bull ? 'text-success' : bear ? 'text-danger' : 'text-warning';
                                    const sigLabel = bull ? '↑ Bullish' : bear ? '↓ Bearish' : '— Neutral';
                                    return (
                                        <a key={i} href={h.url} target="_blank" rel="noopener noreferrer"
                                            className="group flex items-start justify-between gap-3 pb-3 border-b border-border/30 last:border-0 last:pb-0">
                                            <p className="text-sm text-text-tertiary leading-relaxed group-hover:text-text-primary transition-colors">{h.title}</p>
                                            <span className={`text-xs font-bold shrink-0 ${sigColor}`}>{sigLabel}</span>
                                        </a>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};
