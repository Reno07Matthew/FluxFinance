import yfinance as yf
import ccxt
import requests
from bs4 import BeautifulSoup
import re

exchange = ccxt.binance()

# Index symbols mapping - these need special Yahoo Finance symbols
INDEX_SYMBOLS = {
    'NIFTY': '^NSEI', 'NIFTY_50': '^NSEI', 'NIFTY50': '^NSEI',
    'SENSEX': '^BSESN', 'BSE': '^BSESN',
    'BANKNIFTY': '^NSEBANK', 'BANK_NIFTY': '^NSEBANK',
    'NIFTYIT': '^CNXIT', 'NIFTY_IT': '^CNXIT',
    'SP500': '^GSPC', 'S&P500': '^GSPC', 'SPX': '^GSPC',
    'NASDAQ': '^IXIC', 'DOWJONES': '^DJI', 'DOW': '^DJI',
    'FTSE': '^FTSE', 'DAX': '^GDAXI', 'NIKKEI': '^N225',
}

# Indian stocks that need .NS (NSE) suffix
INDIAN_STOCKS = {
    'INFY', 'TCS', 'RELIANCE', 'HDFCBANK', 'ICICIBANK', 'HINDUNILVR', 
    'SBIN', 'BHARTIARTL', 'ITC', 'KOTAKBANK', 'LT', 'AXISBANK',
    'ASIANPAINT', 'MARUTI', 'TITAN', 'SUNPHARMA', 'BAJFINANCE',
    'WIPRO', 'HCLTECH', 'ULTRACEMCO', 'ONGC', 'NTPC', 'POWERGRID',
    'TATAMOTORS', 'TATASTEEL', 'JSWSTEEL', 'ADANIENT', 'ADANIPORTS',
    'TECHM', 'NESTLEIND', 'BAJAJ-AUTO', 'HEROMOTOCO', 'DRREDDY',
    'CIPLA', 'DIVISLAB', 'BRITANNIA', 'EICHERMOT', 'GRASIM',
    'INDUSINDBK', 'COALINDIA', 'BPCL', 'IOC', 'HINDPETRO',
    'APOLLOHOSP', 'SBILIFE', 'HDFCLIFE', 'BAJAJFINSV', 'ICICIPRULI',
    'ZOMATO', 'PAYTM', 'NYKAA', 'VEDL', 'TRENT', 'IRCTC', 'HAL'
}

