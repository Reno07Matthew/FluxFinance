import streamlit as st
import requests
import pandas as pd
import plotly.express as px

st.set_page_config(page_title="Flux Finance", layout="wide", page_icon="⚡")

st.title(" Flux Finance: AI-Powered Market Analysis")

# Sidebar Inputs
symbol = st.sidebar.text_input("Enter Ticker (e.g., INFY, TSLA, BTC)", "INFY")
asset_type = st.sidebar.selectbox("Asset Type", ["stock", "crypto"])

st.sidebar.markdown("---")
st.sidebar.markdown("**Indian Stocks:** INFY, TCS, RELIANCE, etc.")
st.sidebar.markdown("**US Stocks:** TSLA, AAPL, GOOGL, etc.")
st.sidebar.markdown("**Crypto:** BTC, ETH, SOL, etc.")

if st.sidebar.button("🔍 Run Flux Analysis", type="primary"):
    with st.spinner("Analyzing Market Psychology & Math..."):
        try:
            response = requests.get(f"http://127.0.0.1:8000/analyze?symbol={symbol}&type={asset_type}")
            data = response.json()

            if "error" in data:
                st.error(f"Error: {data['error']}")
            else:
                # --- DISPLAY VERDICT ---
                verdict = data['verdict']
                st.markdown(f"## {verdict['status']}")
                
                # --- METRICS ROW ---
                col1, col2, col3 = st.columns(3)
                
                # Currency symbol based on whether it's Indian stock
                currency_symbol = "₹" if data.get('is_indian', False) else "$"
                currency_name = data.get('currency', 'USD')
                
                col1.metric("Current Price", f"{currency_symbol}{data['price']:,.2f}")
                col1.caption(f"Asset: {data['symbol']} ({currency_name})")
                
                col2.metric("AI Sentiment Score", data['sentiment']['score'])
                col2.caption(f"Label: {data['sentiment']['label']}")
                
                col3.metric("RSI (14-Day)", data['technical']['rsi'])
                col3.caption(f"Signal: {data['technical']['signal']}")

                st.markdown("---")

                # --- TWO COLUMN LAYOUT ---
                left_col, right_col = st.columns([2, 1])

                with left_col:
                    # --- PRICE CHART ---
                    st.subheader("📈 Price History (1 Month)")
                    df = pd.DataFrame(data['history'], columns=["Price"])
                    df.index = df.index + 1  # Start from day 1
                    
                    fig = px.line(df, y="Price", 
                                  labels={"index": "Day", "Price": f"Price ({currency_symbol})"},
                                  template="plotly_dark")
                    fig.update_traces(line_color='#00ff88')
                    fig.update_layout(
                        showlegend=False,
                        margin=dict(l=0, r=0, t=20, b=0),
                        height=300
                    )
                    st.plotly_chart(fig, use_container_width=True)

                with right_col:
                    # --- LIVE NEWS ---
                    st.subheader("📰 Live News")
                    headlines = data.get('headlines', [])
                    
                    if headlines:
                        for i, headline in enumerate(headlines, 1):
                            st.markdown(f"**{i}.** {headline}")
                    else:
                        st.info("No recent news found")

                # --- RAW DATA ---
                with st.expander("🔧 Debug: Raw API Response"):
                    st.json(data)

        except Exception as e:
            st.error(f"Error connecting to backend: {e}")
            st.info("Make sure the backend is running: `uvicorn main:app --reload`")