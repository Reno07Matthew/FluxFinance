import React from 'react';
import { motion } from 'motion/react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { ExternalLink } from 'lucide-react';
import { useMarket } from '@/context/MarketContext';

export const SentimentSection = () => {
  const { data } = useMarket();

  const sentimentScore = data?.sentiment?.score ?? 0;
  const sentimentLabel = data?.sentiment?.label ?? 'Neutral';
  const headlines = data?.headlines ?? [];

  const sentimentPercent = Math.round(((sentimentScore + 1) / 2) * 100);

  const sentimentData = [
    { name: 'Positive', value: sentimentPercent, color: '#10b981' },
    { name: 'Negative', value: 100 - sentimentPercent, color: '#334155' },
  ];

  const getSentiment = (headline: string) => {
    const text = headline.toLowerCase();
    const positive = ['surge', 'jump', 'rise', 'gain', 'bull', 'high', 'up', 'growth', 'positive', 'rally', 'buyback'];
    const negative = ['fall', 'drop', 'crash', 'bear', 'low', 'down', 'loss', 'negative', 'slide', 'slump', 'fear'];

    if (positive.some(word => text.includes(word))) return 'positive';
    if (negative.some(word => text.includes(word))) return 'negative';
    return 'neutral';
  };

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm"
      >
        <h3 className="mb-4 text-lg font-semibold text-slate-100">AI Sentiment Analysis</h3>
        <div className="relative flex h-[180px] flex-col items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={sentimentData}
                cx="50%"
                cy="100%"
                startAngle={180}
                endAngle={0}
                innerRadius={60}
                outerRadius={80}
                paddingAngle={0}
                dataKey="value"
                stroke="none"
              >
                {sentimentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute bottom-0 text-center">
            <div className="text-3xl font-bold text-slate-100">
              {sentimentScore > 0 ? '+' : ''}{sentimentScore.toFixed(2)}
            </div>
            <div className={`text-sm font-medium ${sentimentScore > 0.15 ? 'text-emerald-400' :
                sentimentScore < -0.15 ? 'text-rose-400' : 'text-amber-400'
              }`}>
              {sentimentLabel} Sentiment
            </div>
          </div>
        </div>
        <div className="mt-4 rounded-lg bg-slate-800/50 p-3 text-xs text-slate-400">
          <span className="font-semibold text-cyan-400">FinBERT AI:</span> Analyzed {headlines.length} news headlines for {data?.symbol || 'asset'}.
          {sentimentScore > 0.3 ? ' Market sentiment is bullish.' :
            sentimentScore < -0.3 ? ' Market sentiment is bearish.' :
              ' Market sentiment is mixed.'}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-100">Live News Feed</h3>
          <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded">{headlines.length} articles</span>
        </div>
        <div className="space-y-4 max-h-[300px] overflow-y-auto">
          {headlines.length === 0 ? (
            <p className="text-slate-500 text-center py-4">No news available</p>
          ) : (
            headlines.map((headline, index) => (
              <div key={index} className="group flex cursor-pointer flex-col gap-1 border-b border-slate-800 pb-3 last:border-0 last:pb-0">
                <div className="flex items-start justify-between">
                  <h4 className="line-clamp-2 text-sm font-medium text-slate-200 transition-colors group-hover:text-cyan-400">
                    {headline}
                  </h4>
                  <ExternalLink className="mt-1 h-3 w-3 shrink-0 text-slate-600 opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className={
                    getSentiment(headline) === 'positive' ? 'text-emerald-400' :
                      getSentiment(headline) === 'negative' ? 'text-rose-400' :
                        'text-amber-400'
                  }>
                    {getSentiment(headline).charAt(0).toUpperCase() + getSentiment(headline).slice(1)}
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="text-slate-500">Google News</span>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
};
