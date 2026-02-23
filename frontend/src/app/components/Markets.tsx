import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { TrendingUp, TrendingDown, Activity, RefreshCw, BarChart3, Zap } from 'lucide-react';
import { getMarkets, MarketAsset } from '@/services/api';
import { useMarket } from '@/context/MarketContext';

interface MarketsProps {
  onNavigate?: (page: string) => void;
  onAnalyze?: () => void;
}

export const Markets = ({ onNavigate, onAnalyze }: MarketsProps) => {
  const [category, setCategory] = useState<'stock' | 'crypto'>('stock');
  const [assets, setAssets] = useState<MarketAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const { setSymbol, setAssetType } = useMarket();

  const fetchMarkets = async () => {
    setLoading(true);
    try {
      const data = await getMarkets(category);
      setAssets(data);
    } catch (err) {
      console.error('Failed to fetch markets:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMarkets();
  }, [category]);

  const handleAssetClick = (asset: MarketAsset) => {
    setSymbol(asset.symbol);
    setAssetType(asset.type === 'crypto' ? 'crypto' : 'stock');
    if (onNavigate) onNavigate('Analysis');
    // small delay lets React commit the symbol state before fetch fires
    if (onAnalyze) setTimeout(() => onAnalyze(), 50);
  };

  // Separate indices, gainers and losers
  const indices = assets.filter(a => a.type === 'index');
  const nonIndex = assets.filter(a => a.type !== 'index');
  const gainers = [...nonIndex].filter(a => a.change > 0).sort((a, b) => b.change - a.change);
  const losers = [...nonIndex].filter(a => a.change < 0).sort((a, b) => a.change - b.change);
  const allStocks = [...nonIndex].sort((a, b) => a.symbol.localeCompare(b.symbol));

  const formatPrice = (price: number, currency: string) => {
    const sym = currency === 'INR' ? '₹' : '$';
    return `${sym}${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const AssetRow = ({ asset, index }: { asset: MarketAsset; index: number }) => (
    <motion.tr
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="hover:bg-slate-800/50 transition-colors cursor-pointer group"
      onClick={() => handleAssetClick(asset)}
    >
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold ${asset.change > 0 ? 'bg-emerald-500/10 text-emerald-400' :
            asset.change < 0 ? 'bg-rose-500/10 text-rose-400' :
              'bg-slate-700 text-slate-300'
            }`}>
            {asset.type === 'crypto' ? '₿' : asset.symbol.slice(0, 2)}
          </div>
          <div>
            <div className="font-semibold text-slate-100 group-hover:text-cyan-400 transition-colors">{asset.symbol}</div>
            <div className="text-xs text-slate-500">{asset.name}</div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3.5 font-mono text-sm text-slate-200">
        {formatPrice(asset.price, asset.currency)}
      </td>
      <td className="px-4 py-3.5">
        <span className={`inline-flex items-center gap-1 font-semibold text-sm ${asset.change > 0 ? 'text-emerald-400' : asset.change < 0 ? 'text-rose-400' : 'text-slate-400'
          }`}>
          {asset.change > 0 ? <TrendingUp className="h-3.5 w-3.5" /> : asset.change < 0 ? <TrendingDown className="h-3.5 w-3.5" /> : null}
          {asset.change > 0 ? '+' : ''}{asset.change.toFixed(2)}%
        </span>
      </td>
      <td className="px-4 py-3.5">
        <span className={`text-[10px] font-medium px-2 py-1 rounded-full ${asset.exchange === 'NSE' || asset.exchange === 'BSE' ? 'bg-emerald-500/10 text-emerald-400' :
          asset.exchange === 'Binance' ? 'bg-amber-500/10 text-amber-400' :
            'bg-slate-700 text-slate-400'
          }`}>
          {asset.exchange}
        </span>
      </td>
      <td className="px-4 py-3.5 text-right">
        <button className="rounded-lg p-1.5 text-slate-500 hover:bg-cyan-500/10 hover:text-cyan-400 transition-colors">
          <Activity className="h-4 w-4" />
        </button>
      </td>
    </motion.tr>
  );

  const TableHeader = () => (
    <thead className="bg-slate-950/80 text-[10px] uppercase tracking-wider text-slate-500">
      <tr>
        <th className="px-4 py-3 font-semibold text-left">Asset</th>
        <th className="px-4 py-3 font-semibold text-left">Price</th>
        <th className="px-4 py-3 font-semibold text-left">24h Change</th>
        <th className="px-4 py-3 font-semibold text-left">Exchange</th>
        <th className="px-4 py-3 font-semibold text-right">Analyze</th>
      </tr>
    </thead>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Indian Market Overview</h2>
          <p className="text-sm text-slate-400">Live prices and daily performance</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Stock / Crypto Toggle */}
          <div className="flex rounded-lg border border-slate-700 bg-slate-900 p-1">
            <button
              onClick={() => setCategory('stock')}
              className={`flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition-all ${category === 'stock'
                ? 'bg-cyan-500/15 text-cyan-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
                }`}
            >
              <BarChart3 className="h-4 w-4" />
              Stocks
            </button>
            <button
              onClick={() => setCategory('crypto')}
              className={`flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition-all ${category === 'crypto'
                ? 'bg-amber-500/15 text-amber-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
                }`}
            >
              <Zap className="h-4 w-4" />
              Crypto
            </button>
          </div>

          <button
            onClick={fetchMarkets}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-400 hover:text-cyan-400 hover:border-cyan-500/50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-500 mx-auto mb-3"></div>
            <p className="text-slate-400 text-sm">Fetching {category === 'crypto' ? 'crypto' : 'Indian market'} prices...</p>
          </div>
        </div>
      )}

      {!loading && assets.length === 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-12 text-center">
          <p className="text-slate-400">No market data available. Try refreshing.</p>
        </div>
      )}

      {!loading && assets.length > 0 && (
        <>
          {/* Indices Section (only for stocks) */}
          {category === 'stock' && indices.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400"></span>
                Indian Indices
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {indices.map((idx, i) => (
                  <motion.div
                    key={idx.symbol}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-sm hover:border-cyan-500/30 transition-all cursor-pointer group"
                    onClick={() => handleAssetClick(idx)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-400 group-hover:text-cyan-400 transition-colors">{idx.name}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${idx.change > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                        }`}>
                        {idx.change > 0 ? '▲' : '▼'} {Math.abs(idx.change).toFixed(2)}%
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-slate-100">
                      ₹{idx.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Top 5 Gainers */}
          {gainers.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-emerald-400 mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Top Gainers ({gainers.length})
              </h3>
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                  <TableHeader />
                  <tbody className="divide-y divide-slate-800/50">
                    {gainers.map((asset, i) => (
                      <AssetRow key={asset.symbol} asset={asset} index={i} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Top 5 Losers */}
          {losers.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-rose-400 mb-3 flex items-center gap-2">
                <TrendingDown className="h-4 w-4" />
                Top Losers ({losers.length})
              </h3>
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                  <TableHeader />
                  <tbody className="divide-y divide-slate-800/50">
                    {losers.map((asset, i) => (
                      <AssetRow key={asset.symbol} asset={asset} index={i} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {/* All Stocks Table */}
          {allStocks.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                All {category === 'crypto' ? 'Crypto' : 'Stocks'} ({allStocks.length})
              </h3>
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                  <TableHeader />
                  <tbody className="divide-y divide-slate-800/50">
                    {allStocks.map((asset, i) => (
                      <AssetRow key={asset.symbol} asset={asset} index={i} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
};
