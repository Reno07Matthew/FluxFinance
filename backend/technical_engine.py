import pandas as pd
import numpy as np

def calculate_flux_indicators(df: pd.DataFrame) -> pd.DataFrame:
    """
    Injects the 4 Defense Layers (7 Indicators) into the OHLCV dataframe.
    Requires columns: 'Close', 'High', 'Low', 'Volume'.
    Returns the enriched dataframe with NaN rows dropped.
    """
    df = df.copy()

    # ── LAYER 1: Psychology (Momentum) ──
    # RSI-14 using Wilder's EMA (com=13)
    delta = df['Close'].diff()
    gain = delta.where(delta > 0, 0.0)
    loss = -delta.where(delta < 0, 0.0)
    avg_gain = gain.ewm(com=13, adjust=False).mean()
    avg_loss = loss.ewm(com=13, adjust=False).mean()
    rs = avg_gain / avg_loss.replace(0, np.nan)
    df['RSI'] = 100 - (100 / (1 + rs))

    # ── LAYER 2: Macro Trend (Direction) ──
    df['SMA_200'] = df['Close'].rolling(window=200).mean()
    df['EMA_50']  = df['Close'].ewm(span=50, adjust=False).mean()

    # ── LAYER 3: Institutional Truth (Volume & Volatility) ──
    # VWAP: cumulative (price × volume) / cumulative volume
    typical_price = (df['High'] + df['Low'] + df['Close']) / 3
    df['VWAP'] = (typical_price * df['Volume']).cumsum() / df['Volume'].cumsum()

    # OBV: On-Balance Volume
    obv = [0]
    for i in range(1, len(df)):
        if df['Close'].iloc[i] > df['Close'].iloc[i - 1]:
            obv.append(obv[-1] + df['Volume'].iloc[i])
        elif df['Close'].iloc[i] < df['Close'].iloc[i - 1]:
            obv.append(obv[-1] - df['Volume'].iloc[i])
        else:
            obv.append(obv[-1])
    df['OBV'] = obv

    # SuperTrend (length=7, multiplier=3)
    _calc_supertrend(df, length=7, multiplier=3.0)

    # ── LAYER 4: Risk Management (Pivot Points) ──
    # Yesterday's H/L/C → today's pivot targets
    prev_high  = df['High'].shift(1)
    prev_low   = df['Low'].shift(1)
    prev_close = df['Close'].shift(1)
    df['Pivot'] = (prev_high + prev_low + prev_close) / 3
    df['R1']    = (2 * df['Pivot']) - prev_low    # Target / Exit
    df['S1']    = (2 * df['Pivot']) - prev_high   # Stop-Loss

    # Drop rows with NaN (mostly from the 200-day SMA)
    df.dropna(inplace=True)
    return df


def _calc_supertrend(df: pd.DataFrame, length: int = 7, multiplier: float = 3.0):
    """Calculates SuperTrend in-place. Adds 'SuperTrend_Dir' column (1=Up, -1=Down)."""
    # True Range
    hl  = df['High'] - df['Low']
    hpc = (df['High'] - df['Close'].shift(1)).abs()
    lpc = (df['Low']  - df['Close'].shift(1)).abs()
    tr  = pd.concat([hl, hpc, lpc], axis=1).max(axis=1)

    # ATR via Wilder's smoothing
    atr = tr.ewm(alpha=1 / length, adjust=False).mean()

    hl2       = (df['High'] + df['Low']) / 2
    upper_raw = hl2 + multiplier * atr
    lower_raw = hl2 - multiplier * atr

    upper = upper_raw.copy()
    lower = lower_raw.copy()

    for i in range(length, len(df)):
        upper.iloc[i] = upper_raw.iloc[i] if upper_raw.iloc[i] < upper.iloc[i - 1] or df['Close'].iloc[i - 1] > upper.iloc[i - 1] else upper.iloc[i - 1]
        lower.iloc[i] = lower_raw.iloc[i] if lower_raw.iloc[i] > lower.iloc[i - 1] or df['Close'].iloc[i - 1] < lower.iloc[i - 1] else lower.iloc[i - 1]

    direction = pd.Series(index=df.index, dtype=float)
    for i in range(length, len(df)):
        if df['Close'].iloc[i] > upper.iloc[i - 1]:
            direction.iloc[i] = 1   # Uptrend
        elif df['Close'].iloc[i] < lower.iloc[i - 1]:
            direction.iloc[i] = -1  # Downtrend
        else:
            direction.iloc[i] = direction.iloc[i - 1] if not pd.isna(direction.iloc[i - 1]) else 1

    df['SuperTrend_Dir'] = direction


def calculate_technicals(prices: list) -> dict:
    """
    Legacy helper — used when only a Close prices list is available.
    Returns a basic dict with RSI + signal for backward compatibility.
    """
    if len(prices) < 15:
        return {"rsi": 50, "signal": "Neutral"}

    df = pd.DataFrame(prices, columns=['Close'])
    delta = df['Close'].diff()
    gain  = delta.where(delta > 0, 0.0)
    loss  = -delta.where(delta < 0, 0.0)
    avg_gain = gain.ewm(com=13, adjust=False).mean()
    avg_loss = loss.ewm(com=13, adjust=False).mean()
    rs  = avg_gain / avg_loss.replace(0, np.nan)
    rsi = 100 - (100 / (1 + rs))

    latest_rsi = rsi.iloc[-1]
    signal = "Neutral"
    if latest_rsi > 70: signal = "Overbought"
    elif latest_rsi < 30: signal = "Oversold"

    return {"rsi": round(latest_rsi, 2), "signal": signal}