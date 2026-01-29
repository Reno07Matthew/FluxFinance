# ⚡ FluxFinance

AI-Powered Financial Analysis Tool combining **FinBERT Sentiment Analysis** with **Technical Indicators** (RSI) to provide intelligent trading insights.

## 🚀 Features

- 📰 **Real-time News Analysis** - Fetches live headlines from Google News
- 🧠 **AI Sentiment Analysis** - Uses FinBERT to analyze market psychology
- 📊 **Technical Analysis** - Calculates RSI (Relative Strength Index)
- 🎯 **Flux Verdict** - Combines sentiment + technicals for actionable insights
- 💹 **Multi-Market Support** - Stocks (US & India), Crypto
- ₹💵 **Currency Detection** - Auto-detects INR for Indian stocks, USD for US stocks

## 📁 Project Structure

```
FluxFinance/Test1/
│
├── backend/                   # Backend API
│   ├── main.py                # FastAPI Gateway
│   ├── data_provider.py       # Market data & news fetching
│   ├── ai_engine.py           # FinBERT sentiment analysis
│   ├── technical_engine.py    # RSI calculations
│   ├── flux_engine.py         # Verdict logic
│   └── requirements.txt       # Python dependencies
│
└── frontend/                  # Frontend UI
    └── app.py                 # Streamlit dashboard
```

## 🛠️ Installation

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/FluxFinance.git
cd FluxFinance/Test1
```

### 2. Create virtual environment

```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 3. Install dependencies

```bash
pip install -r backend/requirements.txt
```

> **Note:** This will download ~2GB of packages including PyTorch and FinBERT model.

## 🏃 Running the Application

### Start Backend (Terminal 1)

```bash
source venv/bin/activate
cd backend
uvicorn main:app --reload
```

Backend will run on `http://127.0.0.1:8000`

### Start Frontend (Terminal 2)

```bash
source venv/bin/activate
streamlit run frontend/app.py
```

Frontend will open automatically in your browser.

## 📖 Usage

1. Enter a stock ticker:
   - **Indian stocks:** `INFY`, `TCS`, `RELIANCE`
   - **US stocks:** `TSLA`, `AAPL`, `GOOGL`
   - **Crypto:** `BTC`, `ETH`, `SOL`

2. Select asset type (stock/crypto)

3. Click "🔍 Run Flux Analysis"

4. View results:
   - Current price (₹ or $)
   - AI Sentiment Score (-1 to +1)
   - RSI (0-100)
   - Flux Verdict
   - Live news headlines
   - Price chart

## 🧠 How It Works

### AI Sentiment Analysis
- Fetches 8 recent news headlines from Google News
- Uses **FinBERT** (financial BERT model) to analyze sentiment
- Returns score from -1 (very negative) to +1 (very positive)

### Technical Analysis (RSI)
- Calculates 14-day Relative Strength Index
- **RSI < 30** = Oversold (potential buy)
- **RSI > 70** = Overbought (potential sell)
- **RSI 30-70** = Neutral

### Flux Verdict
Combines both signals:
- 🚨 **HYPE WARNING** - High sentiment + High RSI (overbought)
- 💎 **VALUE OPPORTUNITY** - Low sentiment + Low RSI (undervalued)
- ✅ **HEALTHY GROWTH** - Positive sentiment + Normal RSI
- 📉 **BEARISH TREND** - Negative sentiment + Dropping price

## 📦 Dependencies

- **FastAPI** - Backend API framework
- **Streamlit** - Frontend dashboard
- **yfinance** - Stock market data
- **ccxt** - Cryptocurrency data
- **transformers** - Hugging Face (FinBERT)
- **torch** - PyTorch for AI models
- **pandas** - Data processing
- **beautifulsoup4** - Web scraping for news

## ⚠️ Disclaimer

This tool is for **educational purposes only**. It is NOT financial advice. Always do your own research before making investment decisions.

## 📄 License

MIT License - feel free to use and modify!

## 🤝 Contributing

Contributions welcome! Please open an issue or submit a pull request.

---

**Made with ❤️ using FinBERT, FastAPI, and Streamlit**
