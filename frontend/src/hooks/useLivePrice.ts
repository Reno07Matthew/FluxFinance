import { useState, useEffect, useRef, useCallback } from 'react';

export interface LivePriceData {
    symbol: string;
    price: number;
    prevClose: number;
    changePct: number;
    currency: string;
    rsi: number;
    superTrendDir: number; // 1 = Up, -1 = Down, 0 = Unknown
    timestamp: string;
    isConnected: boolean;
    priceDirection: 'up' | 'down' | 'flat'; // for flash animation
}

const WS_BASE = 'ws://127.0.0.1:8000';
const RECONNECT_DELAY_MS = 3000;

export function useLivePrice(symbol: string | null, assetType: string = 'stock'): LivePriceData | null {
    const [data, setData] = useState<LivePriceData | null>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const prevPriceRef = useRef<number | null>(null);
    const mountedRef = useRef(true);

    const connect = useCallback(() => {
        if (!symbol || !mountedRef.current) return;

        // Clean up existing connection
        if (wsRef.current) {
            wsRef.current.onclose = null; // prevent reconnect loop
            wsRef.current.close();
        }

        const url = `${WS_BASE}/ws/live/${symbol.toUpperCase()}?type=${assetType}`;
        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
            if (!mountedRef.current) return;
            setData(prev => prev ? { ...prev, isConnected: true } : null);
        };

        ws.onmessage = (event) => {
            if (!mountedRef.current) return;
            try {
                const raw = JSON.parse(event.data as string);
                if (raw.error) {
                    console.warn('[LivePrice]', raw.error);
                    return;
                }

                const newPrice = raw.price as number;
                const prevPrice = prevPriceRef.current;
                const direction: 'up' | 'down' | 'flat' =
                    prevPrice == null ? 'flat' :
                        newPrice > prevPrice ? 'up' :
                            newPrice < prevPrice ? 'down' : 'flat';

                prevPriceRef.current = newPrice;

                setData({
                    symbol: raw.symbol,
                    price: newPrice,
                    prevClose: raw.prev_close,
                    changePct: raw.change_pct,
                    currency: raw.currency,
                    rsi: raw.rsi,
                    superTrendDir: raw.supertrend_dir,
                    timestamp: raw.timestamp,
                    isConnected: true,
                    priceDirection: direction,
                });
            } catch (e) {
                console.error('[LivePrice] parse error', e);
            }
        };

        ws.onerror = () => {
            if (!mountedRef.current) return;
            setData(prev => prev ? { ...prev, isConnected: false } : null);
        };

        ws.onclose = () => {
            if (!mountedRef.current) return;
            setData(prev => prev ? { ...prev, isConnected: false } : null);
            // Auto-reconnect after delay
            reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY_MS);
        };
    }, [symbol, assetType]);

    useEffect(() => {
        mountedRef.current = true;
        prevPriceRef.current = null;
        setData(null);
        connect();

        return () => {
            mountedRef.current = false;
            if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
            if (wsRef.current) {
                wsRef.current.onclose = null;
                wsRef.current.close();
            }
        };
    }, [connect]);

    return data;
}
