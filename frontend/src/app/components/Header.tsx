import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, User, Menu, Activity, RefreshCw } from 'lucide-react';
import { useMarket } from '@/context/MarketContext';
import { searchAssets, SearchResult } from '@/services/api';

interface HeaderProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onAnalyze?: () => void;
}

export const Header = ({ currentPage, onNavigate, onAnalyze }: HeaderProps) => {
  const navItems = ['Home', 'Analysis', 'Markets', 'Portfolio'];
  const { symbol, setSymbol, assetType, setAssetType, loading } = useMarket();
  const [searchValue, setSearchValue] = useState('');
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced search
  useEffect(() => {
    if (!searchValue.trim()) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      try {
        const results = await searchAssets(searchValue);
        setSuggestions(results);
        setShowDropdown(results.length > 0);
        setSelectedIndex(-1);
      } catch {
        setSuggestions([]);
      }
    }, 200);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchValue]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectAsset = (result: SearchResult) => {
    setSymbol(result.symbol);
    setAssetType(result.type);
    setSearchValue('');
    setSuggestions([]);
    setShowDropdown(false);
    onNavigate('Analysis');
    if (onAnalyze) setTimeout(() => onAnalyze(), 50);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || suggestions.length === 0) {
      if (e.key === 'Enter' && searchValue.trim()) {
        setSymbol(searchValue.toUpperCase());
        setSearchValue('');
        setShowDropdown(false);
        onNavigate('Analysis');
        if (onAnalyze) onAnalyze();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        selectAsset(suggestions[selectedIndex]);
      } else if (searchValue.trim()) {
        setSymbol(searchValue.toUpperCase());
        setSearchValue('');
        setShowDropdown(false);
        onNavigate('Analysis');
        if (onAnalyze) onAnalyze();
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  const handleAnalyzeClick = () => {
    if (searchValue.trim()) {
      setSymbol(searchValue.toUpperCase());
      setSearchValue('');
    }
    if (onAnalyze) onAnalyze();
  };

  const getTypeColor = (type: string) => {
    return type === 'crypto' ? 'text-amber-400 bg-amber-500/10' : 'text-cyan-400 bg-cyan-500/10';
  };

  const getExchangeColor = (exchange: string) => {
    switch (exchange) {
      case 'NSE': case 'BSE': return 'text-emerald-400';
      case 'NASDAQ': case 'NYSE': return 'text-blue-400';
      case 'Binance': return 'text-amber-400';
      default: return 'text-slate-400';
    }
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
          {/* Search Input with Dropdown */}
          <div className="relative hidden sm:block" ref={dropdownRef}>
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500 z-10" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search Reliance, Bitcoin, Nifty..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => { if (suggestions.length > 0) setShowDropdown(true); }}
              className="h-9 w-64 rounded-md border border-slate-800 bg-slate-900 px-9 py-1 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />

            {/* Dropdown Suggestions */}
            {showDropdown && suggestions.length > 0 && (
              <div className="absolute top-full left-0 mt-1 w-80 max-h-[320px] overflow-y-auto rounded-lg border border-slate-700 bg-slate-900/95 backdrop-blur-xl shadow-2xl z-[200]">
                <div className="px-3 py-2 border-b border-slate-800">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                    {suggestions.length} result{suggestions.length !== 1 ? 's' : ''} found
                  </span>
                </div>
                {suggestions.map((result, index) => (
                  <button
                    key={result.symbol}
                    onClick={() => selectAsset(result)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${index === selectedIndex
                      ? 'bg-cyan-500/10 border-l-2 border-cyan-400'
                      : 'hover:bg-slate-800/50 border-l-2 border-transparent'
                      }`}
                  >
                    <div className={`flex items-center justify-center w-8 h-8 rounded-md text-xs font-bold ${getTypeColor(result.type)}`}>
                      {result.type === 'crypto' ? '₿' : '📈'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-100">{result.symbol}</span>
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${getExchangeColor(result.exchange)}`}>
                          {result.exchange}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 truncate">{result.name}</div>
                    </div>
                    <div className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${getTypeColor(result.type)}`}>
                      {result.type}
                    </div>
                  </button>
                ))}
              </div>
            )}
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
