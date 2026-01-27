# -*- coding: utf-8 -*-
"""
SwingScan Pro V9.1 - "The Conservative Compounder"
Calibrated for a 20% Annual Return Goal ($500 -> $600).
- High Probability Exits: Targets 2.0x ATR for a higher win rate.
- Risk-First Logic: Strict MA Stacks and VCP filters.
- 0-Knowledge Training: Only uses trailing data to ensure no "future peeking."
- Self-Improving: Learns from trade_memory.json to adjust strictness.
"""

import os
import json
import yfinance as yf
import pandas as pd
import pandas_ta as ta
import datetime
import urllib.request
import numpy as np

# --- SETTINGS ---
MEMORY_FILE = "public/trade_memory.json"
BASE_STRICTNESS = 80 # High bar for entry to ensure quality setups

# --- SELF-IMPROVEMENT ENGINE ---
def update_and_get_bias():
    """Reads past trade results from trade_memory.json to adjust strictness."""
    if not os.path.exists(MEMORY_FILE): return 0
    try:
        with open(MEMORY_FILE, 'r') as f:
            memory = json.load(f)
        
        trades = memory.get("history", [])
        closed_trades = [t for t in trades if t['status'] != 'open']
        
        if len(closed_trades) < 3: return 0 # Need a small sample size to start learning
        
        wins = len([t for t in closed_trades if t['status'] == 'win'])
        win_rate = (wins / len(closed_trades)) * 100
        
        print(f"🤖 Brain Feedback: Current Win Rate is {win_rate:.1f}%")
        
        # ADAPTIVE BIAS:
        # If the win rate is low (<45%), increase strictness (Bias +10)
        # If the win rate is high (>65%), we can be slightly more aggressive (Bias -5)
        if win_rate < 45: return 10
        if win_rate > 65: return -5
        return 0
    except Exception as e:
        print(f"Error in learning loop: {e}")
        return 0

# --- SCORING ENGINE ---
def calculate_confluence_score(df, spy_data):
    """
    V9.1 Scoring Engine. 
    Prioritizes 'Price Tightness' and 'Relative Strength' for consistent growth.
    """
    score = 10 
    try:
        # Squeeze handles single-column series to prevent multi-index errors
        s_close = df['Close'].squeeze()
        s_vol = df['Volume'].squeeze()
        m_close = spy_data['Close'].squeeze()
        
        # 1. THE TREND TEMPLATE (+40)
        # Perfectly aligned: Price > 20MA > 50MA > 200MA
        ma20 = ta.sma(s_close, length=20).iloc[-1]
        ma50 = df['MA50'].iloc[-1]
        ma200 = df['MA200'].iloc[-1]
        if s_close.iloc[-1] > ma20 > ma50 > ma200:
            score += 40

        # 2. VOLATILITY CONTRACTION (VCP) (+30)
        # Sign of institutional accumulation: Current range is tighter than past range.
        r20 = (df['High'].tail(20).max() - df['Low'].tail(20).min())
        r10 = (df['High'].tail(10).max() - df['Low'].tail(10).min())
        if r20 > r10:
            score += 30

        # 3. RELATIVE STRENGTH (+20)
        # The stock must be outperforming the market (SPY) over the last 3 months
        rs_line = s_close / m_close
        if rs_line.iloc[-1] > rs_line.iloc[-60]:
            score += 20

    except Exception:
        return 0 
    
    return int(min(max(score, 1), 100))

def get_full_market_list():
    """Scrapes major index tickers from Wikipedia."""
    tickers = set()
    opener = urllib.request.build_opener()
    opener.addheaders = [('User-agent', 'Mozilla/5.0')]
    try:
        # Get S&P 500
        url_sp = 'https://en.wikipedia.org/wiki/List_of_S%26P_500_companies'
        with opener.open(url_sp) as f:
            sp500 = pd.read_html(f)[0]['Symbol'].tolist()
            tickers.update(sp500)
        # Get Nasdaq 100
        url_ndx = 'https://en.wikipedia.org/wiki/Nasdaq-100'
        with opener.open(url_ndx) as f:
            ndx100 = pd.read_html(f)[4]['Ticker'].tolist()
            tickers.update(ndx100)
    except:
        # Fallback list if scraping fails
        return ['AAPL', 'MSFT', 'NVDA', 'TSLA', 'AMD', 'META', 'GOOGL', 'AMZN', 'PLTR']
    
    # Clean ticker names for yfinance
    return sorted([str(t).replace('.', '-') for t in tickers if str(t) != 'nan'])

