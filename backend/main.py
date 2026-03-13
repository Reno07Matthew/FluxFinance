from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends
from fastapi.middleware.cors import CORSMiddleware
from data_provider import get_market_data, search_symbols, get_batch_market_data
from ai_engine import analyze_sentiment
from technical_engine import calculate_flux_indicators, calculate_technicals
from flux_engine import calculate_flux_verdict, generate_flux_verdict
from streamer import get_quick_stock_snapshot, get_quick_crypto_snapshot
from auth_middleware import verify_auth

import yfinance as yf
import pandas as pd
import asyncio
import json

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
    return {"status": "Flux Finance API is running", "version": "2.0"}

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
    from ccxt import binance
    exchange = binance()

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
                    "price":    round(ticker.get('last', 0), 2),
                    "currency": "USD",
                    "name":     info.get('name', sym),
                    "change":   round(ticker.get('percentage', 0) or 0, 2)
                }
            else:
                if sym in INDEX_SYMBOLS:
                    yf_sym = INDEX_SYMBOLS[sym]
                elif sym in INDIAN_STOCKS:
                    yf_sym = f"{sym}.NS"
                else:
                    yf_sym = sym

                from data_provider import flatten_hist
                stock = yf.Ticker(yf_sym)
                hist  = flatten_hist(stock.history(period="5d"))
                if not hist.empty:
                    current = round(float(hist['Close'].iloc[-1]), 2)
                    prev    = round(float(hist['Close'].iloc[-2]), 2) if len(hist) >= 2 else current
                    change  = round(((current - prev) / prev) * 100, 2) if prev else 0
                    is_indian = sym in INDIAN_STOCKS or (
                        sym in INDEX_SYMBOLS and
                        INDEX_SYMBOLS.get(sym, '') in ('^NSEI', '^BSESN', '^NSEBANK', '^CNXIT')
                    )
                    results[sym] = {
                        "price":    current,
                        "currency": "INR" if is_indian else "USD",
                        "name":     info.get('name', sym),
                        "change":   change
                    }
        except Exception as e:
            print(f"Error fetching price for {sym}: {e}")

    return {"prices": results}

@app.get("/analyze")
def analyze(symbol: str, type: str = "stock"):
    try:
        from data_provider import INDEX_SYMBOLS, INDIAN_STOCKS

        # ── 1. Get News + Basic Price (for headlines) ──
        data = get_market_data(symbol, type)
        if data is None:
            return {"error": "Failed to fetch market data"}
        if "error" in data:
            return data

        headlines = data.get('headlines', [])
        currency  = data.get('currency', 'USD')
        is_indian = data.get('is_indian', False)

        # ── 2. AI Sentiment ──────────────────────────────────────────────────
        # If Alpha Vantage already scored the headlines, use those directly.
        # AV scores are finance-specific and save running FinBERT locally.
        av_scores = [
            h['av_sentiment_score']
            for h in headlines
            if isinstance(h, dict) and 'av_sentiment_score' in h
        ]

        if av_scores:
            # AV score range: -1.0 (bearish) to +1.0 (bullish)
            raw = sum(av_scores) / len(av_scores)
            label = "Positive" if raw > 0.15 else "Negative" if raw < -0.15 else "Neutral"
            sentiment = {"score": round(raw, 4), "label": label}
            print(f"[Sentiment] Using AV scores for {symbol}: {sentiment}")
        else:
            # Fallback: run FinBERT on headline titles
            headline_titles = [h['title'] if isinstance(h, dict) else h for h in headlines]
            sentiment = analyze_sentiment(headline_titles)
            if not sentiment:
                sentiment = {"score": 0, "label": "Neutral"}
            print(f"[Sentiment] Using FinBERT for {symbol}: {sentiment}")

        ai_score = float(sentiment.get('score', 0))

        # ── 3. Try full 7-indicator analysis (requires OHLCV + 1 year of data) ──
        verdict = None
        tech_summary = {"rsi": 50, "signal": "Neutral"}

        if type != "crypto":
            try:
                sym_upper = symbol.upper().replace('.NS', '').replace('.BO', '')
                if sym_upper in INDEX_SYMBOLS:
                    yf_sym = INDEX_SYMBOLS[sym_upper]
                elif sym_upper in INDIAN_STOCKS:
                    yf_sym = f"{sym_upper}.NS"
                else:
                    yf_sym = sym_upper

                stock = yf.Ticker(yf_sym)
                df    = stock.history(period="2y")  # 2 years to ensure 200-day SMA

                if not df.empty and len(df) >= 15:
                    df_enriched = calculate_flux_indicators(df)

                    if len(df_enriched) >= 2:
                        # Full 7-indicator verdict
                        verdict = generate_flux_verdict(df_enriched, ai_score)

                        # Extract technical summary from enriched df
                        latest = df_enriched.iloc[-1]
                        rsi_val = float(latest.get('RSI', 50))
                        signal  = "Neutral"
                        if rsi_val > 70:  signal = "Overbought"
                        elif rsi_val < 30: signal = "Oversold"

                        tech_summary = {
                            "rsi":           round(rsi_val, 2),
                            "signal":        signal,
                            "sma_200":       round(float(latest['SMA_200']), 2) if 'SMA_200' in latest else None,
                            "ema_50":        round(float(latest['EMA_50']), 2)  if 'EMA_50'  in latest else None,
                            "vwap":          round(float(latest['VWAP']), 2)    if 'VWAP'    in latest else None,
                            "supertrend_dir": int(latest['SuperTrend_Dir'])     if 'SuperTrend_Dir' in latest and not pd.isna(latest['SuperTrend_Dir']) else None,
                        }

            except Exception as e:
                print(f"Full indicator analysis failed for {symbol}, falling back: {e}")

        # ── 4. Fallback: legacy RSI-only verdict ──
        if verdict is None:
            history = data.get('history', [])
            tech_summary = calculate_technicals(history)
            verdict = calculate_flux_verdict(
                sentiment_score=ai_score,
                sentiment_label=sentiment['label'],
                rsi_value=tech_summary['rsi']
            )

        # ── 5. Build Response ──
        history = data.get('history', [])
        current_price = data.get('price', verdict.get('current_price', 0))

        return {
            "symbol":    data.get('symbol', symbol.upper()),
            "price":     current_price,
            "currency":  currency,
            "is_indian": is_indian,
            "sentiment": sentiment,
            "technical": tech_summary,
            "verdict":   verdict,
            "headlines": headlines,
            "history":   history,
        }

    except Exception as e:
        return {"error": str(e)}


