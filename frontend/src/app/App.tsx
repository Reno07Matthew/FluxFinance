import React, { useState, useEffect } from 'react';
import { Header } from '@/app/components/Header';
import { Home } from '@/app/components/Home';
import { AnalysisPage } from '@/app/components/AnalysisPage';
import { Markets } from '@/app/components/Markets';
import { Portfolio } from '@/app/components/Portfolio';
import { MarketProvider, useMarket } from '@/context/MarketContext';
import { analyzeAsset } from '@/services/api';

function AppContent() {
  const [currentPage, setCurrentPage] = useState('Home');
  const { data, setData, loading, setLoading, error, setError, symbol, assetType } = useMarket();

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await analyzeAsset(symbol, assetType);
      if ('error' in result) {
        setError(result.error as string);
      } else {
        setData(result);
      }
    } catch {
      setError('Failed to connect to the backend. Make sure the API is running on port 8000.');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (currentPage === 'Analysis') fetchData();
  }, [symbol, assetType, currentPage]);

  const renderContent = () => {
    if (currentPage === 'Home') return <Home onNavigate={setCurrentPage} onAnalyze={fetchData} />;

    if (currentPage === 'Markets') return <Markets onNavigate={setCurrentPage} onAnalyze={fetchData} />;
    if (currentPage === 'Portfolio') return <Portfolio />;

    // Analysis page (loading / error / content)
    if (loading) {
      return (
        <div className="flex items-center justify-center h-72">
          <div className="text-center">
            <div className="relative h-14 w-14 mx-auto mb-4">
              <div className="absolute inset-0 rounded-full border-4 border-slate-800" />
              <div className="absolute inset-0 rounded-full border-4 border-t-cyan-500 animate-spin" />
            </div>
            <p className="text-slate-300 font-medium">Analyzing <span className="text-cyan-400">{symbol}</span>…</p>
            <p className="text-slate-600 text-xs mt-1">Running 7 indicators · FinBERT NLP · Fetching news</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="rounded-xl border border-red-800/60 bg-red-900/10 p-8 text-center max-w-md mx-auto mt-12">
          <div className="text-red-400 text-4xl mb-3">⚠</div>
          <h3 className="text-red-300 font-semibold mb-2">Analysis Failed</h3>
          <p className="text-red-400/80 text-sm mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 transition-colors rounded-lg text-white text-sm font-medium"
          >
            Retry
          </button>
        </div>
      );
    }

    return <AnalysisPage />;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-cyan-500/30 font-sans">
      <Header currentPage={currentPage} onNavigate={setCurrentPage} onAnalyze={fetchData} />
      <main className="container mx-auto px-4 py-8 space-y-6">
        {renderContent()}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <MarketProvider>
      <AppContent />
    </MarketProvider>
  );
}
