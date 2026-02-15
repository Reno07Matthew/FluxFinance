from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from data_provider import get_market_data, search_symbols, get_batch_market_data
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

@app.get("/search")
def search(q: str = ""):
    """Search for assets by name or symbol. Returns matching results."""
    results = search_symbols(q)
    return {"results": results}

@app.get("/markets")
def markets(category: str = "stock"):
    """Get batch market data for stocks or crypto."""
    data = get_batch_market_data(category)
    return {"assets": data}

@app.get("/portfolio/prices")
def portfolio_prices(symbols: str = ""):
    """Get current prices for a list of symbols (comma-separated)."""
    from data_provider import SEARCHABLE_ASSETS, INDEX_SYMBOLS, INDIAN_STOCKS
    import yfinance as yf
    
    symbol_list = [s.strip().upper() for s in symbols.split(",") if s.strip()]
    results = {}
    
    for sym in symbol_list:
        try:
            info = SEARCHABLE_ASSETS.get(sym, {})
            asset_type = info.get('type', 'stock')
            
            if asset_type == 'crypto':
                pair = f"{sym}/USDT"
                ticker = exchange.fetch_ticker(pair)
                results[sym] = {
                    "price": round(ticker.get('last', 0), 2),
                    "currency": "USD",
                    "name": info.get('name', sym),
                    "change": round(ticker.get('percentage', 0) or 0, 2)
                }
            else:
                if sym in INDEX_SYMBOLS:
                    yf_sym = INDEX_SYMBOLS[sym]
                elif sym in INDIAN_STOCKS:
                    yf_sym = f"{sym}.NS"
                else:
                    yf_sym = sym
                
                stock = yf.Ticker(yf_sym)
                hist = stock.history(period="5d")
                if not hist.empty:
                    current = round(float(hist['Close'].iloc[-1]), 2)
                    prev = round(float(hist['Close'].iloc[-2]), 2) if len(hist) >= 2 else current
                    change = round(((current - prev) / prev) * 100, 2) if prev else 0
                    is_indian = sym in INDIAN_STOCKS or (sym in INDEX_SYMBOLS and INDEX_SYMBOLS.get(sym, '') in ('^NSEI', '^BSESN', '^NSEBANK', '^CNXIT'))
                    results[sym] = {
                        "price": current,
                        "currency": "INR" if is_indian else "USD",
                        "name": info.get('name', sym),
                        "change": change
                    }
        except Exception as e:
            print(f"Error fetching price for {sym}: {e}")
    
    return {"prices": results}

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