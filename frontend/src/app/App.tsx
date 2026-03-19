import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search, Sun, Moon, LogOut, User, ChevronDown,
  LayoutDashboard, LineChart, Briefcase, BookOpen, Settings,
  ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { MarketProvider, useMarket } from '@/context/MarketContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { searchAssets, SearchResult, analyzeAsset } from '@/services/api';
import { BloombergDashboard } from '@/app/components/BloombergDashboard';
import { AnalysisPage } from '@/app/components/AnalysisPage';
import { Markets } from '@/app/components/Markets';
import { Portfolio } from '@/app/components/Portfolio';
import { AuthPage } from '@/app/components/AuthPage';

/* ═══════════════════════════════════════════════════════════════════════════
   SIDEBAR NAVIGATION  (80px narrow, icon-only)
   ═══════════════════════════════════════════════════════════════════════════ */

const sidebarItems = [
  { id: 'Home', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'Analysis', icon: LineChart, label: 'Screener' },
  { id: 'Markets', icon: BookOpen, label: 'Markets' },
  { id: 'Portfolio', icon: Briefcase, label: 'Portfolio' },
];

function Sidebar({ currentPage, onNavigate }: { currentPage: string; onNavigate: (p: string) => void }) {
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();

  return (
    <aside className="hidden md:flex fixed top-0 left-0 bottom-0 w-20 flex-col items-center bg-bg-card border-r border-border z-50"
      role="navigation" aria-label="Main navigation">

      {/* Logo */}
      <div className="flex items-center justify-center h-16 w-full">
        <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center">
          <span className="text-sm font-bold text-white tracking-tight">F</span>
        </div>
      </div>

      {/* Nav Icons */}
      <div className="flex-1 flex flex-col items-center gap-1 pt-4 w-full">
        {sidebarItems.map(item => {
          const active = currentPage === item.id;
          const Icon = item.icon;
          return (
            <button key={item.id} onClick={() => onNavigate(item.id)}
              className={`group relative w-full flex items-center justify-center h-12 transition-all duration-200
                ${active ? 'bg-white/5 text-white border-l-2 border-white' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5 border-l-2 border-transparent'}`}
              aria-current={active ? 'page' : undefined} aria-label={item.label}>
              <Icon className="h-5 w-5" strokeWidth={1.5} />
              {/* Tooltip */}
              <span className="absolute left-full ml-3 px-2 py-1 rounded-md bg-[#1f1f23] text-white text-xs font-medium
                opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 border border-[#27272a]" aria-hidden="true">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Bottom actions */}
      <div className="flex flex-col items-center gap-2 pb-5 w-full px-3">
        {/* Theme toggle */}
        <button onClick={toggleTheme}
          className="w-full flex items-center justify-center h-11 rounded-xl text-text-disabled hover:text-text-secondary hover:bg-bg-hover transition-colors"
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
          {theme === 'dark' ? <Sun className="h-4.5 w-4.5" strokeWidth={1.5} /> : <Moon className="h-4.5 w-4.5" strokeWidth={1.5} />}
        </button>

        {/* Settings */}
        <button className="w-full flex items-center justify-center h-11 rounded-xl text-text-disabled hover:text-text-secondary hover:bg-bg-hover transition-colors"
          aria-label="Settings">
          <Settings className="h-4.5 w-4.5" strokeWidth={1.5} />
        </button>

        {/* User */}
        {user ? (
          <button onClick={signOut}
            className="w-full flex items-center justify-center h-11 rounded-xl hover:bg-danger/10 text-text-disabled hover:text-danger transition-colors"
            aria-label="Sign out">
            <LogOut className="h-4.5 w-4.5" strokeWidth={1.5} />
          </button>
        ) : (
          <button onClick={() => onNavigate('Portfolio')}
            className="w-full flex items-center justify-center h-11 rounded-xl bg-accent/15 text-accent hover:bg-accent/25 transition-colors"
            aria-label="Sign in">
            <User className="h-4.5 w-4.5" strokeWidth={1.5} />
          </button>
        )}
      </div>
    </aside>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   TOP MICRO-STATS BAR  (40px, live indices strip)
   ═══════════════════════════════════════════════════════════════════════════ */

function MicroStatsBar() {
  const items = [
    { label: 'Nifty 50', value: '23,465', pct: '+1.42', up: true },
    { label: 'Sensex', value: '77,301', pct: '-0.51', up: false },
    { label: 'Bank Nifty', value: '49,888', pct: '+0.87', up: true },
    { label: 'Flux Engine', value: 'Active', pct: '', up: true, badge: true },
  ];

  return (
    <div className="h-10 flex items-center gap-5 px-6 bg-bg-card/60 border-b border-border overflow-x-auto text-xs" role="status">
      {items.map(item => (
        <div key={item.label} className="flex items-center gap-2 whitespace-nowrap shrink-0">
          <span className="text-text-disabled font-medium">{item.label}:</span>
          {item.badge ? (
            <span className="flex items-center gap-1 text-success font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" aria-hidden="true" />
              {item.value}
            </span>
          ) : (
            <>
              <span className="font-mono-num text-text-primary font-medium">{item.value}</span>
              <span className={`flex items-center gap-0.5 font-semibold font-mono-num ${item.up ? 'text-success' : 'text-danger'}`}>
                {item.up ? <ArrowUpRight className="h-3 w-3" strokeWidth={2} /> : <ArrowDownRight className="h-3 w-3" strokeWidth={2} />}
                {item.pct}%
              </span>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PAGE HEADER (Title + Search + CTA)
   ═══════════════════════════════════════════════════════════════════════════ */

function PageHeader({ page, onNavigate, onAnalyze }: { page: string; onNavigate: (p: string) => void; onAnalyze: () => void }) {
  const { symbol, setSymbol, setAssetType } = useMarket();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [selIdx, setSelIdx] = useState(-1);
  const boxRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const titles: Record<string, string> = { Home: 'Flux Overview', Markets: 'Markets', Portfolio: 'Portfolio', Analysis: 'Analysis' };

  useEffect(() => {
    if (!search.trim()) { setResults([]); setOpen(false); return; }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try { const r = await searchAssets(search); setResults(r); setOpen(r.length > 0); setSelIdx(-1); }
      catch { setResults([]); }
    }, 200);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [search]);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const pick = (r: SearchResult) => {
    setSymbol(r.symbol); setAssetType(r.type);
    setSearch(''); setOpen(false);
    onNavigate('Analysis'); setTimeout(onAnalyze, 50);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (!open || !results.length) {
      if (e.key === 'Enter' && search.trim()) {
        setSymbol(search.toUpperCase()); setSearch(''); setOpen(false);
        onNavigate('Analysis'); onAnalyze();
      }
      return;
    }
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelIdx(p => Math.min(p + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSelIdx(p => Math.max(p - 1, -1)); }
    else if (e.key === 'Enter') { e.preventDefault(); if (selIdx >= 0) pick(results[selIdx]); }
    else if (e.key === 'Escape') setOpen(false);
  };

  return (
    <div className="flex items-center justify-between gap-4 px-6 sm:px-8 py-3">
      <h1 className="text-2xl sm:text-3xl font-bold text-text-primary shrink-0">{titles[page] || page}</h1>
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative hidden sm:block" ref={boxRef}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-disabled" strokeWidth={1.5} aria-hidden="true" />
          <input type="search" value={search} onChange={e => setSearch(e.target.value)} onKeyDown={onKey}
            onFocus={() => { if (results.length) setOpen(true); }}
            placeholder="Search stocks..."
            aria-label="Search stocks, ETFs, and market indices"
            className="h-10 w-72 rounded-lg border border-border bg-bg-card pl-10 pr-16 text-sm text-text-primary placeholder:text-text-disabled
              focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-colors" />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden lg:inline-flex h-5 items-center px-1.5
            rounded border border-border bg-bg-elevated text-[10px] font-mono-num text-text-disabled" aria-hidden="true">⌘K</kbd>

          <AnimatePresence>
            {open && results.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }} transition={{ duration: 0.15 }}
                className="absolute top-full left-0 mt-1.5 w-full max-h-64 overflow-y-auto rounded-xl border border-border bg-bg-card shadow-2xl z-[200]"
                role="listbox" aria-label="Search results">
                {results.map((r, i) => (
                  <button key={r.symbol} role="option" aria-selected={i === selIdx}
                    onClick={() => pick(r)} onMouseEnter={() => setSelIdx(i)}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-sm min-h-[44px] transition-colors
                      ${i === selIdx ? 'bg-bg-hover text-text-primary' : 'text-text-secondary hover:bg-bg-hover'}`}>
                    <div className="flex items-center gap-2.5">
                      <span className="font-semibold text-text-primary">{r.symbol}</span>
                      <span className="text-text-tertiary text-xs truncate">{r.name}</span>
                    </div>
                    <span className="text-[10px] text-text-disabled font-medium">{r.exchange}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* CTA */}
        {page === 'Home' && !user && (
          <button onClick={() => onNavigate('Portfolio')}
            className="hidden sm:flex items-center gap-2 h-10 px-4 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors">
            Connect Portfolio
          </button>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   APP CONTENT
   ═══════════════════════════════════════════════════════════════════════════ */

function AppContent() {
  const [page, setPage] = useState('Home');
  const { data, setData, loading, setLoading, error, setError, symbol, assetType } = useMarket();
  const { user, loading: authLoading } = useAuth();

  const fetchData = async () => {
    setLoading(true); setError(null);
    try {
      const r = await analyzeAsset(symbol, assetType);
      if ('error' in r) setError(r.error as string);
      else setData(r);
    } catch { setError('Failed to connect to backend.'); }
    setLoading(false);
  };

  useEffect(() => { if (page === 'Analysis') fetchData(); }, [symbol, assetType, page]);
  const goAnalyze = () => { setPage('Analysis'); setTimeout(fetchData, 50); };

  const renderContent = () => {
    if (page === 'Home') return <BloombergDashboard onNavigate={setPage} onAnalyze={goAnalyze} />;
    if (page === 'Markets') return <Markets onNavigate={setPage} onAnalyze={fetchData} />;
    if (page === 'Portfolio') {
      if (authLoading) return <Spinner label="Loading..." />;
      if (!user) return <AuthPage />;
      return <Portfolio />;
    }
    if (loading) return <Spinner label={`Analyzing ${symbol}…`} sub="Running 7 indicators · FinBERT NLP" />;
    if (error) return (
      <div className="rounded-xl border border-danger/30 bg-danger/5 p-6 text-center max-w-sm mx-auto mt-16">
        <p className="text-sm text-danger font-medium mb-1">Analysis Failed</p>
        <p className="text-xs text-danger/60 mb-4">{error}</p>
        <button onClick={fetchData} className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors min-h-[44px]">Retry</button>
      </div>
    );
    return <AnalysisPage />;
  };

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary font-sans transition-colors duration-200">
      <a href="#main-content" className="skip-nav">Skip to main content</a>

      {/* Sidebar (desktop) */}
      <Sidebar currentPage={page} onNavigate={setPage} />

      {/* Main Area */}
      <div className="md:ml-20 flex flex-col min-h-screen">
        <MicroStatsBar />
        <PageHeader page={page} onNavigate={setPage} onAnalyze={goAnalyze} />

        <main id="main-content" className="flex-1 px-6 sm:px-8 pb-24 md:pb-8" role="main">
          {renderContent()}
        </main>

        <Footer />
      </div>

      {/* Mobile Bottom Nav */}
      <MobileBottomNav currentPage={page} onNavigate={setPage} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SPINNER
   ═══════════════════════════════════════════════════════════════════════════ */

function Spinner({ label, sub }: { label: string; sub?: string }) {
  return (
    <div className="flex items-center justify-center h-64" role="status" aria-label={label}>
      <div className="text-center">
        <div className="relative h-10 w-10 mx-auto mb-3">
          <div className="absolute inset-0 rounded-full border-2 border-border" />
          <div className="absolute inset-0 rounded-full border-2 border-t-accent animate-spin" />
        </div>
        <p className="text-sm text-text-secondary">{label}</p>
        {sub && <p className="text-xs text-text-disabled mt-1">{sub}</p>}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MOBILE BOTTOM NAV
   ═══════════════════════════════════════════════════════════════════════════ */

function MobileBottomNav({ currentPage, onNavigate }: { currentPage: string; onNavigate: (p: string) => void }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-border bg-bg-primary/95 backdrop-blur-xl"
      role="navigation" aria-label="Mobile navigation">
      <div className="flex items-center justify-around h-16">
        {sidebarItems.map(item => {
          const active = currentPage === item.id;
          const Icon = item.icon;
          return (
            <button key={item.id} onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center justify-center gap-0.5 min-h-[44px] min-w-[44px] px-3 transition-colors
                ${active ? 'text-accent' : 'text-text-disabled hover:text-text-tertiary'}`}
              aria-label={item.label} aria-current={active ? 'page' : undefined}>
              <Icon className="h-5 w-5" strokeWidth={1.5} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   FOOTER
   ═══════════════════════════════════════════════════════════════════════════ */

function Footer() {
  return (
    <footer className="hidden md:block border-t border-border" role="contentinfo">
      <div className="px-8 py-5">
        <div className="flex items-center justify-between text-xs text-text-disabled">
          <div className="flex items-center gap-5">
            <span className="font-semibold text-text-tertiary">Flux<span className="font-normal">Finance</span></span>
            <a href="#" className="hover:text-text-tertiary transition-colors">About</a>
            <a href="#" className="hover:text-text-tertiary transition-colors">API</a>
            <a href="#" className="hover:text-text-tertiary transition-colors">Terms</a>
            <a href="#" className="hover:text-text-tertiary transition-colors">Privacy</a>
          </div>
          <p className="text-[10px]">© 2026 Flux Finance. Not financial advice.</p>
        </div>
      </div>
    </footer>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ROOT
   ═══════════════════════════════════════════════════════════════════════════ */

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MarketProvider>
          <AppContent />
        </MarketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
