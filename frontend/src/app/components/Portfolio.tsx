import React from 'react';
import { motion } from 'motion/react';
import { PortfolioRisk } from '@/app/components/PortfolioRisk';
import { Wallet, ArrowUpRight, ArrowDownRight, MoreVertical } from 'lucide-react';

const holdings = [
  { asset: 'Bitcoin', symbol: 'BTC', amount: '0.45', value: '$28,903.72', avgPrice: '$45,000', pl: '+42.5%', plValue: '+$8,620' },
  { asset: 'Ethereum', symbol: 'ETH', amount: '5.20', value: '$17,941.04', avgPrice: '$2,800', pl: '+23.2%', plValue: '+$3,380' },
  { asset: 'NVIDIA', symbol: 'NVDA', amount: '15', value: '$13,806.00', avgPrice: '$450', pl: '+104.5%', plValue: '+$7,056' },
  { asset: 'Cash', symbol: 'USD', amount: '1', value: '$10,240.00', avgPrice: '$1', pl: '0.0%', plValue: '$0' },
];

export const Portfolio = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Portfolio Intelligence</h2>
          <p className="text-slate-400">Risk analysis and performance tracking</p>
        </div>
        <div className="flex gap-3">
             <button className="flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-600">
                <Wallet className="h-4 w-4" />
                Connect Wallet
            </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Total Balance Card */}
        <div className="lg:col-span-3 rounded-xl border border-slate-800 bg-gradient-to-r from-slate-900 to-slate-800 p-8">
            <div className="mb-2 text-sm font-medium text-slate-400">Total Balance</div>
            <div className="flex items-baseline gap-4">
                <h1 className="text-4xl font-bold text-white">$70,890.76</h1>
                <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-sm font-medium text-emerald-400">
                    <ArrowUpRight className="h-4 w-4" />
                    +12.4% (This Month)
                </span>
            </div>
        </div>

        {/* Existing Risk Analysis */}
        <div className="lg:col-span-3">
            <PortfolioRisk />
        </div>

        {/* Holdings Table */}
        <div className="lg:col-span-3 rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm overflow-hidden">
             <div className="border-b border-slate-800 px-6 py-4">
                <h3 className="text-lg font-semibold text-slate-100">Current Holdings</h3>
            </div>
             <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-400">
                    <thead className="bg-slate-950/50 text-xs uppercase text-slate-500">
                    <tr>
                        <th className="px-6 py-4 font-semibold">Asset</th>
                        <th className="px-6 py-4 font-semibold">Balance</th>
                        <th className="px-6 py-4 font-semibold">Value</th>
                        <th className="px-6 py-4 font-semibold">Avg. Price</th>
                        <th className="px-6 py-4 font-semibold">P/L</th>
                        <th className="px-6 py-4 font-semibold text-right">Options</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                    {holdings.map((item) => (
                        <tr key={item.symbol} className="hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-300">
                                    {item.symbol[0]}
                                </div>
                                <div>
                                    <div className="font-medium text-slate-200">{item.asset}</div>
                                    <div className="text-xs text-slate-500">{item.symbol}</div>
                                </div>
                            </div>
                        </td>
                        <td className="px-6 py-4 text-slate-200">{item.amount} {item.symbol}</td>
                        <td className="px-6 py-4 font-medium text-slate-200">{item.value}</td>
                        <td className="px-6 py-4 text-slate-400">{item.avgPrice}</td>
                        <td className="px-6 py-4">
                            <div className={`flex flex-col ${item.plValue.startsWith('+') ? 'text-emerald-400' : 'text-slate-400'}`}>
                                <span className="font-medium">{item.pl}</span>
                                <span className="text-xs opacity-80">{item.plValue}</span>
                            </div>
                        </td>
                         <td className="px-6 py-4 text-right">
                            <button className="text-slate-500 hover:text-white">
                                <MoreVertical className="h-4 w-4" />
                            </button>
                        </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    </motion.div>
  );
};
