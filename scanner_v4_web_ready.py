# -*- coding: utf-8 -*-
"""
SwingScan Pro V6.7 - Advanced Power Ranking & Pattern Engine
This script identifies elite trading setups with institutional trend filters.
"""

import os
import json
import yfinance as yf
import pandas as pd
import pandas_ta as ta
import datetime
import urllib.request

# --- POWER RANKING ENGINE ---
def calculate_confluence_score(df, spy_data):
    """
    Calculates a conviction score from 1-100.
    Now includes Trend Alignment and Momentum bonuses.
    """
    score = 40 # Lower base to reward quality
    try:
        s_close = df['Close'].squeeze()
        s_vol = df['Volume'].squeeze()
        m_close = spy_data['Close'].squeeze()
        
        # 1. Bullish Stack (+10)
        # Price > 50MA > 200MA is the gold standard for uptrends
        ma50 = df['MA50'].iloc[-1]
        ma200 = df['MA200'].iloc[-1]
        if s_close.iloc[-1] > ma50 > ma200:
            score += 15

        # 2. MA Slope (+10)
        # Is the 50-day average actually rising?
        ma50_prev = df['MA50'].iloc[-5]
        if ma50 > ma50_prev:
            score += 10

        # 3. Relative Strength vs Market (+15)
        stock_return = s_close.pct_change(20).iloc[-1]
        market_return = m_close.pct_change(20).iloc[-1]
        if not pd.isna(stock_return) and not pd.isna(market_return):
            if stock_return > market_return: 
                score += 15

        # 4. Volume Intensity (+20)
        avg_vol = s_vol.tail(20).mean()
        curr_vol = s_vol.iloc[-1]
        if curr_vol > (avg_vol * 2.0): 
            score += 20
        elif curr_vol > (avg_vol * 1.5): 
            score += 10

        # 5. RSI 'Golden Zone' (+15)
        rsi_val = df.filter(like='RSI').iloc[-1]
        if isinstance(rsi_val, pd.Series): rsi_val = rsi_val.iloc[0]
        if 53 <= rsi_val <= 67: 
            score += 15
            
    except Exception:
        return 50 # Fallback
    
    return int(min(max(score, 1), 100))

def identify_pattern(df):
    """
    Identifies visual chart shapes using price action volatility.
    """
    try:
        recent = df.tail(15)
        highs = recent['High'].squeeze()
        lows = recent['Low'].squeeze()
        
        # Pennant: Lower Highs and Higher Lows
        highs_down = highs.iloc[0] > highs.iloc[-1]
        lows_up = lows.iloc[0] < lows.iloc[-1]
        
        # Bull Flag: Tight consolidation range
        range_pct = (highs.max() - lows.min()) / lows.min()
        
        if highs_down and lows_up: return "Pennant"
        if range_pct < 0.05: return "Bull Flag"
    except:
        pass
    
    return "Classic Breakout"

def get_full_market_list():
    """Scrapes major indices for the most liquid trading candidates."""
    tickers = set()
    opener = urllib.request.build_opener()
    opener.addheaders = [('User-agent', 'Mozilla/5.0')]
    try:
        # S&P 500
        url_sp = 'https://en.wikipedia.org/wiki/List_of_S%26P_500_companies'
        with opener.open(url_sp) as f:
            sp500 = pd.read_html(f)[0]['Symbol'].tolist()
            tickers.update(sp500)
        # Nasdaq 100
        url_ndx = 'https://en.wikipedia.org/wiki/Nasdaq-100'
        with opener.open(url_ndx) as f:
            ndx100 = pd.read_html(f)[4]['Ticker'].tolist()
            tickers.update(ndx100)
    except:
        return ['AAPL', 'MSFT', 'NVDA', 'TSLA', 'AMD', 'META', 'GOOGL', 'AMZN']
    
    return sorted([str(t).replace('.', '-') for t in tickers if str(t) != 'nan'])

def run_web_scan():
    """Main execution loop with advanced filtering."""
    all_tickers = get_full_market_list()
    
    # Get Market Benchmark (SPY)
    spy_hist = yf.download("SPY", period="1y", interval="1d", progress=False)
    if isinstance(spy_hist.columns, pd.MultiIndex): spy_hist.columns = spy_hist.columns.droplevel(1)
    
    # Market Health: SPY must be above its 50-day average
    spy_ma50 = spy_hist['Close'].rolling(50).mean().iloc[-1]
    m_healthy = spy_hist['Close'].iloc[-1] > spy_ma50
    
    signals = []
    print(f"🚀 Power-Scanning {len(all_tickers)} stocks...")

    for ticker in all_tickers:
        try:
            data = yf.download(ticker, period="1y", interval="1d", progress=False)
            if data.empty or len(data) < 200: continue # Need 200 days for MA200
            
            if isinstance(data.columns, pd.MultiIndex): 
                data.columns = data.columns.droplevel(1)

            # Technical Prep
            data['MA50'] = ta.sma(data['Close'], length=50)
            data['MA200'] = ta.sma(data['Close'], length=200)
            data.ta.rsi(append=True)
            
            close = data['Close'].iloc[-1]
            ma50 = data['MA50'].iloc[-1]
            rsi_series = data.filter(like='RSI')
            rsi = rsi_series.iloc[-1].iloc[0] if not rsi_series.empty else 50
            recent_high = float(data['High'].tail(20).max())

            # ADVANCED FILTER: Price above 50MA AND 50MA above 200MA (Bullish Trend)
            if close > ma50 and m_healthy and 40 < rsi < 70:
                # Proximity to 20-day high (Breakout zone)
                if close > (recent_high * 0.97):
                    signals.append({
                        "ticker": str(ticker),
                        "score": calculate_confluence_score(data, spy_hist),
                        "pattern": identify_pattern(data),
                        "currentPrice": round(float(close), 2),
                        "buyAt": round(recent_high, 2),
                        "goal": round(float(close) * 1.12, 2), # 12% profit target
                        "stopLoss": round(float(close) * 0.94, 2), # 6% protection
                        "rsi": round(float(rsi), 2)
                    })
        except: continue

    # Sort by Power Score (Highest First)
    signals = sorted(signals, key=lambda x: x['score'], reverse=True)

    if not os.path.exists('public'): os.makedirs('public')
    output_data = {
        "marketHealthy": bool(m_healthy),
        "signals": signals,
        "lastUpdated": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    
    with open('public/signals.json', 'w') as f:
        json.dump(output_data, f, indent=4)
        
    print(f"✅ Scan Complete. Saved {len(signals)} setups to signals.json.")

if __name__ == "__main__":
    run_web_scan()
