# -*- coding: utf-8 -*-
"""
SwingScan Pro V6.0 - Power Ranking & Pattern Engine
This script identifies elite trading setups using confluence scoring.
"""

import os
import json
import yfinance as yf
import pandas as pd
import pandas_ta as ta
import datetime
import urllib.request

# --- SCORING ENGINE ---
def calculate_confluence_score(df, spy_data):
    """Calculates a score (1-100) based on signal strength."""
    score = 50 
    try:
        # 1. Relative Strength vs Market (SPY)
        stock_return = df['Close'].pct_change(20).iloc[-1]
        market_return = spy_data['Close'].pct_change(20).iloc[-1]
        if stock_return > market_return: score += 15

        # 2. Volume Intensity
        avg_vol = df['Volume'].tail(20).mean()
        curr_vol = df['Volume'].iloc[-1]
        if curr_vol > (avg_vol * 3): score += 20
        elif curr_vol > (avg_vol * 2): score += 10

        # 3. RSI 'Golden Zone' (55-65 is perfect for breakouts)
        rsi = df['RSI_14'].iloc[-1]
        if 55 <= rsi <= 65: score += 15
    except: pass
    return min(score, 100)

def identify_pattern(df):
    """Heuristic recognition based on price action shapes."""
    recent = df.tail(15)
    highs = recent['High']
    lows = recent['Low']
    
    # Pennant: Highs down, Lows up (Contracting Range)
    highs_down = highs.iloc[0] > highs.iloc[-1]
    lows_up = lows.iloc[0] < lows.iloc[-1]
    
    # Bull Flag: Tight consolidation after move
    rng = (highs.max() - lows.min()) / lows.min()
    
    if highs_down and lows_up: return "Pennant"
    if rng < 0.05: return "Bull Flag"
    return "Classic Breakout"

def get_full_market_list():
    """Scrapes S&P 500 and Nasdaq 100 lists."""
    tickers = set()
    opener = urllib.request.build_opener()
    opener.addheaders = [('User-agent', 'Mozilla/5.0')]
    try:
        url_sp = 'https://en.wikipedia.org/wiki/List_of_S%26P_500_companies'
        with opener.open(url_sp) as f:
            sp500 = pd.read_html(f)[0]['Symbol'].tolist()
            tickers.update(sp500)
        url_ndx = 'https://en.wikipedia.org/wiki/Nasdaq-100'
        with opener.open(url_ndx) as f:
            ndx100 = pd.read_html(f)[4]['Ticker'].tolist()
            tickers.update(ndx100)
    except:
        return ['AAPL', 'MSFT', 'NVDA', 'TSLA', 'AMD', 'META', 'GOOGL', 'AMZN']
    
    clean_tickers = [str(t).replace('.', '-') for t in tickers if str(t) != 'nan']
    return sorted(list(set(clean_tickers)))

def run_web_scan():
    all_tickers = get_full_market_list()
    # Get benchmark data
    spy_hist = yf.download("SPY", period="1y", interval="1d", progress=False)
    m_healthy = spy_hist['Close'].iloc[-1] > spy_hist['Close'].rolling(50).mean().iloc[-1]
    
    signals = []
    print(f"🚀 Power-Scanning {len(all_tickers)} stocks...")

    for ticker in all_tickers:
        try:
            data = yf.download(ticker, period="1y", interval="1d", progress=False)
            if data.empty or len(data) < 100: continue
            if isinstance(data.columns, pd.MultiIndex): data.columns = data.columns.droplevel(1)

            data['MA50'] = ta.sma(data['Close'], length=50)
            data.ta.rsi(append=True)
            
            close = data['Close']
            curr_price = float(close.iloc[-1])
            rsi = data['RSI_14'].iloc[-1]
            recent_high = float(data['High'].tail(20).max())

            # Signal Thresholds
            if curr_price > data['MA50'].iloc[-1] and 45 < rsi < 70 and m_healthy:
                if curr_price > (recent_high * 0.98):
                    signals.append({
                        "ticker": ticker,
                        "score": calculate_confluence_score(data, spy_hist),
                        "pattern": identify_pattern(data),
                        "currentPrice": round(curr_price, 2),
                        "buyAt": round(recent_high, 2),
                        "goal": round(curr_price * 1.10, 2),
                        "rsi": round(rsi, 2)
                    })
        except: continue

    # Sort signals by Power Score (Highest First)
    signals = sorted(signals, key=lambda x: x['score'], reverse=True)

    if not os.path.exists('public'): os.makedirs('public')
    output_data = {
        "marketHealthy": bool(m_healthy),
        "signals": signals,
        "lastUpdated": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    
    with open('public/signals.json', 'w') as f:
        json.dump(output_data, f, indent=4)
        
    print(f"✅ Saved {len(signals)} setups to dashboard.")

if __name__ == "__main__":
    run_web_scan()
