import pandas as pd

def calculate_technicals(prices):
    if len(prices) < 15: return {"rsi": 50, "signal": "Neutral"}
    
    df = pd.DataFrame(prices, columns=['close'])
    delta = df['close'].diff()
    
    gain = (delta.where(delta > 0, 0)).ewm(com=13, adjust=False).mean()
    loss = (-delta.where(delta < 0, 0)).ewm(com=13, adjust=False).mean()
    
    rs = gain / loss
    rsi = 100 - (100 / (1 + rs))
    
    latest_rsi = rsi.iloc[-1]
    
    signal = "Neutral"
    if latest_rsi > 70: signal = "Overbought"
    elif latest_rsi < 30: signal = "Oversold"
    
    return {"rsi": round(latest_rsi, 2), "signal": signal}