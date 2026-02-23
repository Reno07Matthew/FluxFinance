import pandas as pd

def calculate_flux_verdict(sentiment_score: float, sentiment_label: str, rsi_value: float) -> dict:
    """
    Legacy single-bar verdict used when only RSI + sentiment are available
    (e.g., crypto, or stocks without enough history for SMA-200).
    """
    SENTIMENT_HIGH = 0.4
    SENTIMENT_LOW  = -0.4
    RSI_OVERBOUGHT = 70
    RSI_OVERSOLD   = 30
    RSI_NEUTRAL_LOW = 40

    verdict = {
        "status": "⚖️ MARKET NEUTRAL",
        "description": "Market is undecided. No strong signal.",
        "color": "gray",
        "flux_score": 50,
        "sentiment_score": round(sentiment_score, 2),
        "rsi_score": round(rsi_value, 2),
        # New fields (empty for legacy path)
        "verdict": "HOLD / NEUTRAL",
        "risk_management": None,
        "analysis": {"strengths": [], "warnings": []}
    }

    if sentiment_score > SENTIMENT_HIGH and rsi_value > RSI_OVERBOUGHT:
        verdict.update({
            "status": "🚨 HYPE WARNING",
            "description": "Euphoric sentiment with overbought RSI. High correction risk.",
            "color": "red", "flux_score": 90, "verdict": "HIGH RISK (AVOID)",
            "analysis": {
                "strengths": [],
                "warnings": ["🚨 HYPE BUBBLE: Extreme social greed combined with overbought RSI."]
            }
        })
    elif sentiment_score < SENTIMENT_LOW and rsi_value < RSI_OVERSOLD:
        verdict.update({
            "status": "💎 VALUE OPPORTUNITY",
            "description": "Extreme fear has created a discount. Potential rebound.",
            "color": "green", "flux_score": 10, "verdict": "STRONG BUY",
            "analysis": {
                "strengths": ["🚀 Oversold Panic: Excellent value opportunity based on RSI and fear."],
                "warnings": []
            }
        })
    elif sentiment_score > 0.1 and RSI_NEUTRAL_LOW < rsi_value < RSI_OVERBOUGHT:
        verdict.update({
            "status": "✅ HEALTHY UPTREND",
            "description": "Positive sentiment supporting steady growth.",
            "color": "blue", "flux_score": 30, "verdict": "STRONG BUY",
            "analysis": {
                "strengths": ["✅ Positive sentiment with healthy RSI momentum."],
                "warnings": []
            }
        })
    elif sentiment_score < -0.1 and rsi_value < 50:
        verdict.update({
            "status": "📉 BEARISH TREND",
            "description": "Negative news is dragging the price down.",
            "color": "orange", "flux_score": 80, "verdict": "HIGH RISK (AVOID)",
            "analysis": {
                "strengths": [],
                "warnings": ["📉 Bearish Trend: Negative news dragging price lower."]
            }
        })

    return verdict


def generate_flux_verdict(df: pd.DataFrame, ai_sentiment_score: float) -> dict:
    """
    Full 4-rule consensus verdict using the enriched 7-indicator DataFrame.
    Requires df to already have RSI, SMA_200, VWAP, OBV, R1, S1 columns.
    ai_sentiment_score: float between -1.0 (panic) and 1.0 (greed)
    """
    latest = df.iloc[-1]
    prev   = df.iloc[-2]
    price  = latest['Close']

    health_score = 50
    warnings: list[str] = []
    strengths: list[str] = []

    # ── RULE 1: Macro Trend Veto (SMA-200) ──
    if price < latest['SMA_200']:
        health_score -= 30
        warnings.append("⚠️ Macro-Downtrend: Price is below 200 SMA. High risk of capital loss.")
    else:
        health_score += 10
        strengths.append("✅ Macro-Uptrend confirmed by 200 SMA.")

    # ── RULE 2: SuperTrend Direction ──
    if not pd.isna(latest.get('SuperTrend_Dir', float('nan'))):
        if latest['SuperTrend_Dir'] == 1:
            health_score += 10
            strengths.append("📈 SuperTrend is bullish — upward momentum confirmed.")
        elif latest['SuperTrend_Dir'] == -1:
            health_score -= 10
            warnings.append("📉 SuperTrend is bearish — downward momentum detected.")

    # ── RULE 3: VWAP Check (Institutional Benchmark) ──
    if price > latest['VWAP']:
        warnings.append("⚠️ Overpriced: You are paying a premium compared to the institutional VWAP.")
    else:
        health_score += 15
        strengths.append("💎 Value: Trading below institutional VWAP — potential discount.")

    # ── RULE 4: OBV Lie Detector ──
    if price > prev['Close'] and latest['OBV'] < prev['OBV']:
        health_score -= 25
        warnings.append("🚨 Fake Rally Detected: Price rising but On-Balance Volume falling.")
    elif price < prev['Close'] and latest['OBV'] > prev['OBV']:
        health_score += 10
        strengths.append("🔍 Accumulation Detected: Price dipping but volume is flowing in.")

    # ── RULE 5: RSI + AI Sentiment (Hype / Fear) ──
    rsi = latest.get('RSI', 50)
    if rsi > 70 and ai_sentiment_score > 0.5:
        health_score -= 20
        warnings.append("🚨 HYPE BUBBLE: Extreme social greed combined with overbought RSI.")
    elif rsi < 30 and ai_sentiment_score < -0.5:
        health_score += 20
        strengths.append("🚀 Oversold Panic: Excellent value opportunity based on RSI and fear.")
    elif rsi > 70:
        health_score -= 10
        warnings.append("⚠️ RSI Overbought (>70): Rally may be exhausted.")
    elif rsi < 30:
        health_score += 10
        strengths.append("🟢 RSI Oversold (<30): Potential bounce incoming.")

    # Clamp score
    health_score = max(0, min(100, health_score))

    # ── Final Verdict ──
    if health_score >= 72:
        verdict_label = "STRONG BUY"
        color = "green"
        status = "✅ STRONG BUY"
        description = "Multiple defense layers confirm a healthy, buyable asset."
    elif health_score <= 35:
        verdict_label = "HIGH RISK (AVOID)"
        color = "red"
        status = "🚨 HIGH RISK — AVOID"
        description = "Multiple red flags detected. High probability of capital loss."
    else:
        verdict_label = "HOLD / NEUTRAL"
        color = "yellow"
        status = "⚖️ HOLD / NEUTRAL"
        description = "Mixed signals. No clear entry or exit point."

    return {
        # New rich fields
        "verdict": verdict_label,
        "flux_score": health_score,
        "color": color,
        "status": status,
        "description": description,
        "current_price": round(float(price), 2),
        "risk_management": {
            "target_exit_R1": round(float(latest['R1']), 2),
            "stop_loss_S1":   round(float(latest['S1']), 2),
            "pivot":          round(float(latest['Pivot']), 2),
        },
        "analysis": {
            "strengths": strengths,
            "warnings":  warnings,
        },
        # Legacy compatibility fields
        "sentiment_score": round(float(ai_sentiment_score), 2),
        "rsi_score":       round(float(rsi), 2),
    }