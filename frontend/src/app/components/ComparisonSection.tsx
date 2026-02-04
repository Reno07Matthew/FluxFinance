import React from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, Zap, GitCompare } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

const comparisonData = Array.from({ length: 20 }, (_, i) => ({
    name: i.toString(),
    price: 50 + i * 2 + Math.random() * 10,
    sentiment: 50 + i * 1.5 - (i > 15 ? i * 2 : 0) + Math.random() * 5, // Sentiment drops at the end while price rises
}));

export const ComparisonSection = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.8 }}
      className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm"
    >
      <div className="flex items-center justify-between">
        <div>
            <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                <GitCompare className="h-5 w-5 text-purple-400" />
                Flux Logic Comparison
            </h3>
            <p className="text-sm text-slate-400">Emotion vs. Reality Analysis</p>
        </div>
        <div className="flex gap-2">
             <span className="flex items-center gap-1 rounded-full bg-rose-500/10 px-3 py-1 text-xs font-medium text-rose-400 border border-rose-500/20">
                <AlertTriangle className="h-3 w-3" />
                Hype Bubble Detected
            </span>
             <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400 border border-amber-500/20">
                <Zap className="h-3 w-3" />
                Divergence Warning
            </span>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Insight Cards */}
        <div className="space-y-4 lg:col-span-1">
            <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-4">
                <h4 className="text-sm font-semibold text-slate-200 mb-2">Sentiment-Price Divergence</h4>
                <p className="text-xs text-slate-400 mb-3">
                    Price is making higher highs while social sentiment is making lower highs. This bearish divergence often precedes a correction.
                </p>
                <div className="h-1 w-full rounded-full bg-slate-700">
                    <div className="h-1 w-[85%] rounded-full bg-rose-500"></div>
                </div>
                <div className="mt-1 flex justify-between text-[10px] text-slate-500">
                    <span>Probability</span>
                    <span className="text-rose-400">85% High</span>
                </div>
            </div>
             <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-4">
                <h4 className="text-sm font-semibold text-slate-200 mb-2">Panic vs. Fundamentals</h4>
                <p className="text-xs text-slate-400">
                    Market panic score is elevated (78/100) but fundamental indicators remain stable. Potential buying opportunity.
                </p>
            </div>
        </div>

        {/* Chart */}
        <div className="h-[250px] w-full lg:col-span-2">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="name" hide />
                    <YAxis yAxisId="left" stroke="#64748b" tick={false} axisLine={false} />
                    <YAxis yAxisId="right" orientation="right" stroke="#64748b" tick={false} axisLine={false} />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                        itemStyle={{ fontSize: '12px' }}
                    />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="price" stroke="#06b6d4" strokeWidth={2} dot={false} name="Market Price" />
                    <Line yAxisId="right" type="monotone" dataKey="sentiment" stroke="#f43f5e" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Social Sentiment" />
                </LineChart>
            </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
};