# Company name mapping for search - maps SYMBOL -> {name, type}
SEARCHABLE_ASSETS = {
    # Indian Stocks (NSE)
    'RELIANCE': {'name': 'Reliance Industries', 'type': 'stock', 'exchange': 'NSE'},
    'TCS': {'name': 'Tata Consultancy Services', 'type': 'stock', 'exchange': 'NSE'},
    'INFY': {'name': 'Infosys', 'type': 'stock', 'exchange': 'NSE'},
    'HDFCBANK': {'name': 'HDFC Bank', 'type': 'stock', 'exchange': 'NSE'},
    'ICICIBANK': {'name': 'ICICI Bank', 'type': 'stock', 'exchange': 'NSE'},
    'HINDUNILVR': {'name': 'Hindustan Unilever', 'type': 'stock', 'exchange': 'NSE'},
    'SBIN': {'name': 'State Bank of India', 'type': 'stock', 'exchange': 'NSE'},
    'BHARTIARTL': {'name': 'Bharti Airtel', 'type': 'stock', 'exchange': 'NSE'},
    'ITC': {'name': 'ITC Limited', 'type': 'stock', 'exchange': 'NSE'},
    'KOTAKBANK': {'name': 'Kotak Mahindra Bank', 'type': 'stock', 'exchange': 'NSE'},
    'LT': {'name': 'Larsen & Toubro', 'type': 'stock', 'exchange': 'NSE'},
    'AXISBANK': {'name': 'Axis Bank', 'type': 'stock', 'exchange': 'NSE'},
    'ASIANPAINT': {'name': 'Asian Paints', 'type': 'stock', 'exchange': 'NSE'},
    'MARUTI': {'name': 'Maruti Suzuki', 'type': 'stock', 'exchange': 'NSE'},
    'TITAN': {'name': 'Titan Company', 'type': 'stock', 'exchange': 'NSE'},
    'SUNPHARMA': {'name': 'Sun Pharma', 'type': 'stock', 'exchange': 'NSE'},
    'BAJFINANCE': {'name': 'Bajaj Finance', 'type': 'stock', 'exchange': 'NSE'},
    'WIPRO': {'name': 'Wipro', 'type': 'stock', 'exchange': 'NSE'},
    'HCLTECH': {'name': 'HCL Technologies', 'type': 'stock', 'exchange': 'NSE'},
    'ULTRACEMCO': {'name': 'UltraTech Cement', 'type': 'stock', 'exchange': 'NSE'},
    'ONGC': {'name': 'Oil & Natural Gas Corp', 'type': 'stock', 'exchange': 'NSE'},
    'NTPC': {'name': 'NTPC Limited', 'type': 'stock', 'exchange': 'NSE'},
    'POWERGRID': {'name': 'Power Grid Corp', 'type': 'stock', 'exchange': 'NSE'},
    'TATAMOTORS': {'name': 'Tata Motors', 'type': 'stock', 'exchange': 'NSE'},
    'TATASTEEL': {'name': 'Tata Steel', 'type': 'stock', 'exchange': 'NSE'},
    'JSWSTEEL': {'name': 'JSW Steel', 'type': 'stock', 'exchange': 'NSE'},
    'ADANIENT': {'name': 'Adani Enterprises', 'type': 'stock', 'exchange': 'NSE'},
    'ADANIPORTS': {'name': 'Adani Ports', 'type': 'stock', 'exchange': 'NSE'},
    'TECHM': {'name': 'Tech Mahindra', 'type': 'stock', 'exchange': 'NSE'},
    'NESTLEIND': {'name': 'Nestle India', 'type': 'stock', 'exchange': 'NSE'},
    'BAJAJ-AUTO': {'name': 'Bajaj Auto', 'type': 'stock', 'exchange': 'NSE'},
    'HEROMOTOCO': {'name': 'Hero MotoCorp', 'type': 'stock', 'exchange': 'NSE'},
    'DRREDDY': {'name': "Dr. Reddy's Labs", 'type': 'stock', 'exchange': 'NSE'},
    'CIPLA': {'name': 'Cipla', 'type': 'stock', 'exchange': 'NSE'},
    'DIVISLAB': {'name': "Divi's Laboratories", 'type': 'stock', 'exchange': 'NSE'},
    'BRITANNIA': {'name': 'Britannia Industries', 'type': 'stock', 'exchange': 'NSE'},
    'EICHERMOT': {'name': 'Eicher Motors', 'type': 'stock', 'exchange': 'NSE'},
    'GRASIM': {'name': 'Grasim Industries', 'type': 'stock', 'exchange': 'NSE'},
    'INDUSINDBK': {'name': 'IndusInd Bank', 'type': 'stock', 'exchange': 'NSE'},
    'COALINDIA': {'name': 'Coal India', 'type': 'stock', 'exchange': 'NSE'},
    'BPCL': {'name': 'Bharat Petroleum', 'type': 'stock', 'exchange': 'NSE'},
    'IOC': {'name': 'Indian Oil Corp', 'type': 'stock', 'exchange': 'NSE'},
    'HINDPETRO': {'name': 'Hindustan Petroleum', 'type': 'stock', 'exchange': 'NSE'},
    'APOLLOHOSP': {'name': 'Apollo Hospitals', 'type': 'stock', 'exchange': 'NSE'},
    'SBILIFE': {'name': 'SBI Life Insurance', 'type': 'stock', 'exchange': 'NSE'},
    'HDFCLIFE': {'name': 'HDFC Life Insurance', 'type': 'stock', 'exchange': 'NSE'},
    'BAJAJFINSV': {'name': 'Bajaj Finserv', 'type': 'stock', 'exchange': 'NSE'},
    'ICICIPRULI': {'name': 'ICICI Prudential Life', 'type': 'stock', 'exchange': 'NSE'},
    'ZOMATO': {'name': 'Zomato', 'type': 'stock', 'exchange': 'NSE'},
    'PAYTM': {'name': 'Paytm (One97)', 'type': 'stock', 'exchange': 'NSE'},
    'NYKAA': {'name': 'Nykaa (FSN E-Commerce)', 'type': 'stock', 'exchange': 'NSE'},
    'VEDL': {'name': 'Vedanta', 'type': 'stock', 'exchange': 'NSE'},
    'TRENT': {'name': 'Trent (Westside)', 'type': 'stock', 'exchange': 'NSE'},
    'IRCTC': {'name': 'IRCTC', 'type': 'stock', 'exchange': 'NSE'},
    'HAL': {'name': 'Hindustan Aeronautics', 'type': 'stock', 'exchange': 'NSE'},
    # US Stocks
    'AAPL': {'name': 'Apple', 'type': 'stock', 'exchange': 'NASDAQ'},
    'MSFT': {'name': 'Microsoft', 'type': 'stock', 'exchange': 'NASDAQ'},
    'GOOGL': {'name': 'Alphabet (Google)', 'type': 'stock', 'exchange': 'NASDAQ'},
    'AMZN': {'name': 'Amazon', 'type': 'stock', 'exchange': 'NASDAQ'},
    'TSLA': {'name': 'Tesla', 'type': 'stock', 'exchange': 'NASDAQ'},
    'META': {'name': 'Meta (Facebook)', 'type': 'stock', 'exchange': 'NASDAQ'},
    'NVDA': {'name': 'NVIDIA', 'type': 'stock', 'exchange': 'NASDAQ'},
    'AMD': {'name': 'Advanced Micro Devices', 'type': 'stock', 'exchange': 'NASDAQ'},
    'NFLX': {'name': 'Netflix', 'type': 'stock', 'exchange': 'NASDAQ'},
    'UBER': {'name': 'Uber Technologies', 'type': 'stock', 'exchange': 'NYSE'},
    'DIS': {'name': 'Walt Disney', 'type': 'stock', 'exchange': 'NYSE'},
    'JPM': {'name': 'JPMorgan Chase', 'type': 'stock', 'exchange': 'NYSE'},
    'V': {'name': 'Visa', 'type': 'stock', 'exchange': 'NYSE'},
    'MA': {'name': 'Mastercard', 'type': 'stock', 'exchange': 'NYSE'},
    'WMT': {'name': 'Walmart', 'type': 'stock', 'exchange': 'NYSE'},
    'KO': {'name': 'Coca-Cola', 'type': 'stock', 'exchange': 'NYSE'},
    'PEP': {'name': 'PepsiCo', 'type': 'stock', 'exchange': 'NASDAQ'},
    'BA': {'name': 'Boeing', 'type': 'stock', 'exchange': 'NYSE'},
    'INTC': {'name': 'Intel', 'type': 'stock', 'exchange': 'NASDAQ'},
    # Indices
    'NIFTY': {'name': 'Nifty 50 Index', 'type': 'stock', 'exchange': 'NSE'},
    'SENSEX': {'name': 'BSE Sensex Index', 'type': 'stock', 'exchange': 'BSE'},
    'BANKNIFTY': {'name': 'Bank Nifty Index', 'type': 'stock', 'exchange': 'NSE'},
    'SP500': {'name': 'S&P 500 Index', 'type': 'stock', 'exchange': 'US'},
    'NASDAQ': {'name': 'NASDAQ Composite', 'type': 'stock', 'exchange': 'US'},
    'DOW': {'name': 'Dow Jones Industrial', 'type': 'stock', 'exchange': 'US'},
    # Cryptocurrencies
    'BTC': {'name': 'Bitcoin', 'type': 'crypto', 'exchange': 'Binance'},
    'ETH': {'name': 'Ethereum', 'type': 'crypto', 'exchange': 'Binance'},
    'BNB': {'name': 'Binance Coin', 'type': 'crypto', 'exchange': 'Binance'},
    'SOL': {'name': 'Solana', 'type': 'crypto', 'exchange': 'Binance'},
    'XRP': {'name': 'Ripple', 'type': 'crypto', 'exchange': 'Binance'},
    'ADA': {'name': 'Cardano', 'type': 'crypto', 'exchange': 'Binance'},
    'DOGE': {'name': 'Dogecoin', 'type': 'crypto', 'exchange': 'Binance'},
    'DOT': {'name': 'Polkadot', 'type': 'crypto', 'exchange': 'Binance'},
    'AVAX': {'name': 'Avalanche', 'type': 'crypto', 'exchange': 'Binance'},
    'MATIC': {'name': 'Polygon', 'type': 'crypto', 'exchange': 'Binance'},
    'LINK': {'name': 'Chainlink', 'type': 'crypto', 'exchange': 'Binance'},
    'SHIB': {'name': 'Shiba Inu', 'type': 'crypto', 'exchange': 'Binance'},
    'LTC': {'name': 'Litecoin', 'type': 'crypto', 'exchange': 'Binance'},
    'UNI': {'name': 'Uniswap', 'type': 'crypto', 'exchange': 'Binance'},
    'ATOM': {'name': 'Cosmos', 'type': 'crypto', 'exchange': 'Binance'},
}