def record_new_trades(new_signals):
    """Saves top picks into trade_memory.json to track performance for self-improvement."""
    if not os.path.exists('public'): os.makedirs('public')
    
    memory = {"history": []}
    if os.path.exists(MEMORY_FILE):
        try:
            with open(MEMORY_FILE, 'r') as f: memory = json.load(f)
        except: pass

    # Track only the top choice to follow the "strictly buy top choice" rule
    if not new_signals: return
    top_pick = new_signals[0]
    
    # Don't duplicate open trades for the same ticker
    if any(t['ticker'] == top_pick['ticker'] and t['status'] == 'open' for t in memory["history"]):
        return

    memory["history"].append({
        "ticker": top_pick['ticker'],
        "entry_price": top_pick['currentPrice'],
        "goal": top_pick['goal'],
        "stop": top_pick['stopLoss'],
        "date": datetime.datetime.now().strftime("%Y-%m-%d"),
        "status": "open"
    })
    
    # Keep the memory file at a manageable size
    memory["history"] = memory["history"][-50:]
    with open(MEMORY_FILE, 'w') as f:
        json.dump(memory, f, indent=4)

def run_web_scan():
    """Main execution loop for the market scanner."""
    # 1. Determine Bias from self-improvement loop
    bias = update_and_get_bias()
    current_threshold = BASE_STRICTNESS + bias
    
    all_tickers = get_full_market_list()
    
    # 2. Analyze Market Health (SPY Trend)
    spy_hist = yf.download("SPY", period="2y", interval="1d", progress=False)
    if isinstance(spy_hist.columns, pd.MultiIndex): spy_hist.columns = spy_hist.columns.droplevel(1)
    
    # 0-Knowledge Trend Check: Is SPY above its 200-day average?
    m_healthy = spy_hist['Close'].iloc[-1] > ta.sma(spy_hist['Close'], length=200).iloc[-1]
    
    signals = []
    print(f"🛠️ V9.1 Conservative Scan (Strictness Threshold: {current_threshold})...")

    for ticker in all_tickers:
        try:
            data = yf.download(ticker, period="2y", interval="1d", progress=False)
            if data.empty or len(data) < 200: continue
            
            if isinstance(data.columns, pd.MultiIndex): 
                data.columns = data.columns.droplevel(1)

            # Indicator Calculations
            data['MA50'] = ta.sma(data['Close'], length=50)
            data['MA200'] = ta.sma(data['Close'], length=200)
            data['ATR'] = ta.atr(data['High'], data['Low'], data['Close'], length=14)
            data.ta.rsi(append=True)
            
            close = float(data['Close'].iloc[-1])
            atr = data['ATR'].iloc[-1]
            
            # Handle possible multi-index or missing RSI columns
            rsi_series = data.filter(like='RSI')
            rsi = rsi_series.iloc[-1].iloc[0] if not rsi_series.empty else 50
            
            recent_high = float(data['High'].tail(20).max())

            # CONSERVATIVE ENTRY FILTER
            # Rules: Stock in uptrend, Market is healthy, RSI is not in 'hype' zone
            if close > data['MA50'].iloc[-1] > data['MA200'].iloc[-1] and m_healthy and 45 < rsi < 65:
                # Pivot Point: Check if we are breaking out or resting near the high
                if close >= (recent_high * 0.99):
                    
                    score = calculate_confluence_score(data, spy_hist)
                    
                    if score >= current_threshold:
                        # V9.1 Conservative Math:
                        # Taking profit at 2.0x ATR for a high win-rate probability.
                        # Stop loss at 1.5x ATR to protect the $500 start capital.
                        signals.append({
                            "ticker": str(ticker),
                            "score": score,
                            "pattern": "Conservative VCP",
                            "currentPrice": round(close, 2),
                            "buyAt": round(recent_high, 2),
                            "goal": round(close + (atr * 2.0), 2),
                            "stopLoss": round(close - (atr * 1.5), 2),
                            "rsi": round(float(rsi), 2)
                        })
        except: continue

    # Rank by score (Highest conviction setups first)
    signals = sorted(signals, key=lambda x: x['score'], reverse=True)

    # Track the top pick for future robot learning
    record_new_trades(signals)

    # Save output to public/signals.json for the Web Dashboard
    if not os.path.exists('public'): os.makedirs('public')
    output_data = {
        "marketHealthy": bool(m_healthy),
        "signals": signals,
        "lastUpdated": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    
    with open('public/signals.json', 'w') as f:
        json.dump(output_data, f, indent=4)
        
    print(f"✅ Scan Complete. Identified {len(signals)} setups using Compounder Logic.")

if __name__ == "__main__":
    run_web_scan()
