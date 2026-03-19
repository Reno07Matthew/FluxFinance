import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { Play, TrendingUp, TrendingDown, Activity, AlertCircle, Info, Search } from 'lucide-react';
import { runBacktest, BacktestResult, searchAssets, SearchResult } from '@/services/api';

export const BacktestPage = () => {
    const [symbol, setSymbol] = useState('RELIANCE');
    const [searchQuery, setSearchQuery] = useState('RELIANCE');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [period, setPeriod] = useState('1y');
    const [capital, setCapital] = useState(100000);
    const [isRunning, setIsRunning] = useState(false);
    const [results, setResults] = useState<BacktestResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'equity' | 'log'>('equity');

    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => { 
            isMounted.current = false; 
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            setShowDropdown(false);
            return;
        }
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(async () => {
            try {
                const results = await searchAssets(searchQuery);
                if (isMounted.current) {
                    setSearchResults(results);
                    setShowDropdown(results.length > 0);
                }
            } catch (err) {
                console.error('Search failed:', err);
            }
        }, 300);
        return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current); };
    }, [searchQuery]);

    const handleRun = useCallback(async () => {
        setIsRunning(true);
        setError(null);
        
        // Use searchQuery directly as the current symbol
        const currentSymbol = searchQuery.trim().toUpperCase() || symbol;
        setSymbol(currentSymbol);
        
        try {
            const data = await runBacktest(currentSymbol, period, capital);
            if (!isMounted.current) return;
            if ('error' in data) {
                setError(data.error as string);
            } else {
                setResults(data);
            }
        } catch (e) {
            if (!isMounted.current) return;
            setError('Failed to execute backtest. Ensure backend is running.');
        } finally {
            if (isMounted.current) setIsRunning(false);
        }
    }, [symbol, period, capital]);

    const handleSelectSymbol = (s: string) => {
        setSymbol(s);
        setSearchQuery(s);
        setShowDropdown(false);
    };

    return (
        <div className="flex flex-col gap-6 pb-20 max-w-7xl mx-auto font-sans">
            {/* 1. Header & Controls */}
            <div className="flex flex-wrap items-center gap-4 bg-[#18181b]/40 p-4 rounded-lg border border-white/5 shadow-sm">
                
                <div className="flex-1 min-w-[200px] relative" ref={dropdownRef}>
                    <label htmlFor="symbol-input" className="block text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 ml-1">Asset Symbol</label>
                    <input 
                        id="symbol-input"
                        autoComplete="off"
                        className="w-full bg-[#121214] border border-white/5 text-white px-4 py-2 rounded-md font-mono-num text-sm outline-none focus:border-blue-500/50 transition-colors uppercase tracking-wider" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => { if (searchResults.length > 0) setShowDropdown(true); }}
                        placeholder="RELIANCE" 
                    />
                    <AnimatePresence>
                        {showDropdown && (
                            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }}
                                className="absolute top-full left-0 mt-1 w-full bg-[#18181b] border border-white/10 rounded-md shadow-2xl z-50 overflow-hidden max-h-60 overflow-y-auto">
                                {searchResults.map((r) => (
                                    <button key={r.symbol} onClick={() => handleSelectSymbol(r.symbol)}
                                        className="w-full flex items-center justify-between px-4 py-2.5 text-xs hover:bg-blue-600/10 transition-colors text-left border-b border-white/5 last:border-0">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-white tracking-wide">{r.symbol}</span>
                                            <span className="text-[9px] text-zinc-500 uppercase truncate max-w-[150px]">{r.name}</span>
                                        </div>
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
 
                <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Category</label>
                    <div className="flex bg-[#121214] rounded-md border border-white/5 overflow-hidden p-0.5 min-h-[38px]">
                        <button className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white bg-blue-600 rounded-[4px]">Stock</button>
                        <button className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-300 transition-colors">Crypto</button>
                    </div>
                </div>
 
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="period-select" className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Timeframe</label>
                    <select 
                        id="period-select"
                        className="bg-[#121214] border border-white/5 text-white px-3 py-2 rounded-md text-xs outline-none focus:border-blue-500/50 cursor-pointer min-w-[120px] min-h-[38px]"
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                    >
                        <option value="1mo">30 Days</option>
                        <option value="6mo">180 Days</option>
                        <option value="1y">1 Year</option>
                        <option value="2y">2 Years</option>
                        <option value="5y">5 Years</option>
                        <option value="max">Max History</option>
                    </select>
                </div>
 
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="capital-input" className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Initial Capital</label>
                    <input 
                        id="capital-input"
                        type="text"
                        inputMode="numeric"
                        className="bg-[#121214] border border-white/5 text-white px-3 py-2 rounded-md font-mono-num text-xs w-32 outline-none focus:border-blue-500/50 min-h-[38px]" 
                        value={capital === 0 ? '' : capital}
                        onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, '');
                            setCapital(val === '' ? 0 : parseInt(val, 10));
                        }}
                        placeholder="100000"
                    />
                </div>
 
                <div className="flex flex-col gap-1.5 ml-auto">
                    <div className="h-[14px]" /> {/* Spacer for label alignment */}
                    <button
                        onClick={handleRun}
                        disabled={isRunning}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white transition-all px-6 py-2 rounded-md font-bold uppercase tracking-widest text-[11px] disabled:opacity-50 min-h-[38px] shadow-[0_0_15px_rgba(37,99,235,0.2)]"
                    >
                        {isRunning ? <Activity size={12} className="animate-spin" /> : <Play size={10} fill="currentColor" />}
                        {isRunning ? 'Running...' : 'Run Backtest'}
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-rose-900/20 border border-rose-500/20 text-rose-500 p-4 rounded-md flex items-center gap-3 animate-in fade-in duration-300">
                    <AlertCircle size={16} />
                    <span className="text-xs font-medium">{error}</span>
                </div>
            )}

            {results && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6">

                    {/* 2. SUMMARY STRIP */}
                    <div className="flex justify-between items-end border-b border-white/5 pb-5 mt-2">
                        <div>
                            <div className="text-white text-base font-bold tracking-[0.15em] uppercase">
                                {symbol} ({period.toUpperCase()}) · BACKTEST COMPLETE
                            </div>
                            <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.1em] mt-1">
                                {results.metrics.num_trades} TOTAL TRADES EXECUTED
                            </div>
                        </div>
                        <div className="text-right">
                            <div className={`text-4xl font-bold leading-none ${results.metrics.total_return >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {results.metrics.total_return >= 0 ? '+' : ''}{results.metrics.total_return.toFixed(2)}%
                            </div>
                            <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-[0.2em] mt-2">TOTAL RETURN</div>
                        </div>
                    </div>

                    {/* 3. 8-CARD METRICS GRID */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <MetricsCard label="WIN RATE" value={`${results.metrics.win_rate.toFixed(1)}%`} sub="Trades Profitable" />
                        <MetricsCard label="PROFIT FACTOR" value={results.metrics.profit_factor?.toFixed(2) || '∞'} sub="Gross Win / Gross Loss" />
                        <MetricsCard label="MAX DRAWDOWN" value={`${results.metrics.max_drawdown.toFixed(1)}%`} sub="Peak-to-Trough" color="text-rose-500" />
                        <MetricsCard label="SHARPE RATIO" value={results.metrics.sharpe_ratio.toFixed(2)} sub="Risk-Adj Return" />
                        
                        <MetricsCard label="AVG WIN" value={`${results.metrics.avg_win.toFixed(1)}%`} sub="Per Winning Trade" color="text-emerald-500" />
                        <MetricsCard label="AVG LOSS" value={`${results.metrics.avg_loss.toFixed(1)}%`} sub="Per Losing Trade" color="text-rose-500" />
                        <MetricsCard label="ANNUALIZED" value={`${results.metrics.annualized_return.toFixed(0)}%`} sub="Projected 1Y" />
                        <MetricsCard label="EXPECTANCY" value={results.metrics.expectancy.toFixed(2)} sub="Profit per ₹1 Risk" />
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-6 mt-4 border-b border-white/5">
                        <button
                            onClick={() => setActiveTab('equity')}
                            className={`pb-4 text-[11px] font-bold uppercase tracking-[0.15em] transition-all border-b-2 ${activeTab === 'equity' ? 'text-white border-blue-500' : 'text-zinc-500 hover:text-zinc-300 border-transparent'}`}
                        >
                            Equity Curve
                        </button>
                        <button
                            onClick={() => setActiveTab('log')}
                            className={`pb-4 text-[11px] font-bold uppercase tracking-[0.15em] transition-all border-b-2 ${activeTab === 'log' ? 'text-white border-blue-500' : 'text-zinc-500 hover:text-zinc-300 border-transparent'}`}
                        >
                            Trade Log ({results.trade_log.length})
                        </button>
                    </div>

                    {/* 4. BLUE EQUITY CURVE CHART */}
                    <div className="bg-[#0c0c0e] border border-white/5 rounded-lg p-6 min-h-[400px]">
                        {activeTab === 'equity' ? (
                            <div className="h-96 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={results.equity_curve}>
                                        <defs>
                                            <linearGradient id="colorBlue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                        <XAxis dataKey="date" hide />
                                        <YAxis hide domain={['auto', 'auto']} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', padding: '10px' }}
                                            itemStyle={{ fontSize: '12px', color: '#fff' }}
                                            labelStyle={{ fontSize: '10px', color: '#71717a', marginBottom: '4px' }}
                                            formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Portfolio Value']}
                                        />
                                        <Area 
                                            type="monotone" 
                                            dataKey="portfolio_value" 
                                            stroke="#3b82f6" 
                                            strokeWidth={2} 
                                            fill="url(#colorBlue)" 
                                            animationDuration={1000}
                                            activeDot={{ r: 4, strokeWidth: 0, fill: '#3b82f6' }}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            /* 5. TRADE LOG TABLE */
                            <div className="overflow-x-auto">
                                <table className="w-full font-mono-num text-[11px] border-collapse">
                                    <thead>
                                        <tr className="border-b border-white/5 text-zinc-500 uppercase tracking-widest font-bold">
                                            <th className="px-4 py-3 text-left">Type</th>
                                            <th className="px-4 py-3 text-left">Price</th>
                                            <th className="px-4 py-3 text-left">Qty</th>
                                            <th className="px-4 py-3 text-left">Time</th>
                                            <th className="px-4 py-3 text-right">Result</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {results.trade_log.map((t, i) => (
                                            <tr key={i} className="hover:bg-white/5 transition-colors">
                                                <td className={`px-4 py-3 font-bold ${t.outcome === 'WIN' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                    {t.outcome === 'WIN' ? 'BUY' : 'SELL'}
                                                </td>
                                                <td className="px-4 py-3 text-zinc-300">₹{t.exit_price.toLocaleString()}</td>
                                                <td className="px-4 py-3 text-zinc-500">35</td> {/* Mock Qty for design */}
                                                <td className="px-4 py-3 text-zinc-500">{t.exit_date}</td>
                                                <td className={`px-4 py-3 text-right font-bold ${t.return_pct >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                    {t.return_pct >= 0 ? '+' : ''}{t.return_pct.toFixed(2)}%
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </div>
    );
};

const MetricsCard = ({ label, value, sub, color }: { label: string; value: string; sub: string; color?: string }) => (
    <div className="bg-[#121214] border border-white/5 p-5 rounded-md hover:bg-[#18181b] transition-all">
        <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.1em] mb-2">{label}</div>
        <div className={`text-2xl font-medium tracking-tight mb-1 ${color || 'text-white'}`}>{value}</div>
        <div className="text-[10px] text-zinc-600 font-medium uppercase tracking-wide">{sub}</div>
    </div>
);
