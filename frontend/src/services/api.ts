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
    };
    verdict: {
        status: string;
        description: string;
        color: string;
        flux_score: number;
        sentiment_score: number;
        rsi_score: number;
    };
    headlines: string[];
    history: number[];
}

export const analyzeAsset = async (symbol: string, type: string = 'stock'): Promise<AnalysisData> => {
    const response = await axios.get(`${API_BASE}/analyze`, {
        params: { symbol, type }
    });
    return response.data;
};

export const checkHealth = async () => {
    const response = await axios.get(`${API_BASE}/`);
    return response.data;
};
