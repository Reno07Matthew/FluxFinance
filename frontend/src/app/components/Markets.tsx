import React from 'react';
import { motion } from 'motion/react';
import { TrendingUp, TrendingDown, Activity, DollarSign } from 'lucide-react';

const marketData = [
  { symbol: 'BTC', name: 'Bitcoin', price: '64,230.50', change: '+2.4%', sentiment: 'Bullish', score: 8.5 },
  { symbol: 'ETH', name: 'Ethereum', price: '3,450.20', change: '-1.1%', sentiment: 'Neutral', score: 5.2 },
  { symbol: 'SOL', name: 'Solana', price: '145.80', change: '+5.7%', sentiment: 'Very Bullish', score: 9.1 },
  { symbol: 'NVDA', name: 'NVIDIA', price: '920.40', change: '+1.2%', sentiment: 'Bullish', score: 7.8 },
  { symbol: 'TSLA', name: 'Tesla', price: '178.90', change: '-2.4%', sentiment: 'Bearish', score: 3.4 },
  { symbol: 'AAPL', name: 'Apple', price: '182.50', change: '+0.5%', sentiment: 'Neutral', score: 6.0 },
  { symbol: 'AMD', name: 'AMD', price: '160.20', change: '+3.1%', sentiment: 'Bullish', score: 7.2 },
  { symbol: 'COIN', name: 'Coinbase', price: '240.10', change: '+4.5%', sentiment: 'Very Bullish', score: 8.8 },
];

export const Markets = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Market Overview</h2>
          <p className="text-slate-400">Live prices and sentiment analysis</p>
        </div>
        <div className="flex gap-2">
          <button className="rounded-lg bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-400 hover:bg-cyan-500/20">
            Crypto
          </button>
          <button className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-slate-400 hover:bg-slate-700 hover:text-slate-200">
            Stocks
          </button>
          <button className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-slate-400 hover:bg-slate-700 hover:text-slate-200">
            Forex
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="bg-slate-950/50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-6 py-4 font-semibold">Asset</th>
                <th className="px-6 py-4 font-semibold">Price</th>
                <th className="px-6 py-4 font-semibold">24h Change</th>
                <th className="px-6 py-4 font-semibold">Sentiment Score</th>
                <th className="px-6 py-4 font-semibold">Trend</th>
                <th className="px-6 py-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {marketData.map((asset) => (
                <tr key={asset.symbol} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-slate-200">
                        {asset.symbol[0]}
                      </div>
                      <div>
                        <div className="font-medium text-slate-200">{asset.symbol}</div>
                        <div className="text-xs text-slate-500">{asset.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-slate-200">${asset.price}</td>
                  <td className="px-6 py-4">
                    <span className={`flex items-center gap-1 font-medium ${asset.change.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {asset.change.startsWith('+') ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {asset.change}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 rounded-full bg-slate-800 overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${asset.score > 7 ? 'bg-emerald-500' : asset.score > 4 ? 'bg-amber-500' : 'bg-rose-500'}`}
                          style={{ width: `${asset.score * 10}%` }}
                        />
                      </div>
                      <span className="font-mono text-xs text-slate-300">{asset.score}/10</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      asset.sentiment === 'Very Bullish' || asset.sentiment === 'Bullish' 
                        ? 'bg-emerald-500/10 text-emerald-400' 
                        : asset.sentiment === 'Bearish' 
                        ? 'bg-rose-500/10 text-rose-400' 
                        : 'bg-slate-500/10 text-slate-400'
                    }`}>
                      {asset.sentiment}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-cyan-400 transition-colors">
                      <Activity className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};
