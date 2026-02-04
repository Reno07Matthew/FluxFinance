import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AnalysisData } from '../services/api';

interface MarketContextType {
    data: AnalysisData | null;
    setData: (data: AnalysisData | null) => void;
    loading: boolean;
    setLoading: (loading: boolean) => void;
    error: string | null;
    setError: (error: string | null) => void;
    symbol: string;
    setSymbol: (symbol: string) => void;
    assetType: string;
    setAssetType: (type: string) => void;
}

const MarketContext = createContext<MarketContextType | undefined>(undefined);

export const MarketProvider = ({ children }: { children: ReactNode }) => {
    const [data, setData] = useState<AnalysisData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [symbol, setSymbol] = useState('RELIANCE');
    const [assetType, setAssetType] = useState('stock');

    return (
        <MarketContext.Provider value={{
            data, setData,
            loading, setLoading,
            error, setError,
            symbol, setSymbol,
            assetType, setAssetType
        }}>
            {children}
        </MarketContext.Provider>
    );
};

export const useMarket = () => {
    const context = useContext(MarketContext);
    if (!context) {
        throw new Error('useMarket must be used within MarketProvider');
    }
    return context;
};