# Build COMPANY_NAMES from SEARCHABLE_ASSETS for backward compat with news search
COMPANY_NAMES = {k: v['name'] for k, v in SEARCHABLE_ASSETS.items()}

def search_symbols(query: str, limit: int = 8):
    """Search assets by name or symbol. Returns list of matching results."""
    query = query.strip().lower()
    if not query:
        return []
    
    results = []
    for symbol, info in SEARCHABLE_ASSETS.items():
        name_lower = info['name'].lower()
        symbol_lower = symbol.lower()
        
        # Check if query matches symbol or name
        if query in symbol_lower or query in name_lower:
            # Prioritize: exact symbol match > starts with > contains
            if symbol_lower == query:
                priority = 0
            elif symbol_lower.startswith(query) or name_lower.startswith(query):
                priority = 1
            else:
                priority = 2
            
            results.append({
                'symbol': symbol,
                'name': info['name'],
                'type': info['type'],
                'exchange': info['exchange'],
                'priority': priority
            })
    
    # Sort by priority, then alphabetically
    results.sort(key=lambda x: (x['priority'], x['name']))
    
    # Remove priority field before returning
    for r in results:
        del r['priority']
    
    return results[:limit]

def get_real_headlines(ticker, is_indian=False):
    """Scrapes Google News RSS for the latest headlines with source URLs."""
    try:
        company_name = COMPANY_NAMES.get(ticker.upper(), ticker)

        if is_indian:
            search_term = f"{company_name} {ticker} stock"
            rss_url = f"https://news.google.com/rss/search?q={search_term}&hl=en-IN&gl=IN&ceid=IN:en"
        else:
            search_term = f"{ticker} stock"
            rss_url = f"https://news.google.com/rss/search?q={search_term}&hl=en-US&gl=US&ceid=US:en"

        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
        response = requests.get(rss_url, headers=headers, timeout=10)

        soup = BeautifulSoup(response.content, 'html.parser')
        headlines = []
        items = soup.find_all('item')

        for item in items[:8]:
            title_tag = item.find('title')
            if not title_tag:
                continue
            title = title_tag.get_text()
            if ' - ' in title:
                title = title.rsplit(' - ', 1)[0]
            title = title.strip()
            if not title or len(title) <= 10:
                continue

            # Google News RSS stores the link as text between <link>...</link>
            # BeautifulSoup parses it as a NavigableString sibling, not an element
            link_tag = item.find('link')
            article_url = None
            if link_tag:
                # Try .next_sibling which holds the raw URL text
                sib = link_tag.next_sibling
                if sib and str(sib).strip().startswith('http'):
                    article_url = str(sib).strip()
                else:
                    article_url = link_tag.get_text(strip=True)

            if not article_url or not article_url.startswith('http'):
                article_url = f"https://www.google.com/search?q={title.replace(' ', '+')}+{ticker}"

            headlines.append({"title": title, "url": article_url})

        if headlines:
            return headlines

        # Fallback regex parsing
        title_matches = re.findall(r'<title>([^<]+)</title>', response.text)
        link_matches  = re.findall(r'<link>([^<]+)</link>',   response.text)

        for i, match in enumerate(title_matches[1:9]):
            title = match.strip()
            if ' - ' in title:
                title = title.rsplit(' - ', 1)[0]
            if title and len(title) > 10:
                link = link_matches[i] if i < len(link_matches) else f"https://www.google.com/search?q={ticker}+stock+news"
                headlines.append({"title": title, "url": link})

        fallback_url = f"https://www.google.com/search?q={ticker}+stock+news"
        return headlines if headlines else [{"title": f"Market updates for {ticker}", "url": fallback_url}]

    except Exception as e:
        print(f"News fetch error: {e}")
        return [
            {"title": f"Market updates for {ticker}", "url": f"https://www.google.com/search?q={ticker}+stock+news"},
            {"title": f"Analysis for {ticker} stock", "url": f"https://finance.yahoo.com/quote/{ticker}"},
        ]

