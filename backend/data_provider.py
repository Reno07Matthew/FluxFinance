import yfinance as yf
import ccxt
import requests
from bs4 import BeautifulSoup
import re

exchange = ccxt.binance()

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

# Company name mapping for better search
COMPANY_NAMES = {
    'INFY': 'Infosys',
    'TCS': 'Tata Consultancy Services',
    'RELIANCE': 'Reliance Industries',
    'HDFCBANK': 'HDFC Bank',
    'ICICIBANK': 'ICICI Bank',
    'SBIN': 'State Bank of India SBI',
    'WIPRO': 'Wipro',
    'TATAMOTORS': 'Tata Motors',
    'TATASTEEL': 'Tata Steel',
    'ZOMATO': 'Zomato',
    'PAYTM': 'Paytm One97',
}

def get_real_headlines(ticker, is_indian=False):
    """Scrapes Google News RSS for the latest headlines."""
    try:
        # Get company name if available
        company_name = COMPANY_NAMES.get(ticker.upper(), ticker)
        
        # Build search query
        if is_indian:
            search_term = f"{company_name} {ticker} stock"
            url = f"https://news.google.com/rss/search?q={search_term}&hl=en-IN&gl=IN&ceid=IN:en"
        else:
            search_term = f"{ticker} stock"
            url = f"https://news.google.com/rss/search?q={search_term}&hl=en-US&gl=US&ceid=US:en"
        
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
        response = requests.get(url, headers=headers, timeout=10)
        
        # Parse RSS using html.parser (more reliable)
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Find all title tags within item tags
        headlines = []
        items = soup.find_all('item')
        
        for item in items[:8]:
            title_tag = item.find('title')
            if title_tag:
                title = title_tag.get_text()
                # Clean up - remove source suffix like " - Economic Times"
                if ' - ' in title:
                    title = title.rsplit(' - ', 1)[0]
                if title and len(title) > 10:
                    headlines.append(title.strip())
        
        if headlines:
            return headlines
        
        # Fallback: Try regex parsing if BeautifulSoup fails
        title_pattern = r'<title>([^<]+)</title>'
        matches = re.findall(title_pattern, response.text)
        
        for match in matches[1:9]:  # Skip first (feed title)
            title = match.strip()
            if ' - ' in title:
                title = title.rsplit(' - ', 1)[0]
            if title and len(title) > 10:
                headlines.append(title)
        
        return headlines if headlines else [f"Market updates for {ticker}"]
        
    except Exception as e:
        print(f"News fetch error: {e}")
        return [f"Market updates for {ticker}", f"Analysis for {ticker} stock"]

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
            # Check if it's an Indian stock
            symbol_upper = symbol.upper().replace('.NS', '').replace('.BO', '')
            
            if symbol_upper in INDIAN_STOCKS:
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
                if not is_indian:
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