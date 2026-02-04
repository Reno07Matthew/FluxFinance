import React from 'react';
import { motion } from 'motion/react';
import { TrendingUp, Activity, AlertTriangle, BarChart3, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useMarket } from '@/context/MarketContext';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

const Card = ({ title, value, subtext, icon: Icon, trend, color, delay }: any) => {
  return (
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
      <div className="flex items-baseline space-x-2">
        <div className="text-2xl font-bold text-slate-100">{value}</div>
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
        <div
          className={cn("h-1 rounded-full", color.replace('text-', 'bg-'))}
          style={{ width: '70%' }}
        />
      </div>
    </motion.div>
  );
};

export const DashboardOverview = () => {
  const { data } = useMarket();

  const sentimentScore = data?.sentiment?.score ?? 0;
  const rsi = data?.technical?.rsi ?? 50;
  const fluxScore = data?.verdict?.flux_score ?? 50;
  const currency = data?.currency === 'INR' ? '₹' : '$';
  const price = data?.price ?? 0;

  const getSentimentLabel = () => {
    if (sentimentScore > 0.4) return 'Greed (Bullish)';
    if (sentimentScore > 0.15) return 'Optimistic';
    if (sentimentScore > -0.15) return 'Neutral';
    if (sentimentScore > -0.4) return 'Fear';
    return 'Extreme Fear';
  };

  const getTechnicalBias = () => {
    if (rsi > 70) return { label: 'Overbought', trend: 'down' };
    if (rsi < 30) return { label: 'Oversold - Buy', trend: 'up' };
    if (sentimentScore > 0.2 && rsi < 60) return { label: 'Strong Buy', trend: 'up' };
    return { label: 'Hold', trend: null };
  };

  const getRiskLevel = () => {
    if (fluxScore > 70) return { label: 'High Risk', subtext: 'Hype Bubble Detected', color: 'text-red-500', trend: 'down' };
    if (fluxScore < 30) return { label: 'Low Risk', subtext: 'Value Opportunity', color: 'text-green-500', trend: 'up' };
    return { label: 'Moderate', subtext: 'Monitor Closely', color: 'text-amber-500', trend: null };
  };

  const technicalBias = getTechnicalBias();
  const risk = getRiskLevel();

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card
        title="Market Sentiment"
        value={sentimentScore > 0 ? `+${sentimentScore.toFixed(2)}` : sentimentScore.toFixed(2)}
        subtext={getSentimentLabel()}
        icon={TrendingUp}
        color={sentimentScore > 0 ? "text-green-500" : sentimentScore < 0 ? "text-red-500" : "text-amber-500"}
        trend={sentimentScore > 0 ? 'up' : sentimentScore < 0 ? 'down' : null}
        delay={0}
      />
      <Card
        title="Current Price"
        value={`${currency}${price.toLocaleString()}`}
        subtext={data?.symbol || 'Loading...'}
        icon={Activity}
        color="text-cyan-500"
        delay={0.1}
      />
      <Card
        title="Technical Bias"
        value={technicalBias.label}
        subtext={`RSI: ${rsi.toFixed(1)}`}
        icon={BarChart3}
        color="text-cyan-500"
        trend={technicalBias.trend}
        delay={0.2}
      />
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
  );
};
