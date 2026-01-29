def get_flux_verdict(sentiment_score, rsi):
    """
    Compares Sentiment (Psychology) vs RSI (Reality).
    """
    # 1. HYPE BUBBLE: High Sentiment + Expensive Price
    if sentiment_score > 0.4 and rsi > 70:
        return {"status": "🚨 HYPE WARNING", "color": "red"}
        
    # 2. VALUE BUY: Low Sentiment + Cheap Price
    elif sentiment_score < -0.3 and rsi < 30:
        return {"status": "💎 VALUE OPPORTUNITY", "color": "green"}
        
    # 3. MOMENTUM: Good Sentiment + Normal Price
    elif sentiment_score > 0.2 and (40 < rsi < 70):
        return {"status": "✅ HEALTHY GROWTH", "color": "blue"}
        
    # 4. CRASH: Bad Sentiment + Dropping Price
    elif sentiment_score < -0.2 and rsi < 50:
        return {"status": "📉 BEARISH TREND", "color": "orange"}
        
    else:
        return {"status": "⚖️ MARKET NEUTRAL", "color": "gray"}