def get_market_data(symbol, asset_type="stock"):
    """Fetches Price History + Real News."""
    try:
        history = []
        current_price = 0
        currency = "USD"
        is_indian = False
        display_symbol = symbol.upper()
        
        if asset_type == "crypto":
            if "/" not in symbol: 
                symbol = f"{symbol.upper()}/USDT"
            ticker_data = exchange.fetch_ticker(symbol)
            ohlcv = exchange.fetch_ohlcv(symbol, '1d', limit=30)
            history = [x[4] for x in ohlcv]  # Close prices
            current_price = ticker_data['last']
            display_symbol = symbol
        else:
            # Check if it's an index (NIFTY, SENSEX, etc.)
            symbol_upper = symbol.upper().replace('.NS', '').replace('.BO', '')
            
            if symbol_upper in INDEX_SYMBOLS:
                yf_symbol = INDEX_SYMBOLS[symbol_upper]
                is_indian = yf_symbol in ('^NSEI', '^BSESN', '^NSEBANK', '^CNXIT')
                currency = "INR" if is_indian else "USD"
            elif symbol_upper in INDIAN_STOCKS:
                # Use NSE suffix for Indian stocks
                yf_symbol = f"{symbol_upper}.NS"
                is_indian = True
                currency = "INR"
            else:
                yf_symbol = symbol.upper()
            
            stock = yf.Ticker(yf_symbol)
            hist = stock.history(period="1mo")
            
            if hist.empty:
                # Try with .NS if direct symbol failed
                if not is_indian and symbol_upper not in INDEX_SYMBOLS:
                    yf_symbol = f"{symbol.upper()}.NS"
                    stock = yf.Ticker(yf_symbol)
                    hist = stock.history(period="1mo")
                    if not hist.empty:
                        is_indian = True
                        currency = "INR"
            
            history = hist['Close'].tolist() if not hist.empty else []
            current_price = round(history[-1], 2) if history else 0
            display_symbol = symbol_upper

        # Fetch News
        news_query = display_symbol
        headlines = get_real_headlines(news_query, is_indian)

        return {
            "symbol": display_symbol,
            "price": current_price,
            "currency": currency,
            "is_indian": is_indian,
            "history": history,
            "headlines": headlines
        }
    except Exception as e:
        return {"error": str(e)}


