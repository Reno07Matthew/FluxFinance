from fastapi import FastAPI
from data_provider import get_market_data
from ai_engine import analyze_sentiment
from technical_engine import calculate_technicals
from flux_engine import get_flux_verdict

app = FastAPI()

@app.get("/analyze")
def analyze(symbol: str, type: str = "stock"):
    # 1. Get Data
    data = get_market_data(symbol, type)
    if "error" in data: return data
    
    # 2. Parallel Processing
    sentiment = analyze_sentiment(data['headlines'])
    tech = calculate_technicals(data['history'])
    
    # 3. The Flux Verdict
    verdict = get_flux_verdict(sentiment['score'], tech['rsi'])
    
    return {
        "symbol": data['symbol'],
        "price": data['price'],
        "currency": data.get('currency', 'USD'),
        "is_indian": data.get('is_indian', False),
        "sentiment": sentiment,
        "technical": tech,
        "verdict": verdict,
        "headlines": data['headlines'],
        "history": data['history']
    }