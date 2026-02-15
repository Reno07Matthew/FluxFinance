import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Info, Zap, ShieldAlert } from 'lucide-react';

interface PortfolioRiskProps {
    riskScore?: number;
    isHighRisk?: boolean;
    onExecuteRebalance?: () => void;
}

const data = [
    { name: 'Equities', value: 45, color: '#3b82f6' },
    { name: 'Crypto', value: 25, color: '#06b6d4' },
    { name: 'Bonds', value: 20, color: '#8b5cf6' },
    { name: 'Cash', value: 10, color: '#64748b' },
];

export const PortfolioRisk = ({ riskScore = 65, isHighRisk = false, onExecuteRebalance }: PortfolioRiskProps) => {
    const [showRiskTooltip, setShowRiskTooltip] = useState(false);

    // Determine risk level text and color
    const getRiskLevel = () => {
        if (riskScore >= 80) return { label: 'CRITICAL', color: 'text-red-400', barPos: `${riskScore}%` };
        if (riskScore >= 60) return { label: 'Moderate-High', color: 'text-amber-500', barPos: `${riskScore}%` };
        if (riskScore >= 40) return { label: 'Moderate', color: 'text-amber-400', barPos: `${riskScore}%` };
        return { label: 'Low', color: 'text-emerald-400', barPos: `${riskScore}%` };
    };

    const risk = getRiskLevel();

    return (
        <div className="flex flex-col gap-4">
            {/* Asset Allocation */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm"
            >
                <h3 className="mb-4 text-lg font-semibold text-slate-100">Asset Allocation</h3>
                <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                                stroke="none"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f1f5f9' }}
                                itemStyle={{ color: '#f1f5f9' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="mt-4 flex flex-wrap justify-center gap-4">
                    {data.map((item) => (
                        <div key={item.name} className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="text-xs text-slate-400">{item.name}</span>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* Risk Assessor — with Threat Detection Glow */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
                className={`flex flex-col rounded-xl border bg-slate-900/50 p-6 backdrop-blur-sm transition-all duration-500 ${isHighRisk
                        ? 'border-red-500/30 shadow-[0_0_25px_rgba(239,68,68,0.12)]'
                        : 'border-slate-800'
                    }`}
            >
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                        {isHighRisk && (
                            <motion.div
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                <ShieldAlert className="h-5 w-5 text-red-400" />
                            </motion.div>
                        )}
                        Risk Assessor
                    </h3>
                    <span className={`text-sm font-bold ${risk.color}`}>{riskScore}/100</span>
                </div>
                <p className="mb-6 text-sm text-slate-400">Current portfolio exposure analysis</p>

                <div className="mb-8 flex-1">
                    <div className="mb-2 flex justify-between text-xs font-medium uppercase tracking-wider text-slate-500">
                        <span>Low</span>
                        <span>Moderate</span>
                        <span>High</span>
                    </div>
                    <div className="relative h-4 w-full overflow-hidden rounded-full bg-slate-800">
                        <div className="absolute left-0 top-0 h-full w-1/3 bg-emerald-500/50"></div>
                        <div className="absolute left-1/3 top-0 h-full w-1/3 bg-amber-500/50"></div>
                        <div className="absolute left-2/3 top-0 h-full w-1/3 bg-rose-500/50"></div>

                        {/* Animated Indicator */}
                        <motion.div
                            initial={{ left: '0%' }}
                            animate={{ left: risk.barPos }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            className={`absolute top-0 h-full w-1.5 rounded-full bg-white ${isHighRisk ? 'shadow-[0_0_12px_rgba(239,68,68,0.8)]' : 'shadow-[0_0_10px_rgba(255,255,255,0.8)]'
                                }`}
                        />
                    </div>

                    {/* Risk Label + Interactive Tooltip */}
                    <div className="mt-4 text-center relative">
                        <div className="flex items-center justify-center gap-2">
                            <span className={`text-2xl font-bold ${risk.color}`}>{risk.label}</span>
                            <button
                                onMouseEnter={() => setShowRiskTooltip(true)}
                                onMouseLeave={() => setShowRiskTooltip(false)}
                                className="relative p-1 rounded-full hover:bg-slate-800 transition-colors text-slate-500 hover:text-cyan-400"
                            >
                                <Info className="h-4 w-4" />

                                <AnimatePresence>
                                    {showRiskTooltip && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 5 }}
                                            className="absolute z-50 right-0 top-full mt-2 w-72 rounded-lg border border-slate-700 bg-slate-900 p-4 shadow-2xl text-left"
                                        >
                                            <div className="text-[10px] uppercase tracking-wider text-cyan-400 font-bold mb-2 flex items-center gap-1">
                                                <Zap className="h-3 w-3" />
                                                Why is risk {risk.label.toLowerCase()}?
                                            </div>
                                            <p className="text-xs leading-relaxed text-slate-300">
                                                Your Risk Score is <span className={`font-bold ${risk.color}`}>{riskScore}/100</span> because{' '}
                                                <span className="text-white font-medium">65% of your portfolio</span> is in Bitcoin and NVIDIA,
                                                which are currently <span className="text-red-400 font-medium">highly correlated</span> and{' '}
                                                <span className="text-red-400 font-medium">Overbought (RSI &gt; 75)</span>.
                                            </p>
                                            <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] text-slate-500 flex items-center gap-3">
                                                <span>Beta: 1.2</span>
                                                <span>Sharpe: 1.8</span>
                                                <span>Corr: 0.85</span>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </button>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                            Beta: 1.2 | Sharpe Ratio: 1.8
                        </p>
                    </div>
                </div>

                {/* AI Recommendation — Now Actionable */}
                <div className={`rounded-lg p-4 ${isHighRisk ? 'bg-red-500/5 border border-red-500/15' : 'bg-slate-800/50'
                    }`}>
                    <h4 className="mb-2 text-sm font-semibold text-slate-200 flex items-center gap-2">
                        AI Recommendation
                        {isHighRisk && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">
                                Action Required
                            </span>
                        )}
                    </h4>
                    <p className="text-xs leading-relaxed text-slate-400 mb-4">
                        Your exposure to crypto assets is drifting above target limits. Consider rebalancing <span className="text-white font-medium">5% into fixed income</span> and <span className="text-white font-medium">reducing BTC position by 20%</span> to lower overall volatility and reduce concentration risk.
                    </p>

                    {/* Glowing Execute Button */}
                    <motion.button
                        onClick={onExecuteRebalance}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 text-sm font-bold transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(37,99,235,0.6)]"
                    >
                        <motion.div
                            animate={{ opacity: [0.6, 1, 0.6] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            <Zap className="h-4 w-4" />
                        </motion.div>
                        EXECUTE REBALANCE
                    </motion.button>
                </div>
            </motion.div>
        </div>
    );
};
