<div align="center">
  <h1>🔷 Flux Finance</h1>
  <p><b>AI-Powered Sentiment & Technical Analysis Platform for Financial Markets</b></p>
  
  <p>
    <img src="https://img.shields.io/badge/Python-3.10+-blue.svg" alt="Python Version" />
    <img src="https://img.shields.io/badge/Node.js-18+-green.svg" alt="Node Version" />
    <img src="https://img.shields.io/badge/React-18-61dafb.svg" alt="React" />
    <img src="https://img.shields.io/badge/FastAPI-009688.svg" alt="FastAPI" />
  </p>
</div>

---

**Flux Finance** is an AI-powered real-time stock and crypto analysis platform designed to provide retail investors with actionable intelligence. By combining mathematical technical indicators with AI-driven sentiment analysis, Flux Finance gives you the complete picture—**psychology vs. reality.**

## ✨ Key Features

- **🧠 AI Sentiment Engine:** Utilizes the FinBERT NLP model to analyze live news headlines and gauge market psychology.
- **📊 7-Layer Technical Engine:** Native calculations for RSI, SMA-200, EMA-50, VWAP, OBV, SuperTrend, and Pivot Points.
- **⚖️ Flux Verdict Consensus:** A proprietary scoring system (0-100) that synthesizes sentiment and technicals into a clear, actionable verdict (e.g., 🚨 HIGH RISK, ✅ STRONG BUY).
- **⚡ Real-Time Data Streams:** Native WebSocket integration for live price and technical updates.
- **🌍 Multi-Asset Support:** Full support for Indian equities (NSE/BSE) via `yfinance` and global cryptocurrencies via `ccxt`.
- **🎨 Modern UI/UX:** Responsive, dark-themed dashboard built with React, Vite, TailwindCSS, and Framer Motion.

---

## 🏗️ System Architecture

Flux Finance is built on a modern, decoupled architecture:

### Frontend
- **Framework:** React 18 (Vite)
- **Styling:** TailwindCSS
- **Animations:** Framer Motion
- **Charting:** Recharts
- **State:** React Context API (`MarketContext`)

### Backend
- **Framework:** FastAPI (Python)
- **Data Processing:** Pandas, NumPy
- **AI/NLP:** HuggingFace Transformers (`ProsusAI/finbert`)
- **Data Sources:** `yfinance` (Stocks), `ccxt` (Crypto), Google News RSS (Sentiment)

---

## 📈 The Flux Verdict Engine

To provide comprehensive insights, Flux Finance organizes asset analysis into "Defense Layers":

1. **Psychology (Momentum):** RSI
2. **Macro Trend (Direction):** SMA-200, EMA-50
3. **Institutional Truth (Volume & Flow):** VWAP, OBV, SuperTrend
4. **Risk Management:** Pivot Points (R1 / S1)

The **Flux Verdict Consensus Engine** applies 5 primary rules combining these layers and FinBERT's sentiment score to generate a final rating. For example, high hype (RSI > 70 + Positive Sentiment) in a bearish macro trend will yield a strong warning.

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+

### 1. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate    # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Start the API server
uvicorn main:app --reload --port 8000
```
*Note: The first run will automatically download the FinBERT model to your local machine.*

### 2. Frontend Setup

```bash
cd frontend
npm install

# Start the dev server
npm run dev
```

### 3. Access the Platform
- **Frontend Dashboard:** [http://localhost:3000](http://localhost:3000) (or via the port specified by Vite, usually `5173`)
- **Backend API Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 📡 Core API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | `GET` | Health check |
| `/analyze?symbol=RELIANCE&type=stock` | `GET` | Full comprehensive analysis with sentiment and technicals |
| `ws://localhost:8000/ws` | `WS` | Real-time WebSocket stream for asset-price updates |

---

## 📜 License

Distributed under the MIT License. Free for personal and commercial use.

---

<div align="center">
  <i>Built with ❤️ using AI-powered analysis.</i>
</div>
