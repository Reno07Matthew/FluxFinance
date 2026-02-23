import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  TrendingUp, Activity, AlertTriangle, BarChart3,
  ArrowUpRight, ArrowDownRight, Target, ShieldAlert, Wifi, WifiOff
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useMarket } from '@/context/MarketContext';
import { useLivePrice } from '@/hooks/useLivePrice';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

// ── Static stat card ────────────────────────────────────────────────────────
const Card = ({ title, value, subtext, icon: Icon, trend, color, delay, badge }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm"
  >
    <div className="flex items-center justify-between pb-2">
      <h3 className="text-sm font-medium text-slate-400">{title}</h3>
      <Icon className={cn("h-4 w-4", color)} />
    </div>
    <div className="flex items-baseline gap-2 flex-wrap">
      <div className="text-2xl font-bold text-slate-100">{value}</div>
      {badge && (
        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full uppercase", badge.className)}>
          {badge.label}
        </span>
      )}
      {trend && (
        <span className={cn("flex items-center text-xs font-medium", trend === 'up' ? "text-green-500" : "text-red-500")}>
          {trend === 'up' ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
          {subtext}
        </span>
      )}
      {!trend && subtext && (
        <span className="text-xs text-slate-500">{subtext}</span>
      )}
    </div>
    <div className="mt-4 h-1 w-full rounded-full bg-slate-800">
      <div className={cn("h-1 rounded-full", color.replace('text-', 'bg-'))} style={{ width: '70%' }} />
    </div>
  </motion.div>
);

// ── Live Price Card ───────────────────────────────────────────────────────────
const LivePriceCard = ({ symbol, assetType, staticPrice, currency, verdictBadge, delay }: any) => {
  const live = useLivePrice(symbol, assetType);
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);

  // Trigger flash when price direction changes
  useEffect(() => {
    if (!live || live.priceDirection === 'flat') return;
    setFlash(live.priceDirection);
    const t = setTimeout(() => setFlash(null), 600);
    return () => clearTimeout(t);
  }, [live?.price]);

  const displayPrice = live?.price ?? staticPrice ?? 0;
  const displayChange = live?.changePct ?? 0;
  const currencySymbol = (live?.currency ?? currency) === 'INR' ? '₹' : '$';
  const isConnected = live?.isConnected ?? false;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={cn(
        "rounded-xl border p-6 backdrop-blur-sm relative overflow-hidden transition-colors duration-300",
        flash === 'up' ? "border-green-500/60 bg-green-950/20" :
          flash === 'down' ? "border-red-500/60   bg-red-950/20" :
            "border-slate-800 bg-slate-900/50"
      )}
    >
      {/* Live indicator dot */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5">
        {isConnected ? (
          <>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <Wifi className="h-3 w-3 text-green-500" />
          </>
        ) : (
          <>
            <WifiOff className="h-3 w-3 text-slate-600" />
          </>
        )}
      </div>

      <div className="flex items-center justify-between pb-2">
        <h3 className="text-sm font-medium text-slate-400">Live Price</h3>
        <Activity className="h-4 w-4 text-cyan-500" />
      </div>

      {/* Price — animates on change */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={displayPrice}
          initial={{ y: flash === 'up' ? 8 : flash === 'down' ? -8 : 0, opacity: 0.6 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "text-2xl font-bold font-mono tabular-nums",
            flash === 'up' ? "text-green-400" :
              flash === 'down' ? "text-red-400" : "text-slate-100"
          )}
        >
          {currencySymbol}{displayPrice.toLocaleString()}
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center gap-2 mt-1 flex-wrap">
        <span className="text-xs text-slate-500">{symbol}</span>
        {verdictBadge && (
          <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full uppercase", verdictBadge.className)}>
            {verdictBadge.label}
          </span>
        )}
        <span className={cn(
          "flex items-center text-xs font-medium ml-auto",
          displayChange >= 0 ? "text-green-500" : "text-red-500"
        )}>
          {displayChange >= 0
            ? <ArrowUpRight className="h-3 w-3 mr-0.5" />
            : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
          {Math.abs(displayChange).toFixed(2)}%
        </span>
      </div>

      <div className="mt-4 h-1 w-full rounded-full bg-slate-800">
        <div className="h-1 rounded-full bg-cyan-500" style={{ width: '70%' }} />
      </div>
    </motion.div>
  );
};

// ── Main DashboardOverview ───────────────────────────────────────────────────
export const DashboardOverview = () => {
  const { data, symbol, assetType } = useMarket();

  const sentimentScore = data?.sentiment?.score ?? 0;
  const rsi = data?.technical?.rsi ?? 50;
  const fluxScore = data?.verdict?.flux_score ?? 50;
  const verdictLabel = data?.verdict?.verdict ?? 'HOLD / NEUTRAL';
  const currency = data?.currency ?? 'USD';
  const price = data?.price ?? 0;
  const rm = data?.verdict?.risk_management;

  const getVerdictBadge = () => {
    if (verdictLabel === 'STRONG BUY') return { label: '▲ STRONG BUY', className: 'bg-green-500/15 text-green-400 border border-green-500/30' };
    if (verdictLabel === 'HIGH RISK (AVOID)') return { label: '⚠ HIGH RISK', className: 'bg-red-500/15 text-red-400 border border-red-500/30' };
    return { label: '⚖ HOLD', className: 'bg-amber-500/15 text-amber-400 border border-amber-500/30' };
  };

  const getSentimentLabel = () => {
    if (sentimentScore > 0.4) return 'Greed (Bullish)';
    if (sentimentScore > 0.15) return 'Optimistic';
    if (sentimentScore > -0.15) return 'Neutral';
    if (sentimentScore > -0.4) return 'Fear';
    return 'Extreme Fear';
  };

  const getTechnicalBias = () => {
    if (rsi > 70) return { label: 'Overbought', trend: 'down' };
    if (rsi < 30) return { label: 'Oversold — Buy', trend: 'up' };
    if (sentimentScore > 0.2 && rsi < 60) return { label: 'Strong Buy', trend: 'up' };
    return { label: 'Hold', trend: null };
  };

  const getRiskLevel = () => {
    if (fluxScore >= 72) return { label: 'Low Risk', subtext: 'Strong Buy Zone', color: 'text-green-500', trend: 'up' };
    if (fluxScore <= 35) return { label: 'High Risk', subtext: 'Avoid / Exit Signal', color: 'text-red-500', trend: 'down' };
    return { label: 'Moderate', subtext: 'Monitor Closely', color: 'text-amber-500', trend: null };
  };

  const technicalBias = getTechnicalBias();
  const risk = getRiskLevel();

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Sentiment */}
        <Card
          title="Market Sentiment"
          value={sentimentScore > 0 ? `+${sentimentScore.toFixed(2)}` : sentimentScore.toFixed(2)}
          subtext={getSentimentLabel()}
          icon={TrendingUp}
          color={sentimentScore > 0 ? "text-green-500" : sentimentScore < 0 ? "text-red-500" : "text-amber-500"}
          trend={sentimentScore > 0 ? 'up' : sentimentScore < 0 ? 'down' : null}
          delay={0}
        />

        {/* Live Price Card with WebSocket */}
        <LivePriceCard
          symbol={symbol}
          assetType={assetType}
          staticPrice={price}
          currency={currency}
          verdictBadge={getVerdictBadge()}
          delay={0.1}
        />

        {/* Technical Bias */}
        <Card
          title="Technical Bias"
          value={technicalBias.label}
          subtext={`RSI: ${rsi.toFixed(1)}`}
          icon={BarChart3}
          color="text-cyan-500"
          trend={technicalBias.trend}
          delay={0.2}
        />

        {/* Risk Level */}
        <Card
          title="Risk Level"
          value={risk.label}
          subtext={risk.subtext}
          icon={AlertTriangle}
          color={risk.color}
          trend={risk.trend}
          delay={0.3}
        />
      </div>

      {/* Risk Management Row — only if full 7-indicator data available */}
      {rm && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 flex items-center gap-4">
            <div className="p-2 bg-slate-800 rounded-lg"><Target className="h-4 w-4 text-cyan-400" /></div>
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wider">Pivot Point</div>
              <div className="text-lg font-bold font-mono text-slate-100">
                {currency === 'INR' ? '₹' : '$'}{rm.pivot.toLocaleString()}
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-green-800/40 bg-green-900/10 p-4 flex items-center gap-4">
            <div className="p-2 bg-green-900/30 rounded-lg"><ArrowUpRight className="h-4 w-4 text-green-400" /></div>
            <div>
              <div className="text-xs text-green-600 uppercase tracking-wider font-bold">R1 — Target Exit</div>
              <div className="text-lg font-bold font-mono text-green-400">
                {currency === 'INR' ? '₹' : '$'}{rm.target_exit_R1.toLocaleString()}
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-red-800/40 bg-red-900/10 p-4 flex items-center gap-4">
            <div className="p-2 bg-red-900/30 rounded-lg"><ShieldAlert className="h-4 w-4 text-red-400" /></div>
            <div>
              <div className="text-xs text-red-600 uppercase tracking-wider font-bold">S1 — Stop Loss</div>
              <div className="text-lg font-bold font-mono text-red-400">
                {currency === 'INR' ? '₹' : '$'}{rm.stop_loss_S1.toLocaleString()}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
