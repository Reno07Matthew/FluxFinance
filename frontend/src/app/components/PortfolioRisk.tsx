import React from 'react';
import { motion } from 'motion/react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Equities', value: 45, color: '#3b82f6' }, // Blue
  { name: 'Crypto', value: 25, color: '#06b6d4' }, // Cyan
  { name: 'Bonds', value: 20, color: '#8b5cf6' }, // Violet
  { name: 'Cash', value: 10, color: '#64748b' }, // Slate
];

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
  
    return (
      <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-[10px] font-bold">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

export const PortfolioRisk = () => {
  return (
    <div className="flex flex-col gap-4">
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

        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="flex flex-col rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm"
        >
            <h3 className="mb-2 text-lg font-semibold text-slate-100">Risk Assessor</h3>
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
                    
                    {/* Indicator Marker */}
                    <div className="absolute top-0 h-full w-1 bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]" style={{ left: '65%' }}></div>
                </div>
                <div className="mt-4 text-center">
                    <span className="text-2xl font-bold text-amber-500">Moderate-High</span>
                    <p className="text-xs text-slate-400 mt-1">
                        Beta: 1.2 | Sharpe Ratio: 1.8
                    </p>
                </div>
            </div>

            <div className="rounded-lg bg-slate-800/50 p-4">
                <h4 className="mb-2 text-sm font-semibold text-slate-200">AI Recommendation</h4>
                <p className="text-xs leading-relaxed text-slate-400">
                    Your exposure to crypto assets is drifting above target limits. Consider rebalancing 5% into fixed income to reduce overall volatility.
                </p>
            </div>
        </motion.div>
    </div>
  );
};
