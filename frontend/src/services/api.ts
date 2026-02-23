import axios from 'axios';

const API_BASE = 'http://127.0.0.1:8000';

export interface AnalysisData {
    symbol: string;
    price: number;
    currency: string;
    is_indian: boolean;
    sentiment: {
        score: number;
        label: string;
    };
    technical: {
        rsi: number;
        signal: string;
        // 7-indicator fields (may be null for crypto/short-history)
        sma_200?: number | null;
        ema_50?: number | null;
        vwap?: number | null;
        supertrend_dir?: number | null; // 1 = Up, -1 = Down
    };
    verdict: {
        // New consensus fields
        verdict: string;     // "STRONG BUY" | "HIGH RISK (AVOID)" | "HOLD / NEUTRAL"
        flux_score: number;
        color: string;
        status: string;
        description: string;
        current_price?: number;
        risk_management?: {
            target_exit_R1: number;
            stop_loss_S1: number;
            pivot: number;
        } | null;
        analysis?: {
            strengths: string[];
            warnings: string[];
        };
        // Legacy fields
        sentiment_score: number;
        rsi_score: number;
    };
    headlines: { title: string; url: string }[];
    history: number[];
}

export interface SearchResult {
    symbol: string;
    name: string;
    type: string;
    exchange: string;
}

export const analyzeAsset = async (symbol: string, type: string = 'stock'): Promise<AnalysisData> => {
    const response = await axios.get(`${API_BASE}/analyze`, {
        params: { symbol, type }
    });
    return response.data;
};

export const searchAssets = async (query: string): Promise<SearchResult[]> => {
    if (!query || query.length < 1) return [];
    const response = await axios.get(`${API_BASE}/search`, {
        params: { q: query }
    });
    return response.data.results;
};

export interface MarketAsset {
    symbol: string;
    name: string;
    price: number;
    change: number;
    currency: string;
    exchange: string;
    type: string;
}

export const getMarkets = async (category: string = 'stock'): Promise<MarketAsset[]> => {
    const response = await axios.get(`${API_BASE}/markets`, {
        params: { category }
    });
    return response.data.assets;
};

export interface PriceData {
    price: number;
    currency: string;
    name: string;
    change: number;
}

export const getPortfolioPrices = async (symbols: string[]): Promise<Record<string, PriceData>> => {
    if (!symbols.length) return {};
    const response = await axios.get(`${API_BASE}/portfolio/prices`, {
        params: { symbols: symbols.join(',') }
    });
    return response.data.prices;
};

export const checkHealth = async () => {
    const response = await axios.get(`${API_BASE}/`);
    return response.data;
};
