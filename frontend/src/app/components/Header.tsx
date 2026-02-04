import React, { useState } from 'react';
import { Search, Bell, User, Menu, Activity, RefreshCw } from 'lucide-react';
import { useMarket } from '@/context/MarketContext';

interface HeaderProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onAnalyze?: () => void;
}

export const Header = ({ currentPage, onNavigate, onAnalyze }: HeaderProps) => {
  const navItems = ['Dashboard', 'Markets', 'Sentiment', 'Technical', 'Risk', 'Portfolio'];
  const { symbol, setSymbol, assetType, setAssetType, loading } = useMarket();
  const [searchValue, setSearchValue] = useState(symbol);

  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setSymbol(searchValue.toUpperCase());
      if (onAnalyze) onAnalyze();
    }
  };

  const handleAnalyzeClick = () => {
    setSymbol(searchValue.toUpperCase());
    if (onAnalyze) onAnalyze();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur supports-[backdrop-filter]:bg-slate-950/60">
      <div className="container mx-auto flex h-16 items-center px-4">
        <div className="mr-4 flex items-center gap-2 lg:mr-6">
          <button className="mr-2 md:hidden text-slate-400 hover:text-slate-100">
            <Menu className="h-6 w-6" />
          </button>
          <Activity className="h-6 w-6 text-cyan-400" />
          <span className="hidden font-bold text-slate-100 lg:inline-block">
            Flux Finance
          </span>
        </div>

        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-400 md:flex">
          {navItems.map((item) => (
            <button
              key={item}
              onClick={() => onNavigate(item)}
              className={`transition-colors hover:text-cyan-400 ${currentPage === item ? 'text-cyan-400' : 'text-slate-400'
                }`}
            >
              {item}
            </button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-4">
          {/* Asset Type Selector */}
          <select
            value={assetType}
            onChange={(e) => setAssetType(e.target.value)}
            className="h-9 rounded-md border border-slate-800 bg-slate-900 px-3 py-1 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none"
          >
            <option value="stock">Stock</option>
            <option value="crypto">Crypto</option>
          </select>

          {/* Search Input */}
          <div className="relative hidden sm:block">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="search"
              placeholder="RELIANCE, INFY, BTC..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value.toUpperCase())}
              onKeyDown={handleSearch}
              className="h-9 w-48 rounded-md border border-slate-800 bg-slate-900 px-9 py-1 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          {/* Analyze Button */}
          <button
            onClick={handleAnalyzeClick}
            disabled={loading}
            className="flex items-center gap-2 h-9 px-4 rounded-md bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>

          <button className="relative size-8 rounded-full hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-cyan-400">
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-cyan-500"></span>
          </button>

          <button className="size-8 rounded-full bg-slate-800 flex items-center justify-center hover:bg-slate-700">
            <User className="h-4 w-4 text-slate-300" />
          </button>
        </div>
      </div>
    </header>
  );
};
