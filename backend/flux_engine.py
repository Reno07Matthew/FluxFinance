def calculate_flux_verdict(sentiment_score, sentiment_label, rsi_value):
    """
    The Core Logic of Flux Finance.
    Returns:
      - sentiment_score: The raw AI score (-1 to 1)
      - rsi_score: The raw RSI (0 to 100)
      - flux_score: The calculated 'Hype/Risk' score (0 to 100)
    """
    
    # --- 1. DEFINING THE THRESHOLDS ---
    SENTIMENT_HIGH = 0.4
    SENTIMENT_LOW = -0.4
    
    RSI_OVERBOUGHT = 70
    RSI_OVERSOLD = 30
    RSI_NEUTRAL_LOW = 40

    # Default Verdict (Neutral)
    # flux_score of 50 means "No strong signal"
    verdict = {
        "status": "⚖️ MARKET NEUTRAL",
        "description": "Market is undecided. No strong signal.",
        "color": "gray",
        "flux_score": 50,
        
        # Pass-through values for easier UI access
        "sentiment_score": round(sentiment_score, 2),
        "rsi_score": round(rsi_value, 2)
    }
    
    # --- 2. THE LOGIC TREE ---
    
    # 1. HYPE BUBBLE (High Risk) 🚨
    if sentiment_score > SENTIMENT_HIGH and rsi_value > RSI_OVERBOUGHT:
        verdict.update({
            "status": "🚨 HYPE WARNING",
            "description": "Sentiment is euphoric, but price is overbought. High correction risk.",
            "color": "red",
            "flux_score": 90  # High Risk
        })

    # 2. VALUE BUY (High Opportunity) 💎
    elif sentiment_score < SENTIMENT_LOW and rsi_value < RSI_OVERSOLD:
        verdict.update({
            "status": "💎 VALUE OPPORTUNITY",
            "description": "Extreme fear has created a discount. Potential rebound.",
            "color": "green",
            "flux_score": 10  # Low Risk (Good for buying)
        })

    # 3. HEALTHY UPTREND (Safe Growth) ✅
    elif sentiment_score > 0.1 and (RSI_NEUTRAL_LOW < rsi_value < RSI_OVERBOUGHT):
        verdict.update({
            "status": "✅ HEALTHY UPTREND",
            "description": "Positive sentiment is supporting steady growth.",
            "color": "blue",
            "flux_score": 30  # Moderate Risk / Healthy
        })

    # 4. BEARISH TREND (Falling) 📉
    elif sentiment_score < -0.1 and rsi_value < 50:
        verdict.update({
            "status": "📉 BEARISH TREND",
            "description": "Negative news is dragging the price down.",
            "color": "orange",
            "flux_score": 80  # High Risk (Don't catch a falling knife)
        })

    return verdict