# Default stock and crypto lists for Markets page (Indian focus)
STOCK_LIST = ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK', 'SBIN', 'ITC', 'WIPRO',
              'TATAMOTORS', 'BHARTIARTL', 'KOTAKBANK', 'LT', 'AXISBANK', 'ASIANPAINT',
              'MARUTI', 'TITAN', 'SUNPHARMA', 'BAJFINANCE', 'HCLTECH', 'ADANIENT',
              'ZOMATO', 'IRCTC', 'HAL', 'COALINDIA', 'NTPC', 'ONGC', 'BPCL']

CRYPTO_LIST = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA', 'DOGE', 'DOT', 'AVAX', 'MATIC',
               'LINK', 'SHIB', 'LTC', 'UNI', 'ATOM']

INDEX_LIST = ['NIFTY', 'SENSEX', 'BANKNIFTY']


def get_batch_market_data(category="stock"):
    """Fetch prices and daily changes for multiple assets at once."""
    results = []
    
    try:
        if category == "crypto":
            for sym in CRYPTO_LIST:
                try:
                    pair = f"{sym}/USDT"
                    ticker = exchange.fetch_ticker(pair)
                    price = ticker.get('last', 0)
                    change_pct = ticker.get('percentage', 0) or 0
                    info = SEARCHABLE_ASSETS.get(sym, {})
                    results.append({
                        "symbol": sym,
                        "name": info.get('name', sym),
                        "price": round(price, 2),
                        "change": round(change_pct, 2),
                        "currency": "USD",
                        "exchange": "Binance",
                        "type": "crypto"
                    })
                except Exception as e:
                    print(f"Error fetching {sym}: {e}")
        else:
            # Batch fetch stocks using yfinance
            symbols_to_fetch = STOCK_LIST + INDEX_LIST
            
            for sym in symbols_to_fetch:
                try:
                    sym_upper = sym.upper()
                    info = SEARCHABLE_ASSETS.get(sym_upper, {})
                    
                    # Determine yfinance symbol
                    if sym_upper in INDEX_SYMBOLS:
                        yf_sym = INDEX_SYMBOLS[sym_upper]
                    elif sym_upper in INDIAN_STOCKS:
                        yf_sym = f"{sym_upper}.NS"
                    else:
                        yf_sym = sym_upper
                    
                    stock = yf.Ticker(yf_sym)
                    hist = stock.history(period="5d")
                    
                    if hist.empty or len(hist) < 2:
                        continue
                    
                    current = hist['Close'].iloc[-1]
                    previous = hist['Close'].iloc[-2]
                    change_pct = ((current - previous) / previous) * 100
                    
                    is_indian = sym_upper in INDIAN_STOCKS or sym_upper in INDEX_SYMBOLS and INDEX_SYMBOLS.get(sym_upper, '') in ('^NSEI', '^BSESN', '^NSEBANK', '^CNXIT')
                    
                    results.append({
                        "symbol": sym_upper,
                        "name": info.get('name', sym_upper),
                        "price": round(current, 2),
                        "change": round(change_pct, 2),
                        "currency": "INR" if is_indian else "USD",
                        "exchange": info.get('exchange', 'NSE' if is_indian else 'US'),
                        "type": "index" if sym_upper in INDEX_SYMBOLS else "stock"
                    })
                except Exception as e:
                    print(f"Error fetching {sym}: {e}")
    except Exception as e:
        print(f"Batch fetch error: {e}")
    
    return results