# ─────────────────────────────────────────────────────────────────────────────
#  LIVE PRICE STREAM  ·  WebSocket  /ws/live/{symbol}?type=stock|crypto
# ─────────────────────────────────────────────────────────────────────────────

@app.websocket("/ws/live/{symbol}")
async def live_price_websocket(websocket: WebSocket, symbol: str, type: str = "stock"):
    """
    Streams a lightweight price + quick-technical snapshot every 5 s.
    Payload:
        { symbol, price, prev_close, change_pct, currency,
          rsi, supertrend_dir, timestamp }
    """
    await websocket.accept()

    from data_provider import INDEX_SYMBOLS, INDIAN_STOCKS

    sym_upper = symbol.upper()
    is_indian = False
    yf_sym    = sym_upper

    if type != "crypto":
        if sym_upper in INDEX_SYMBOLS:
            yf_sym    = INDEX_SYMBOLS[sym_upper]
            is_indian = yf_sym in ('^NSEI', '^BSESN', '^NSEBANK', '^CNXIT')
        elif sym_upper in INDIAN_STOCKS:
            yf_sym    = f"{sym_upper}.NS"
            is_indian = True

    try:
        while True:
            try:
                if type == "crypto":
                    snapshot = await asyncio.get_event_loop().run_in_executor(
                        None, get_quick_crypto_snapshot, sym_upper
                    )
                else:
                    snapshot = await asyncio.get_event_loop().run_in_executor(
                        None, get_quick_stock_snapshot,
                        sym_upper, is_indian, yf_sym
                    )

                await websocket.send_json(snapshot)

            except Exception as fetch_err:
                # Send error frame — don't disconnect
                await websocket.send_json({
                    "symbol": sym_upper,
                    "error":  str(fetch_err),
                    "timestamp": __import__('datetime').datetime.utcnow().isoformat() + "Z"
                })

            # Wait 5 s before next tick (yield to event loop)
            await asyncio.sleep(5)

    except WebSocketDisconnect:
        print(f"[WS] Client disconnected from /ws/live/{symbol}")
    except Exception as e:
        print(f"[WS] Error on /ws/live/{symbol}: {e}")
        try:
            await websocket.close(code=1011)
        except Exception:
            pass