# 🔷 Flux Finance

**AI-Powered Sentiment & Technical Analysis Platform for Financial Markets**

Flux Finance combines AI-based market sentiment analysis (FinBERT, NLP) with technical indicators (RSI) to provide intelligent investment insights.

---

## ✨ Features

- **AI Sentiment Analysis** - FinBERT model analyzes live news headlines
- **Technical Indicators** - RSI calculation with overbought/oversold signals
- **Flux Verdict** - Compares psychology (sentiment) vs reality (technicals)
- **Live News Feed** - Real-time headlines from Google News
- **Multi-Asset Support** - Indian stocks (NSE) and Cryptocurrencies
- **Modern UI** - Dark theme React dashboard with TailwindCSS

---

## 🏗️ Project Structure

```
FluxFinance/
├── backend/                 # Python FastAPI
│   ├── main.py              # API endpoints + CORS
│   ├── ai_engine.py         # FinBERT sentiment analysis
│   ├── data_provider.py     # Stock/Crypto data (yfinance, ccxt)
│   ├── technical_engine.py  # RSI calculation
│   ├── flux_engine.py       # Verdict logic
│   └── requirements.txt     # Python dependencies
│
├── frontend/                # React + Vite + TailwindCSS
│   ├── src/
│   │   ├── app/App.tsx      # Main app component
│   │   ├── context/         # React state management
│   │   ├── services/api.ts  # Backend API integration
│   │   └── components/      # UI components
│   ├── package.json
│   └── vite.config.ts
│
└── venv/                    # Python virtual environment
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- npm

### Backend Setup
```bash
cd backend
python -m venv ../venv
source ../venv/bin/activate    # Linux/Mac
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Access
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000

---

## � API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Health check |
| `/analyze?symbol=RELIANCE&type=stock` | GET | Full analysis |

### Sample Response
```json
{
  "symbol": "RELIANCE",
  "price": 1456.8,
  "currency": "INR",
  "sentiment": { "score": 0.65, "label": "Positive" },
  "technical": { "rsi": 45.2, "signal": "Neutral" },
  "verdict": {
    "status": "✅ HEALTHY UPTREND",
    "flux_score": 30,
    "description": "Positive sentiment with stable technicals"
  },
  "headlines": ["...", "..."],
  "history": [1400, 1420, ...]
}
```

---

## 🎨 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, TailwindCSS, Recharts |
| Backend | FastAPI, Python 3.10 |
| AI/ML | HuggingFace Transformers, FinBERT |
| Data | yfinance, ccxt, Google News RSS |

---

## 📈 Flux Verdict Logic

| Condition | Verdict | Flux Score |
|-----------|---------|------------|
| High Sentiment + High RSI | � HYPE WARNING | 90 |
| Low Sentiment + Low RSI | 💎 VALUE OPPORTUNITY | 10 |
| Positive Sentiment + Neutral RSI | ✅ HEALTHY UPTREND | 30 |
| Negative Sentiment + Low RSI | � BEARISH TREND | 80 |
| Mixed Signals | ⚖️ MARKET NEUTRAL | 50 |

---

## � License

MIT License - Free for personal and commercial use.

---

## 👨‍💻 Author

Built with ❤️ using AI-powered analysis.
