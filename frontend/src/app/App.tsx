import React, { useState, useEffect } from 'react';
import { Header } from '@/app/components/Header';
import { DashboardOverview } from '@/app/components/DashboardOverview';
import { TechnicalChart } from '@/app/components/TechnicalChart';
import { SentimentSection } from '@/app/components/SentimentSection';
import { ComparisonSection } from '@/app/components/ComparisonSection';
import { PortfolioRisk } from '@/app/components/PortfolioRisk';
import { Markets } from '@/app/components/Markets';
import { Portfolio } from '@/app/components/Portfolio';
import { MarketProvider, useMarket } from '@/context/MarketContext';
import { analyzeAsset } from '@/services/api';

function AppContent() {
  const [currentPage, setCurrentPage] = useState('Dashboard');
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
    } catch (err) {
      setError('Failed to connect to backend. Make sure the API is running on port 8000.');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [symbol, assetType]);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
            <p className="text-slate-400">Analyzing {symbol}...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="rounded-xl border border-red-800 bg-red-900/20 p-6 text-center">
          <p className="text-red-400">{error}</p>
          <button
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-white"
          >
            Retry
          </button>
        </div>
      );
    }

    switch (currentPage) {
      case 'Markets':
        return <Markets />;
      case 'Sentiment':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <SentimentSection />
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm flex items-center justify-center">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-slate-100 mb-2">Historical Sentiment</h3>
                  <p className="text-slate-400">Detailed historical sentiment data visualization would appear here.</p>
                </div>
              </div>
            </div>
            <ComparisonSection />
          </div>
        );
      case 'Technical':
        return (
          <div className="space-y-6">
            <TechnicalChart />
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
              <h3 className="text-lg font-semibold text-slate-100 mb-4">Advanced Indicators</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="p-4 bg-slate-800/50 rounded-lg">
                  <div className="text-slate-400 mb-1">MACD (12, 26, 9)</div>
                  <div className="text-emerald-400 font-medium">Bullish Crossover</div>
                </div>
                <div className="p-4 bg-slate-800/50 rounded-lg">
                  <div className="text-slate-400 mb-1">Bollinger Bands (20, 2)</div>
                  <div className="text-slate-200 font-medium">Squeeze Potential</div>
                </div>
                <div className="p-4 bg-slate-800/50 rounded-lg">
                  <div className="text-slate-400 mb-1">Stochastic RSI</div>
                  <div className="text-rose-400 font-medium">
                    {data?.technical?.rsi && data.technical.rsi > 70 ? 'Overbought' :
                      data?.technical?.rsi && data.technical.rsi < 30 ? 'Oversold' : 'Neutral'}
                    ({data?.technical?.rsi?.toFixed(0) || 50})
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'Risk':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <ComparisonSection />
              <PortfolioRisk />
            </div>
          </div>
        );
      case 'Portfolio':
        return <Portfolio />;
      case 'Dashboard':
      default:
        return (
          <>
            {/* Top Overview Cards */}
            <section>
              <DashboardOverview />
            </section>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

              {/* Left Column (Main Analysis) */}
              <div className="space-y-6 lg:col-span-2">
                <section>
                  <TechnicalChart />
                </section>
                <section>
                  <ComparisonSection />
                </section>
              </div>

              {/* Right Column (Insights & Risk) */}
              <div className="space-y-6 lg:col-span-1">
                <section>
                  <SentimentSection />
                </section>
                <section>
                  <PortfolioRisk />
                </section>
              </div>
            </div>
          </>
        );
    }
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
