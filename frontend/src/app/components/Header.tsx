import React, { useState, useEffect, useRef } from 'react';
import { Search, Sun, Moon, GraduationCap, Menu, Activity, RefreshCw, LogOut, ChevronDown, User, X, BookOpen, Brain, Calculator, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';
import { useMarket } from '@/context/MarketContext';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { searchAssets, SearchResult } from '@/services/api';
import { AnimatePresence, motion } from 'motion/react';

interface HeaderProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onAnalyze?: () => void;
}

// ─── Academy Overlay ─────────────────────────────────────────────────────────
const AcademyOverlay = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const steps = [
    {
      icon: <Brain className="h-6 w-6" strokeWidth={1.5} />,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-50 dark:bg-purple-500/10',
      border: 'border-purple-200 dark:border-purple-500/20',
      title: 'Understanding AI Sentiment',
      subtitle: 'How FinBERT reads the market pulse',
      content: [
        'Our AI engine uses FinBERT, a financial language model developed by Hugging Face, to analyze real-time news headlines about your selected asset.',
        'The sentiment score ranges from -1.0 (Extreme Fear) to +1.0 (Extreme Greed). A score above +0.15 signals bullish news flow, while below -0.15 signals bearish coverage.',
        'Important: AI sentiment is one signal among seven. It captures market narrative, not market reality.',
      ],
    },
    {
      icon: <Calculator className="h-6 w-6" strokeWidth={1.5} />,
      color: 'text-cyan-600 dark:text-cyan-400',
      bg: 'bg-cyan-50 dark:bg-cyan-500/10',
      border: 'border-cyan-200 dark:border-cyan-500/20',
      title: 'The Math Veto',
      subtitle: 'Why we contradict the news',
      content: [
        'News can be manipulated. Numbers can\'t. Our 7 technical indicators act as a "Math Veto" — if the numbers disagree with the sentiment, the math wins.',
        'For example: If FinBERT screams "Bullish" but RSI shows overbought (>70), SMA-200 shows bearish crossover, and SuperTrend is down — the Flux Verdict will override sentiment with a cautious rating.',
        'This consensus engine protects retail investors from hype-driven decisions.',
      ],
    },
    {
      icon: <ShieldCheck className="h-6 w-6" strokeWidth={1.5} />,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-500/10',
      border: 'border-emerald-200 dark:border-emerald-500/20',
      title: 'Risk Management',
      subtitle: 'Your automated safety net',
      content: [
        'Every analysis includes auto-calculated Pivot Points using the classic floor pivot formula. These give you three critical price levels:',
        '• Pivot Point — The equilibrium. Price above = bullish bias, below = bearish bias.',
        '• Target Exit (R1) — The first resistance level. Consider taking partial profits here.',
        '• Stop Loss (S1) — The first support level. If price breaks below, the thesis may be invalidated.',
      ],
    },
  ];

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
          />
          {/* Sidebar */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-[101] w-full max-w-lg overflow-y-auto 
                       bg-white dark:bg-zinc-900 border-l border-slate-200 dark:border-white/10 shadow-2xl"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-5 
                            bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-slate-100 dark:bg-white/5">
                  <GraduationCap className="h-5 w-5 text-slate-700 dark:text-white" strokeWidth={1.5} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Flux Academy</h2>
                  <p className="text-xs text-slate-500 dark:text-zinc-500">How to read this dashboard</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 dark:text-zinc-500 transition-colors"
              >
                <X className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </div>

            {/* Intro */}
            <div className="px-6 pt-6 pb-2">
              <div className="rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-white/5 dark:to-white/[0.02] border border-slate-200 dark:border-white/10 p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-amber-500" strokeWidth={1.5} />
                  <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">For New Investors</span>
                </div>
                <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
                  Flux Finance combines AI-powered news analysis with 7 battle-tested technical indicators to give you 
                  one single, trustworthy verdict — no finance degree required.
                </p>
              </div>
            </div>

            {/* Steps */}
            <div className="px-6 py-4 space-y-4">
              {steps.map((step, i) => (
                <div key={i} className={`rounded-xl border ${step.border} p-5`}>
                  <div className="flex items-start gap-4">
                    <div className={`flex items-center justify-center h-10 w-10 rounded-xl ${step.bg} shrink-0`}>
                      <span className={step.color}>{step.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-600 uppercase tracking-widest">Step {i + 1}</span>
                      </div>
                      <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-0.5">{step.title}</h3>
                      <p className="text-xs text-slate-500 dark:text-zinc-500 mb-3">{step.subtitle}</p>
                      <div className="space-y-2">
                        {step.content.map((para, j) => (
                          <p key={j} className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">{para}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-6 py-6 border-t border-slate-200 dark:border-white/10">
              <button
                onClick={onClose}
                className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-semibold 
                           hover:bg-slate-800 dark:hover:bg-zinc-100 transition-colors"
              >
                Start Analyzing <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

// ─── Header ──────────────────────────────────────────────────────────────────
export const Header = ({ currentPage, onNavigate, onAnalyze }: HeaderProps) => {
  const navItems = ['Home', 'Analysis', 'Markets', 'Portfolio'];
  const { symbol, setSymbol, assetType, setAssetType, loading } = useMarket();
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [searchValue, setSearchValue] = useState('');
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [academyOpen, setAcademyOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
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
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchValue]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setShowDropdown(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setShowUserMenu(false);
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
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(prev => Math.max(prev - 1, -1)); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) selectAsset(suggestions[selectedIndex]);
      else if (searchValue.trim()) { setSymbol(searchValue.toUpperCase()); setSearchValue(''); setShowDropdown(false); onNavigate('Analysis'); if (onAnalyze) onAnalyze(); }
    } else if (e.key === 'Escape') setShowDropdown(false);
  };

  const getTypeColor = (type: string) => type === 'crypto' ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10' : 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-500/10';
  const getExchangeColor = (exchange: string) => {
    switch (exchange) {
      case 'NSE': case 'BSE': return 'text-emerald-600 dark:text-emerald-400';
      case 'NASDAQ': case 'NYSE': return 'text-blue-600 dark:text-blue-400';
      case 'Binance': return 'text-amber-600 dark:text-amber-400';
      default: return 'text-slate-500 dark:text-zinc-400';
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-white/10 
                          bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-zinc-950/60">
        <div className="container mx-auto flex h-14 items-center gap-4 px-4">

          {/* LEFT: Logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button className="mr-1 md:hidden text-slate-400 dark:text-zinc-500 hover:text-slate-900 dark:hover:text-white">
              <Menu className="h-5 w-5" strokeWidth={1.5} />
            </button>
            <div className="h-7 w-7 rounded-lg bg-slate-900 dark:bg-white flex items-center justify-center">
              <Activity className="h-4 w-4 text-white dark:text-zinc-900" strokeWidth={1.5} />
            </div>
            <span className="hidden font-semibold text-slate-900 dark:text-white lg:inline-block text-[15px] tracking-tight">
              Flux Finance
            </span>
          </div>

          {/* NAV */}
          <nav className="hidden items-center gap-1 text-sm md:flex">
            {navItems.map((item) => (
              <button
                key={item}
                onClick={() => onNavigate(item)}
                className={`px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors
                  ${currentPage === item
                    ? 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white'
                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5'
                  }`}
              >
                {item}
              </button>
            ))}
          </nav>

          {/* CENTER: Search */}
          <div className="flex-1 flex justify-center" ref={dropdownRef}>
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-zinc-500 z-10" strokeWidth={1.5} />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search RELIANCE.NS, BTC, NIFTY..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => { if (suggestions.length > 0) setShowDropdown(true); }}
                className="h-9 w-full rounded-lg border border-slate-200 dark:border-white/10 
                           bg-slate-50 dark:bg-white/5 px-9 py-1 text-sm text-slate-900 dark:text-white 
                           placeholder:text-slate-400 dark:placeholder:text-zinc-500 
                           focus:border-slate-400 dark:focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-slate-400/20 dark:focus:ring-white/10
                           transition-colors"
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex h-5 items-center gap-1 rounded border 
                              border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 px-1.5 text-[10px] font-medium text-slate-400 dark:text-zinc-500">
                ⌘K
              </kbd>

              {/* Dropdown */}
              {showDropdown && suggestions.length > 0 && (
                <div className="absolute top-full left-0 mt-1.5 w-full max-h-[320px] overflow-y-auto rounded-xl border 
                                border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-900 shadow-xl dark:shadow-2xl z-[200]">
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-white/5">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-zinc-500 font-semibold">
                      {suggestions.length} result{suggestions.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {suggestions.map((result, index) => (
                    <button
                      key={result.symbol}
                      onClick={() => selectAsset(result)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors
                        ${index === selectedIndex
                          ? 'bg-slate-50 dark:bg-white/5 border-l-2 border-slate-900 dark:border-white'
                          : 'hover:bg-slate-50 dark:hover:bg-white/5 border-l-2 border-transparent'
                        }`}
                    >
                      <div className={`flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold ${getTypeColor(result.type)}`}>
                        {result.type === 'crypto' ? '₿' : '📈'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-slate-900 dark:text-white">{result.symbol}</span>
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${getExchangeColor(result.exchange)}`}>
                            {result.exchange}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-zinc-400 truncate">{result.name}</div>
                      </div>
                      <div className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${getTypeColor(result.type)}`}>
                        {result.type}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Analyze */}
            <button
              onClick={() => { if (searchValue.trim()) { setSymbol(searchValue.toUpperCase()); setSearchValue(''); } if (onAnalyze) onAnalyze(); }}
              disabled={loading}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-semibold 
                         hover:bg-slate-800 dark:hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} strokeWidth={1.5} />
              {loading ? 'Analyzing…' : 'Analyze'}
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 dark:text-zinc-400 transition-colors"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" strokeWidth={1.5} /> : <Moon className="h-4 w-4" strokeWidth={1.5} />}
            </button>

            {/* Academy Button */}
            <button
              onClick={() => setAcademyOpen(true)}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-slate-200 dark:border-white/10 
                         text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-white/5 text-xs font-medium transition-colors"
            >
              <GraduationCap className="h-4 w-4" strokeWidth={1.5} />
              <span className="hidden sm:inline">Academy</span>
            </button>

            {/* User Menu */}
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-1.5 h-8 px-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                >
                  <div className="h-6 w-6 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-white text-[10px] font-bold">
                    {user.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <ChevronDown className={`h-3 w-3 text-slate-400 dark:text-zinc-500 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} strokeWidth={1.5} />
                </button>
                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-900 shadow-xl z-[200] py-1">
                    <div className="px-4 py-3 border-b border-slate-100 dark:border-white/5">
                      <p className="text-[10px] text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-0.5">Signed in</p>
                      <p className="text-sm text-slate-900 dark:text-white font-medium truncate">{user.email}</p>
                    </div>
                    <button
                      onClick={() => { signOut(); setShowUserMenu(false); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                    >
                      <LogOut className="h-4 w-4" strokeWidth={1.5} /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => onNavigate('Portfolio')}
                className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-slate-200 dark:border-white/10 
                           text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-white/5 text-xs font-medium transition-colors"
              >
                <User className="h-4 w-4" strokeWidth={1.5} /> Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Academy Overlay */}
      <AcademyOverlay open={academyOpen} onClose={() => setAcademyOpen(false)} />
    </>
  );
};
