from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from data_provider import get_market_data
from ai_engine import analyze_sentiment
from technical_engine import calculate_technicals
from flux_engine import calculate_flux_verdict

app = FastAPI()

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3001", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"status": "Flux Finance API is running", "version": "1.0"}

@app.get("/analyze")
def analyze(symbol: str, type: str = "stock"):
    try:
        # 1. Get Data
        data = get_market_data(symbol, type)
        if data is None:
            return {"error": "Failed to fetch market data"}
        if "error" in data:
            return data
        
        # 2. Check if we have history data
        if not data.get('history') or len(data['history']) == 0:
            return {"error": f"No price history found for {symbol}. Please check the ticker symbol."}
        
        # 3. Run Analysis
        sentiment = analyze_sentiment(data['headlines'])
        if sentiment is None:
            sentiment = {"score": 0, "label": "Neutral"}
        
        tech = calculate_technicals(data['history'])
        if tech is None:
            tech = {"rsi": 50, "signal": "Neutral"}
        
        # 4. The Flux Verdict
        verdict = calculate_flux_verdict(
            sentiment_score=sentiment['score'],
            sentiment_label=sentiment['label'],
            rsi_value=tech['rsi']
        )
        
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
    except Exception as e:
        return {"error": str(e)}