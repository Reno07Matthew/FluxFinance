"""
streamer.py — Lightweight real-time price & quick-tech fetcher.
Used by the WebSocket endpoint for low-latency updates.
"""
import yfinance as yf
import ccxt
import pandas as pd
import numpy as np
from datetime import datetime

exchange = ccxt.binance()


def _rsi_latest(close_series: pd.Series, period: int = 14) -> float:
    """Fast RSI calculation returning only the latest value."""
    if len(close_series) < period + 1:
        return 50.0
    delta    = close_series.diff()
    gain     = delta.where(delta > 0, 0.0)
    loss     = -delta.where(delta < 0, 0.0)
    avg_gain = gain.ewm(com=period - 1, adjust=False).mean()
    avg_loss = loss.ewm(com=period - 1, adjust=False).mean()
    rs       = avg_gain / avg_loss.replace(0, np.nan)
    rsi      = 100 - (100 / (1 + rs))
    return round(float(rsi.iloc[-1]), 2)


def _supertrend_dir(df: pd.DataFrame, length: int = 7, mult: float = 3.0) -> int:
    """Returns latest SuperTrend direction: 1 = Up, -1 = Down."""
    try:
        hl2 = (df['High'] + df['Low']) / 2
        tr  = pd.concat([
            df['High'] - df['Low'],
            (df['High'] - df['Close'].shift(1)).abs(),
            (df['Low']  - df['Close'].shift(1)).abs(),
        ], axis=1).max(axis=1)
        atr   = tr.ewm(alpha=1 / length, adjust=False).mean()
        upper = hl2 + mult * atr
        lower = hl2 - mult * atr

        direction = 1
        for i in range(1, len(df)):
            prev_upper = upper.iloc[i - 1]
            prev_lower = lower.iloc[i - 1]
            prev_close = df['Close'].iloc[i - 1]

            upper.iloc[i] = upper.iloc[i] if upper.iloc[i] < prev_upper or prev_close > prev_upper else prev_upper
            lower.iloc[i] = lower.iloc[i] if lower.iloc[i] > prev_lower or prev_close < prev_lower else prev_lower

            if df['Close'].iloc[i] > upper.iloc[i - 1]:
                direction = 1
            elif df['Close'].iloc[i] < lower.iloc[i - 1]:
                direction = -1

        return direction
    except Exception:
        return 0


def get_quick_stock_snapshot(symbol: str, is_indian: bool, yf_symbol: str) -> dict:
    """
    Fetches current price + 5-day history for RSI/SuperTrend.
    Returns a lightweight snapshot dict.
    """
    try:
        ticker = yf.Ticker(yf_symbol)
        hist   = ticker.history(period="30d")

        if hist.empty:
            return {"error": f"No data for {symbol}"}

        current  = float(hist['Close'].iloc[-1])
        prev     = float(hist['Close'].iloc[-2]) if len(hist) >= 2 else current
        change   = round(((current - prev) / prev) * 100, 2) if prev else 0.0
        rsi_val  = _rsi_latest(hist['Close'])
        st_dir   = _supertrend_dir(hist)
        currency = "INR" if is_indian else "USD"

        return {
            "symbol":        symbol,
            "price":         round(current, 2),
            "prev_close":    round(prev, 2),
            "change_pct":    change,
            "currency":      currency,
            "rsi":           rsi_val,
            "supertrend_dir": st_dir,
            "timestamp":     datetime.utcnow().isoformat() + "Z",
        }
    except Exception as e:
        return {"error": str(e)}


def get_quick_crypto_snapshot(symbol: str) -> dict:
    """Fetches latest crypto price from Binance (near real-time)."""
    try:
        pair   = f"{symbol.upper()}/USDT"
        ticker = exchange.fetch_ticker(pair)
        price  = ticker.get('last', 0)
        change = ticker.get('percentage', 0) or 0.0
        return {
            "symbol":        symbol,
            "price":         round(price, 4),
            "prev_close":    round(ticker.get('close', price), 4),
            "change_pct":    round(change, 2),
            "currency":      "USD",
            "rsi":           50,       # Lightweight — skip RSI for crypto ticks
            "supertrend_dir": 0,
            "timestamp":     datetime.utcnow().isoformat() + "Z",
        }
    except Exception as e:
        return {"error": str(e)}
