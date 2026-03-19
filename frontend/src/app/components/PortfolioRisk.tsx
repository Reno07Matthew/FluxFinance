import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Info, Zap, ShieldAlert } from 'lucide-react';

interface PortfolioRiskProps {
  riskScore?: number;
  isHighRisk?: boolean;
  onExecuteRebalance?: () => void;
}

export const PortfolioRisk = ({ riskScore = 65, isHighRisk = false, onExecuteRebalance }: PortfolioRiskProps) => {
  const [showTip, setShowTip] = useState(false);

  const risk = riskScore >= 80 ? { label: 'CRITICAL', cls: 'text-danger' }
    : riskScore >= 60 ? { label: 'Moderate-High', cls: 'text-warning' }
    : riskScore >= 40 ? { label: 'Moderate', cls: 'text-warning' }
    : { label: 'Low', cls: 'text-success' };

  return (
    <div className="rounded-xl bg-white dark:bg-[#18181b] border border-gray-200 dark:border-white/5 shadow-sm dark:shadow-none p-5">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
          {isHighRisk && (
            <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }}>
              <ShieldAlert className="h-3.5 w-3.5 text-danger" strokeWidth={1.5} aria-hidden="true" />
            </motion.div>
          )}
          Risk Assessor
        </h3>
        <span className={`text-sm font-bold font-mono-num ${risk.cls}`}>{riskScore}/100</span>
      </div>
      <p className="text-xs text-gray-500 dark:text-zinc-400 mb-4">Portfolio exposure analysis</p>

      {/* Risk Bar */}
      <div>
        <div className="flex justify-between text-[10px] font-medium uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-1.5">
          <span>Low</span><span>Mod</span><span>High</span>
        </div>
        <div className="relative h-2 w-full rounded-full overflow-hidden bg-bg-elevated" role="progressbar"
          aria-valuenow={riskScore} aria-valuemin={0} aria-valuemax={100} aria-label={`Risk: ${risk.label}`}>
          <div className="absolute left-0 top-0 h-full w-1/3 bg-success/30" />
          <div className="absolute left-1/3 top-0 h-full w-1/3 bg-warning/30" />
          <div className="absolute left-2/3 top-0 h-full w-1/3 bg-danger/30" />
          <motion.div initial={{ left: '0%' }} animate={{ left: `${riskScore}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="absolute top-0 h-full w-1 rounded-full bg-text-primary" />
        </div>

        {/* Label */}
        <div className="mt-3 text-center relative">
          <div className="flex items-center justify-center gap-1.5">
            <span className={`text-lg font-bold ${risk.cls}`}>{risk.label}</span>
            <button onMouseEnter={() => setShowTip(true)} onMouseLeave={() => setShowTip(false)}
              className="p-1 rounded-lg hover:bg-bg-hover transition-colors text-zinc-400 hover:text-accent"
              aria-label="Risk explanation">
              <Info className="h-3.5 w-3.5 text-zinc-400" strokeWidth={1.5} />
              <AnimatePresence>
                {showTip && (
                  <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                    className="absolute z-50 right-0 top-full mt-1.5 w-64 rounded-lg border border-border bg-bg-card p-3 shadow-xl text-left">
                    <p className="text-xs text-text-secondary leading-relaxed">
                      Score of <span className={`font-bold ${risk.cls}`}>{riskScore}/100</span> based on concentration,
                      correlation, and momentum indicators across your holdings.
                    </p>
                    <div className="mt-2 pt-2 border-t border-gray-200 dark:border-white/5 text-[10px] text-gray-500 dark:text-zinc-400 font-mono-num flex items-center gap-3">
                      <span>Beta: 1.2</span><span>Sharpe: 1.8</span><span>Corr: 0.85</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>
          <p className="text-[10px] text-gray-500 dark:text-zinc-400 mt-1 font-mono-num">Beta: 1.2 · Sharpe: 1.8</p>
        </div>
      </div>

      {/* Rebalance */}
      <div className={`rounded-lg p-3 mt-4 ${isHighRisk ? 'bg-danger/5 border border-danger/15' : 'bg-bg-elevated/50'}`}>
        <h4 className="text-xs font-semibold text-text-secondary mb-1.5 flex items-center gap-1.5">
          AI Recommendation
          {isHighRisk && (
            <span className="text-[10px] font-bold text-danger bg-danger/10 px-1.5 py-0.5 rounded-full">Action</span>
          )}
        </h4>
        <p className="text-[11px] text-gray-500 dark:text-zinc-400 leading-relaxed mb-3">
          Consider rebalancing to reduce concentration risk and lower portfolio volatility.
        </p>
        <button onClick={onExecuteRebalance}
          className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors min-h-[44px]">
          <Zap className="h-3.5 w-3.5 text-zinc-300" strokeWidth={1.5} aria-hidden="true" /> Execute Rebalance
        </button>
      </div>
    </div>
  );
};
